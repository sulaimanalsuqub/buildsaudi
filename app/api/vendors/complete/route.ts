import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  createOutboxEvent,
  findDuplicateInternationalProfile,
  findDuplicateLocalProfile,
  listSupplierDocuments,
  normalizeCR,
  normalizeVAT,
  read,
  resolveCountryId,
  resolveOrCreateBrands,
  resolveOrCreateCategories,
  updateSupplierProfile,
} from "@/lib/odoo";
import { resolveOnboardingProfile } from "@/lib/vendor-onboarding-guard";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";

const EDITABLE_STATUSES = new Set(["completing_profile", "more_information_required"]);

const localFieldsSchema = z.object({
  legal_name: z.string().trim().min(2),
  trade_name: z.string().trim().optional().or(z.literal("")),
  entity_type: z.string().trim().min(1),
  cr_number: z.string().trim().min(5),
  cr_expiry_date: z.string().trim().optional().or(z.literal("")),
  unified_number: z.string().trim().optional().or(z.literal("")),
  vat_number: z.string().trim().min(5),
  city: z.string().trim().min(1),
  region: z.string().trim().min(1),
  national_address: z.string().trim().optional().or(z.literal("")),
  postal_code: z.string().trim().optional().or(z.literal("")),
  building_number: z.string().trim().optional().or(z.literal("")),
  additional_number: z.string().trim().optional().or(z.literal("")),
});

const internationalFieldsSchema = z.object({
  legal_company_name: z.string().trim().min(2),
  trading_name: z.string().trim().optional().or(z.literal("")),
  country_of_registration: z.string().trim().min(1),
  registration_number: z.string().trim().min(2),
  registration_doc_type: z.string().trim().optional().or(z.literal("")),
  registration_issue_date: z.string().trim().optional().or(z.literal("")),
  registration_expiry_date: z.string().trim().optional().or(z.literal("")),
  foreign_tax_id: z.string().trim().optional().or(z.literal("")),
  intl_address: z.string().trim().optional().or(z.literal("")),
  intl_city: z.string().trim().optional().or(z.literal("")),
  intl_postal_code: z.string().trim().optional().or(z.literal("")),
  manufacturing_country: z.string().trim().optional().or(z.literal("")),
  exporting_country: z.string().trim().optional().or(z.literal("")),
  countries_served: z.string().trim().optional().or(z.literal("")),
  dispatch_location: z.string().trim().optional().or(z.literal("")),
  factory_location: z.string().trim().optional().or(z.literal("")),
  port_of_loading: z.string().trim().optional().or(z.literal("")),
  incoterms: z.string().trim().optional().or(z.literal("")),
  export_lead_time_days: z.number().nonnegative().optional(),
});

const bankFieldsSchema = z.object({
  bank_name: z.string().trim().min(2),
  beneficiary_name: z.string().trim().min(2),
  iban: z
    .string()
    .trim()
    .refine((v) => /^[A-Za-z0-9]{8,40}$/.test(v.replace(/\s/g, "")), "رقم الآيبان/الحساب غير صحيح"),
  bank_account_number: z.string().trim().optional().or(z.literal("")),
  swift_bic: z.string().trim().optional().or(z.literal("")),
  account_currency: z.string().trim().optional().or(z.literal("")),
  account_country: z.string().trim().optional().or(z.literal("")),
});

const BUSINESS_TYPES = [
  "manufacturer",
  "authorized_distributor",
  "distributor",
  "importer",
  "exporter",
  "trader",
  "service_provider",
] as const;

