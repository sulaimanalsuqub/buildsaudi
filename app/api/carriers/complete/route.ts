import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  OdooClientError,
  createOutboxEvent,
  findDuplicateInternationalCarrierProfile,
  findDuplicateLocalCarrierProfile,
  listOnboardingDocuments,
  normalizeCR,
  normalizeVAT,
  read,
  resolveCountryId,
  resolveOrCreateCategories,
  resolveOrCreateServiceAreas,
  resolveOrCreateVehicleTypes,
  updateOnboardingProfile,
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

const operationsFieldsSchema = z.object({
  activity_type: z.string().trim().optional().or(z.literal("")),
  service_areas: z.array(z.string().trim().min(1)).min(1),
  vehicle_types: z.array(z.string().trim().min(1)).min(1),
  material_categories: z.array(z.string().trim().min(1)).optional().default([]),
  covered_countries: z.string().trim().optional().or(z.literal("")),
  usual_routes: z.string().trim().optional().or(z.literal("")),
  load_capacity: z.string().trim().optional().or(z.literal("")),
  payment_terms: z.string().trim().optional().or(z.literal("")),
  min_trip_value: z.number().nonnegative().optional(),
  has_loading: z.boolean().optional(),
  has_unloading: z.boolean().optional(),
  has_crane: z.boolean().optional(),
  has_insurance: z.boolean().optional(),
  has_tracking: z.boolean().optional(),
  urgent_shipping: z.boolean().optional(),
  multi_supplier_consolidation: z.boolean().optional(),
  multi_location_delivery: z.boolean().optional(),
  licenses: z.string().trim().optional().or(z.literal("")),
});

const completeSchema = z.object({
  onboarding_token: z.string().min(10),
  local: localFieldsSchema.optional(),
  international: internationalFieldsSchema.optional(),
  bank: bankFieldsSchema,
  operations: operationsFieldsSchema,
});

