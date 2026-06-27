import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  applyERPNextWorkflow,
  completeERPNextSupplierProfile,
  getERPNextDocument,
  attachERPNextFileToDocument,
  updateERPNextDocument,
} from "@/lib/erpnext";
import { sendVendorProfileSubmittedNotification } from "@/lib/email";
import { runSupplierAgent } from "@/lib/build-agents";
import {
  identityVerificationErrorMessage,
  normalizeNationalAddress,
  runSupplierIdentityVerification,
} from "@/lib/supplier-identity-verification";
import { extractSupplierFieldsFromDocs, verifySupplierDocuments } from "@/lib/supplier-document-verification";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { verifyEmailToken } from "@/lib/otp";
import { verifyVendorOnboardingToken } from "@/lib/vendor-onboarding-token";
import { verifyUploadAttachToken } from "@/lib/upload-token";

const completeSchema = z.object({
  onboarding_token: z.string().min(10),
  email_verified_token: z.string(),
  vendor_type: z.string().trim().min(1),
  represented_brands: z.string().trim().optional().or(z.literal("")),
  product_categories: z.array(z.string().trim().min(1)).min(1),
  coverage_regions: z.array(z.string().trim().min(1)).min(1),
  has_warehouse: z.boolean(),
  offers_credit: z.boolean(),
  credit_limit: z.number().nonnegative().nullable().optional(),
  payment_terms: z.array(z.string().trim().min(1)).min(1),
  worked_on_gov_projects: z.boolean(),
  bank_name: z.string().trim().min(2),
  iban: z.string().trim().regex(/^SA\d{22}$/i),
  iban_account_name: z.string().trim().min(2, "اسم صاحب الحساب في خطاب البنك مطلوب"),
  cr_name_on_document: z.string().trim().min(2, "اسم المنشأة في السجل التجاري مطلوب"),
  // الرقم الضريبي والعنوان الوطني لم يعودا إدخالًا يدويًا — يُستخلصان من المستندات المرفوعة
  cr_document_name: z.string().optional(),
  cr_attach_token: z.string().optional(),
  bank_letter_name: z.string().optional(),
  bank_letter_attach_token: z.string().optional(),
  vat_document_name: z.string().optional(),
  vat_attach_token: z.string().optional(),
  address_document_name: z.string().optional(),
  address_attach_token: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "إكمال ملف المورد");

  const parsed = completeSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الملف غير مكتملة أو غير صحيحة" }, { status: 400 });
  }

  const data = parsed.data;
  const tokenParts = data.onboarding_token.split(".");
  const supplierName = decodeURIComponent(tokenParts[0] || "");

  const supplier = await getERPNextDocument<{
    name: string;
    supplier_name: string;
    build_email?: string;
    build_cr_number?: string;
    build_supplier_stage?: string;
    build_profile_completed?: number;
  }>("Supplier", supplierName);

  if (!supplier?.build_email) {
    return NextResponse.json({ error: "المورد غير موجود" }, { status: 404 });
  }

  if (supplier.build_supplier_stage !== "Approved") {
    return NextResponse.json({ error: "لم تتم الموافقة على طلبكم" }, { status: 403 });
  }

  if (supplier.build_profile_completed) {
    return NextResponse.json({ error: "تم إكمال الملف مسبقاً" }, { status: 409 });
  }

  if (!verifyVendorOnboardingToken(supplier.name, supplier.build_email, data.onboarding_token)) {
    return NextResponse.json({ error: "انتهت صلاحية رابط الدعوة" }, { status: 401 });
  }

  if (!verifyEmailToken(supplier.build_email, data.email_verified_token)) {
    return NextResponse.json({ error: "يجب التحقق من البريد الإلكتروني أولاً" }, { status: 400 });
  }

  // استخلاص الرقم الضريبي والعنوان الوطني من المستندات المرفوعة (fail-safe — يُراجَع بشريًا)
  const extracted = await extractSupplierFieldsFromDocs({
    vatFileName: data.vat_document_name,
    addressFileName: data.address_document_name,
  }).catch((e) => {
    console.error("Supplier field extraction failed:", e);
    return { taxNumber: "", nationalAddress: "", lines: ["⚠️ تعذّر الاستخلاص الآلي — يُراجَع يدويًا."], complete: false };
  });

  const identity = runSupplierIdentityVerification({
    establishment_name: supplier.supplier_name,
    cr_number: supplier.build_cr_number || "",
    cr_name_on_document: data.cr_name_on_document,
    iban_account_name: data.iban_account_name,
    tax_number: extracted.taxNumber,
    national_address: extracted.nationalAddress,
    iban: data.iban,
  });

  const identityError = identityVerificationErrorMessage(identity);
  if (identityError) {
    return NextResponse.json({ error: identityError }, { status: 400 });
  }

  const agent = runSupplierAgent({
    establishment_name: supplier.supplier_name,
    cr_number: supplier.build_cr_number || "",
    product_categories: data.product_categories,
    coverage_regions: data.coverage_regions,
    has_warehouse: data.has_warehouse,
    offers_credit: data.offers_credit,
    worked_on_gov_projects: data.worked_on_gov_projects,
    payment_terms: data.payment_terms,
    identity: {
      cr_name_on_document: data.cr_name_on_document,
      iban_account_name: data.iban_account_name,
      tax_number: extracted.taxNumber,
      national_address: normalizeNationalAddress(extracted.nationalAddress),
      iban: data.iban,
    },
  });

  // تدقيق آلي استشاري لمحتوى المستندات المرفوعة (لا يرفض الطلب — يحذّر المراجع)
  const docCheck = await verifySupplierDocuments({
    crFileName: data.cr_document_name,
    bankFileName: data.bank_letter_name,
    crNumber: supplier.build_cr_number || "",
    taxNumber: extracted.taxNumber,
    crNameTyped: data.cr_name_on_document,
    ibanTyped: data.iban,
    ibanAccountNameTyped: data.iban_account_name,
  }).catch((e) => {
    console.error("Supplier document verification failed:", e);
    return null;
  });

  try {
    await completeERPNextSupplierProfile(supplier.name, {
      vendor_type: data.vendor_type,
      represented_brands: data.represented_brands,
      product_categories: data.product_categories,
      coverage_regions: data.coverage_regions,
      has_warehouse: data.has_warehouse,
      offers_credit: data.offers_credit,
      credit_limit: data.credit_limit,
      payment_terms: data.payment_terms,
      worked_on_gov_projects: data.worked_on_gov_projects,
      bank_name: data.bank_name,
      iban: data.iban,
      iban_account_name: data.iban_account_name,
      cr_document_name: data.cr_name_on_document,
      tax_number: extracted.taxNumber,
      national_address: normalizeNationalAddress(extracted.nationalAddress),
      identity_match_score: identity.matchScore,
      verification_status:
        identity.verificationStatus === "Verified" && !docCheck?.hasReadableMismatch && extracted.complete
          ? "Profile Submitted"
          : "Needs More Information",
      agent_summary: `${agent.summary}\n\n${extracted.lines.join("\n")}${docCheck ? `\n\n${docCheck.lines.join("\n")}` : ""}`,
      agent_score: agent.score,
      agent_catalog_groups: agent.catalogGroups.join(", "),
      rfq_priority: agent.priority,
    });

    if (
      data.cr_document_name &&
      data.cr_attach_token &&
      verifyUploadAttachToken(data.cr_document_name, data.cr_attach_token)
    ) {
      await attachERPNextFileToDocument(data.cr_document_name, "Supplier", supplier.name);
    }

    if (
      data.bank_letter_name &&
      data.bank_letter_attach_token &&
      verifyUploadAttachToken(data.bank_letter_name, data.bank_letter_attach_token)
    ) {
      await attachERPNextFileToDocument(data.bank_letter_name, "Supplier", supplier.name);
    }

    if (
      data.vat_document_name &&
      data.vat_attach_token &&
      verifyUploadAttachToken(data.vat_document_name, data.vat_attach_token)
    ) {
      await attachERPNextFileToDocument(data.vat_document_name, "Supplier", supplier.name);
    }

    if (
      data.address_document_name &&
      data.address_attach_token &&
      verifyUploadAttachToken(data.address_document_name, data.address_attach_token)
    ) {
      await attachERPNextFileToDocument(data.address_document_name, "Supplier", supplier.name);
    }

    try {
      await applyERPNextWorkflow("Supplier", supplier.name, "Review");
    } catch (workflowError) {
      console.error("Supplier profile workflow transition failed:", workflowError);
      await updateERPNextDocument("Supplier", supplier.name, {
        build_supplier_stage: "Under Review",
        build_verification_status: "Profile Submitted",
      });
    }

    void sendVendorProfileSubmittedNotification({
      id: supplier.name,
      establishment_name: supplier.supplier_name,
      email: supplier.build_email || "",
    }).catch((e) => console.error("Profile submitted notification failed:", e));
  } catch (error) {
    console.error("Supplier profile completion failed:", error);
    return NextResponse.json({ error: "تعذر حفظ ملف التوريد" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: supplier.name });
}