const businessFieldsSchema = z.object({
  business_type: z.enum(BUSINESS_TYPES),
  material_categories: z.array(z.string().trim().min(1)).min(1),
  brands: z.array(z.string().trim().min(1)).optional().default([]),
  service_areas: z.array(z.string().trim().min(1)).optional().default([]),
  delivery_cities: z.string().trim().optional().or(z.literal("")),
  avg_lead_time_days: z.number().nonnegative().optional(),
  min_order_value: z.number().nonnegative().optional(),
  payment_terms: z.array(z.string().trim().min(1)).min(1),
  accepted_currencies: z.array(z.string().trim().min(1)).optional().default([]),
  offers_delivery: z.boolean().optional(),
  delivery_included: z.boolean().optional(),
  accepts_urgent: z.boolean().optional(),
  offers_samples: z.boolean().optional(),
  accepts_alternatives: z.boolean().optional(),
  working_hours: z.string().trim().optional().or(z.literal("")),
});

const contactsFieldsSchema = z.object({
  company_phone: z.string().trim().optional().or(z.literal("")),
  sales_contact_name: z.string().trim().optional().or(z.literal("")),
  sales_contact_email: z.string().trim().email().optional().or(z.literal("")),
  accounts_contact_name: z.string().trim().optional().or(z.literal("")),
  accounts_contact_email: z.string().trim().email().optional().or(z.literal("")),
  operations_contact_name: z.string().trim().optional().or(z.literal("")),
  operations_contact_email: z.string().trim().email().optional().or(z.literal("")),
});

const productsFieldsSchema = z.object({
  brand_relationship_type: z.enum(["manufacturer", "authorized_distributor", "distributor", "trader"]).optional(),
  product_scope_description: z.string().trim().optional().or(z.literal("")),
  has_product_api: z.boolean().optional(),
  has_price_api: z.boolean().optional(),
  price_update_method: z.enum(["manual", "excel", "csv", "api", "email"]).optional(),
  price_update_frequency: z.string().trim().optional().or(z.literal("")),
  price_currency: z.string().trim().optional().or(z.literal("")),
  prices_include_tax: z.boolean().optional(),
  prices_include_delivery: z.boolean().optional(),
  product_notes: z.string().trim().optional().or(z.literal("")),
});

const completeSchema = z.object({
  onboarding_token: z.string().min(10),
  local: localFieldsSchema.optional(),
  international: internationalFieldsSchema.optional(),
  bank: bankFieldsSchema,
  business: businessFieldsSchema,
  contacts: contactsFieldsSchema,
  products: productsFieldsSchema,
});