type ProfileRow = { x_studio_carrier_type: "local" | "international" };

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "إكمال ملف الناقل");

  const parsed = completeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الملف غير مكتملة أو غير صحيحة" }, { status: 400 });
  }
  const data = parsed.data;

  const resolved = await resolveOnboardingProfile(data.onboarding_token, EDITABLE_STATUSES, "carrier");
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const { profileId } = resolved;

  try {
    const rows = await read<ProfileRow>("x_build_carrier_profile", [profileId], ["x_studio_carrier_type"]);
    const carrierType = rows[0]?.x_studio_carrier_type;
    if (!carrierType) {
      return NextResponse.json({ error: "الناقل غير موجود" }, { status: 404 });
    }

    if (carrierType === "local" && !data.local) {
      return NextResponse.json({ error: "بيانات المنشأة المحلية مطلوبة" }, { status: 400 });
    }
    if (carrierType === "international" && !data.international) {
      return NextResponse.json({ error: "بيانات الشركة الدولية مطلوبة" }, { status: 400 });
    }

    if (carrierType === "local" && data.local) {
      const dup = await findDuplicateLocalCarrierProfile(data.local.cr_number, data.local.vat_number, profileId);
      if (dup) {
        return NextResponse.json({ error: "السجل التجاري أو الرقم الضريبي مسجّل مسبقاً لناقل آخر" }, { status: 409 });
      }
    }

    let countryOfRegistrationId: number | false = false;
    let accountCountryId: number | false = false;

    if (carrierType === "international" && data.international) {
      countryOfRegistrationId = await resolveCountryId(data.international.country_of_registration);
      if (!countryOfRegistrationId) {
        return NextResponse.json({ error: "دولة التسجيل غير معروفة — تحقق من الاسم" }, { status: 400 });
      }

      const dup = await findDuplicateInternationalCarrierProfile(
        countryOfRegistrationId,
        data.international.registration_number,
        profileId
      );
      if (dup) {
        return NextResponse.json({ error: "رقم التسجيل مسجّل مسبقاً لناقل آخر بنفس الدولة" }, { status: 409 });
      }
    }
    if (data.bank.account_country) {
      accountCountryId = await resolveCountryId(data.bank.account_country);
    }

    // مستندات إلزامية قبل الإرسال للمراجعة النهائية: ترخيص النقل + التأمين + خطاب بنكي
    const documents = await listOnboardingDocuments("carrier", profileId);
    const hasType = (t: string) => documents.some((d) => d.x_studio_document_type === t);
    const requiredMissing: string[] = [];
    if (!hasType("bank_letter")) requiredMissing.push("خطاب بنكي");
    if (!hasType("license")) requiredMissing.push("ترخيص النقل");
    if (!hasType("insurance")) requiredMissing.push("وثيقة التأمين");
    if (carrierType === "local" && !hasType("cr_certificate")) requiredMissing.push("السجل التجاري");
    if (carrierType === "international" && !hasType("registration_certificate")) requiredMissing.push("شهادة التسجيل");
    if (requiredMissing.length) {
      return NextResponse.json(
        { error: `مستندات مطلوبة قبل الإرسال: ${requiredMissing.join("، ")}` },
        { status: 400 }
      );
    }

    const [serviceAreaIds, vehicleTypeIds, materialCategoryIds] = await Promise.all([
      resolveOrCreateServiceAreas(data.operations.service_areas),
      resolveOrCreateVehicleTypes(data.operations.vehicle_types),
      resolveOrCreateCategories(data.operations.material_categories),
    ]);

    const fields: Record<string, unknown> = {
      // نطاق الخدمة
      x_studio_activity_type: data.operations.activity_type || false,
      x_studio_service_area_ids: [[6, 0, serviceAreaIds]],
      x_studio_vehicle_type_ids: [[6, 0, vehicleTypeIds]],
      x_studio_material_category_ids: materialCategoryIds.length ? [[6, 0, materialCategoryIds]] : false,
      x_studio_covered_countries: data.operations.covered_countries || false,
      x_studio_usual_routes: data.operations.usual_routes || false,
      x_studio_load_capacity: data.operations.load_capacity || false,
      x_studio_payment_terms: data.operations.payment_terms || false,
      x_studio_min_trip_value: data.operations.min_trip_value ?? false,
      x_studio_has_loading: Boolean(data.operations.has_loading),
      x_studio_has_unloading: Boolean(data.operations.has_unloading),
      x_studio_has_crane: Boolean(data.operations.has_crane),
      x_studio_has_insurance: Boolean(data.operations.has_insurance),
      x_studio_has_tracking: Boolean(data.operations.has_tracking),
      x_studio_urgent_shipping: Boolean(data.operations.urgent_shipping),
      x_studio_multi_supplier_consolidation: Boolean(data.operations.multi_supplier_consolidation),
      x_studio_multi_location_delivery: Boolean(data.operations.multi_location_delivery),
      x_studio_licenses: data.operations.licenses || false,

      // البنك
      x_studio_bank_name: data.bank.bank_name,
      x_studio_beneficiary_name: data.bank.beneficiary_name,
      x_studio_iban: data.bank.iban.replace(/\s/g, "").toUpperCase(),
      x_studio_bank_account_number: data.bank.bank_account_number || false,
      x_studio_swift_bic: data.bank.swift_bic || false,
      x_studio_account_currency: data.bank.account_currency || false,
      x_studio_account_country: accountCountryId,

      // الحالة والإرسال للمراجعة النهائية
      x_studio_profile_completed: true,
      x_studio_status: "under_final_review",
      x_studio_submitted_for_review_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    if (carrierType === "local" && data.local) {
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
    } else if (carrierType === "international" && data.international) {
      Object.assign(fields, {
        x_studio_legal_company_name: data.international.legal_company_name,
        x_studio_trading_name: data.international.trading_name || false,
        x_studio_country_of_registration: countryOfRegistrationId,
        x_studio_registration_number: data.international.registration_number.trim().toLowerCase(),
        x_studio_registration_doc_type: data.international.registration_doc_type || false,
        x_studio_registration_issue_date: data.international.registration_issue_date || false,
        x_studio_registration_expiry_date: data.international.registration_expiry_date || false,
      });
    }

    await updateOnboardingProfile("carrier", profileId, fields);

    await createOutboxEvent({
      eventType: "carrier.profile_submitted_final_review",
      resourceModel: "x_build_carrier_profile",
      resourceId: profileId,
      carrierProfileId: profileId,
      idempotencyKey: `carrier-final-submit-${profileId}`,
      payload: { profile_id: profileId },
    });

    return NextResponse.json({ ok: true, profile_id: profileId, status: "under_final_review" });
  } catch (error) {
    if (error instanceof OdooClientError) {
      console.error(`[carriers/complete][${error.correlationId}] ${error.kind}: ${error.message}`);
      if (error.kind === "conflict") {
        return NextResponse.json({ error: "بيانات مكررة — تحقق من السجل التجاري/الرقم الضريبي" }, { status: 409 });
      }
      return NextResponse.json({ error: "تعذر حفظ ملف الناقل" }, { status: 500 });
    }
    console.error("Carrier profile completion failed (unexpected):", error);
    return NextResponse.json({ error: "تعذر حفظ ملف الناقل" }, { status: 500 });
  }
}