type ProfileRow = { x_studio_supplier_type: "local" | "international" };

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "إكمال ملف المورد");

  const parsed = completeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الملف غير مكتملة أو غير صحيحة" }, { status: 400 });
  }
  const data = parsed.data;

  const resolved = await resolveOnboardingProfile(data.onboarding_token, EDITABLE_STATUSES);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { profileId } = resolved;

  try {
    const rows = await read<ProfileRow>("x_build_supplier_profile", [profileId], ["x_studio_supplier_type"]);
    const supplierType = rows[0]?.x_studio_supplier_type;
    if (!supplierType) {
      return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
    }

    if (supplierType === "local" && !data.local) {
      return NextResponse.json({ error: "بيانات المنشأة المحلية مطلوبة" }, { status: 400 });
    }
    if (supplierType === "international" && !data.international) {
      return NextResponse.json({ error: "بيانات الشركة الدولية مطلوبة" }, { status: 400 });
    }

    // فحص تكرار نهائي — يمنع إفلات مورد بنفس السجل/الرقم عبر مسارين متزامنين
    if (supplierType === "local" && data.local) {
      const dup = await findDuplicateLocalProfile(data.local.cr_number, data.local.vat_number, profileId);
      if (dup) {
        return NextResponse.json({ error: "السجل التجاري أو الرقم الضريبي مسجّل مسبقاً لمورد آخر" }, { status: 409 });
      }
    }
    let countryOfRegistrationId: number | false = false;
    let manufacturingCountryId: number | false = false;
    let exportingCountryId: number | false = false;
    let accountCountryId: number | false = false;

    if (supplierType === "international" && data.international) {
      countryOfRegistrationId = await resolveCountryId(data.international.country_of_registration);
      if (!countryOfRegistrationId) {
        return NextResponse.json({ error: "دولة التسجيل غير معروفة — تحقق من الاسم" }, { status: 400 });
      }
      if (data.international.manufacturing_country) {
        manufacturingCountryId = await resolveCountryId(data.international.manufacturing_country);
      }
      if (data.international.exporting_country) {
        exportingCountryId = await resolveCountryId(data.international.exporting_country);
      }

      const dup = await findDuplicateInternationalProfile(
        countryOfRegistrationId,
        data.international.registration_number,
        profileId
      );
      if (dup) {
        return NextResponse.json({ error: "رقم التسجيل مسجّل مسبقاً لمورد آخر بنفس الدولة" }, { status: 409 });
      }
    }
    if (data.bank.account_country) {
      accountCountryId = await resolveCountryId(data.bank.account_country);
    }

    // مستندات إلزامية قبل الإرسال للمراجعة النهائية
    const documents = await listSupplierDocuments(profileId);
    const hasType = (t: string) => documents.some((d) => d.x_studio_document_type === t);
    const requiredMissing: string[] = [];
    if (!hasType("bank_letter")) requiredMissing.push("خطاب بنكي");
    if (supplierType === "local" && !hasType("cr_certificate")) requiredMissing.push("السجل التجاري");
    if (supplierType === "international" && !hasType("registration_certificate")) requiredMissing.push("شهادة التسجيل");
    if (requiredMissing.length) {
      return NextResponse.json(
        { error: `مستندات مطلوبة قبل الإرسال: ${requiredMissing.join("، ")}` },
        { status: 400 }
      );
    }

    const categoryIds = await resolveOrCreateCategories(data.business.material_categories);
    const brandIds = data.business.brands.length ? await resolveOrCreateBrands(data.business.brands) : [];

    const fields: Record<string, unknown> = {
      // النطاق التجاري
      x_studio_business_type: data.business.business_type,
      x_studio_material_category_ids: [[6, 0, categoryIds]],
      x_studio_brand_ids: brandIds.length ? [[6, 0, brandIds]] : false,
      x_studio_delivery_cities: data.business.delivery_cities || false,
      x_studio_avg_lead_time_days: data.business.avg_lead_time_days ?? false,
      x_studio_min_order_value: data.business.min_order_value ?? false,
      x_studio_payment_terms: data.business.payment_terms.join(", "),
      x_studio_accepted_currencies: data.business.accepted_currencies.join(", ") || false,
      x_studio_offers_delivery: Boolean(data.business.offers_delivery),
      x_studio_delivery_included: Boolean(data.business.delivery_included),
      x_studio_accepts_urgent: Boolean(data.business.accepts_urgent),
      x_studio_offers_samples: Boolean(data.business.offers_samples),
      x_studio_accepts_alternatives: Boolean(data.business.accepts_alternatives),
      x_studio_working_hours: data.business.working_hours || false,

      // جهات الاتصال
      x_studio_company_phone: data.contacts.company_phone || false,
      x_studio_sales_contact_name: data.contacts.sales_contact_name || false,
      x_studio_sales_contact_email: data.contacts.sales_contact_email || false,
      x_studio_accounts_contact_name: data.contacts.accounts_contact_name || false,
      x_studio_accounts_contact_email: data.contacts.accounts_contact_email || false,
      x_studio_operations_contact_name: data.contacts.operations_contact_name || false,
      x_studio_operations_contact_email: data.contacts.operations_contact_email || false,

      // البنك
      x_studio_bank_name: data.bank.bank_name,
      x_studio_beneficiary_name: data.bank.beneficiary_name,
      x_studio_iban: data.bank.iban.replace(/\s/g, "").toUpperCase(),
      x_studio_bank_account_number: data.bank.bank_account_number || false,
      x_studio_swift_bic: data.bank.swift_bic || false,
      x_studio_account_currency: data.bank.account_currency || false,
      x_studio_account_country: accountCountryId,

      // المنتجات والكتالوج (حقول فقط — بلا إنشاء منتجات Odoo تلقائياً)
      x_studio_brand_relationship_type: data.products.brand_relationship_type || false,
      x_studio_product_scope_description: data.products.product_scope_description || false,
      x_studio_has_product_api: Boolean(data.products.has_product_api),
      x_studio_has_price_api: Boolean(data.products.has_price_api),
      x_studio_price_update_method: data.products.price_update_method || false,
      x_studio_price_update_frequency: data.products.price_update_frequency || false,
      x_studio_price_currency: data.products.price_currency || false,
      x_studio_prices_include_tax: Boolean(data.products.prices_include_tax),
      x_studio_prices_include_delivery: Boolean(data.products.prices_include_delivery),
      x_studio_product_notes: data.products.product_notes || false,

      // الحالة والإرسال للمراجعة النهائية
      x_studio_profile_completed: true,
      x_studio_status: "under_final_review",
      x_studio_submitted_for_review_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    if (supplierType === "local" && data.local) {
      Object.assign(fields, {
        x_studio_legal_name: data.local.legal_name,
        x_studio_trade_name: data.local.trade_name || false,
        x_studio_entity_type: data.local.entity_type,
        x_studio_cr_number: normalizeCR(data.local.cr_number),
        x_studio_cr_expiry_date: data.local.cr_expiry_date || false,
        x_studio_unified_number: data.local.unified_number || false,
        x_studio_vat_number: normalizeVAT(data.local.vat_number),
        x_studio_city: data.local.city,
        x_studio_region: data.local.region,
        x_studio_national_address: data.local.national_address || false,
        x_studio_postal_code: data.local.postal_code || false,
        x_studio_building_number: data.local.building_number || false,
        x_studio_additional_number: data.local.additional_number || false,
      });
    } else if (supplierType === "international" && data.international) {
      Object.assign(fields, {
        x_studio_legal_company_name: data.international.legal_company_name,
        x_studio_trading_name: data.international.trading_name || false,
        x_studio_country_of_registration: countryOfRegistrationId,
        x_studio_registration_number: data.international.registration_number.trim().toLowerCase(),
        x_studio_registration_doc_type: data.international.registration_doc_type || false,
        x_studio_registration_issue_date: data.international.registration_issue_date || false,
        x_studio_registration_expiry_date: data.international.registration_expiry_date || false,
        x_studio_foreign_tax_id: data.international.foreign_tax_id || false,
        x_studio_intl_address: data.international.intl_address || false,
        x_studio_intl_city: data.international.intl_city || false,
        x_studio_intl_postal_code: data.international.intl_postal_code || false,
        x_studio_manufacturing_country: manufacturingCountryId,
        x_studio_exporting_country: exportingCountryId,
        x_studio_countries_served: data.international.countries_served || false,
        x_studio_dispatch_location: data.international.dispatch_location || false,
        x_studio_factory_location: data.international.factory_location || false,
        x_studio_port_of_loading: data.international.port_of_loading || false,
        x_studio_incoterms: data.international.incoterms || false,
        x_studio_export_lead_time_days: data.international.export_lead_time_days ?? false,
      });
    }

    await updateSupplierProfile(profileId, fields);

    await createOutboxEvent({
      eventType: "supplier.profile_submitted_final_review",
      resourceModel: "x_build_supplier_profile",
      resourceId: profileId,
      supplierProfileId: profileId,
      idempotencyKey: `supplier-final-submit-${profileId}`,
      payload: { profile_id: profileId },
    });

    return NextResponse.json({ ok: true, profile_id: profileId, status: "under_final_review" });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[vendors/complete][${error.correlationId}] ${error.kind}: ${error.message}`);
      if (error.kind === "conflict") {
        return NextResponse.json({ error: "بيانات مكررة — تحقق من السجل التجاري/الرقم الضريبي" }, { status: 409 });
      }
      return NextResponse.json({ error: "تعذر حفظ ملف التوريد" }, { status: 500 });
    }
    console.error("Supplier profile completion failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حفظ ملف التوريد" }, { status: 500 });
  }
}
