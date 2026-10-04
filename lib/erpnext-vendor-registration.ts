import { createHash, randomUUID } from "node:crypto";
import { claimSubmission, saveSubmissionState } from "./shared-store.ts";
import { createDoc, getDoc, getList, updateDoc, addTag, ErpnextClientError } from "./erpnext.ts";

/**
 * تسجيل مورد من الموقع (build.sa/register) كمستندات ERPNext أصلية:
 *   Supplier (+ Contact)  +  Party Specific Item (قدرات: Item Group / Brand)  +  Tags دورة الحياة.
 * المورد الجديد يبدأ: disabled=1 + prevent_rfqs=1 + tag build:pre-onboarding (غير مؤهل لـRFQ حتى يُفعَّل — spec §12).
 * لا Address عند التسجيل (الموقع لا يجمع عنواناً تفصيلياً) — يُضاف في onboarding.
 */

export class ErpnextVendorError extends Error {
  status: number;
  publicMessage: string;
  constructor(message: string, status = 503, publicMessage = "تعذر حفظ الطلب حالياً. حاول مرة أخرى بعد قليل.") {
    super(message);
    this.name = "ErpnextVendorError";
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export type ErpnextVendorInput = {
  establishment_name: string;
  country: string;
  country_code?: string;
  supplier_type: string; // local | international
  business_type: string;
  contact_name: string;
  job_title?: string;
  email: string;
  phone: string;
  category_names: string[]; // Arabic trade-category labels from the site
  brands: string[];
  short_description?: string;
  website?: string;
  other_category_suggestion?: string;
  preferred_language: string;
  fileNames?: string[];
};

export type ErpnextVendorResult = { status: "registered" | "already_registered"; supplier: string };

/** فئات الموقع الثماني → Item Groups أصلية في شجرة Build */
const CATEGORY_TO_ITEM_GROUP: Record<string, string> = {
  "الأدوات الصحية": "Sanitaryware",
  "الكهرباء والإنارة": "Electrical",
  "السباكة وأنظمة الأنابيب": "Plumbing",
  "التكييف والتهوية": "HVAC",
  "الأرضيات": "Tiles",
  "الجداريات": "Wall Finishes",
  "الدهانات الداخلية والخارجية": "Paints & Coatings",
  "اللواصق والمواد المساعدة": "Adhesives & Sealants",
};

const PRE_ONBOARDING_TAG = "build:pre-onboarding";

function supplierGroupFor(businessType: string): string {
  return businessType === "distributor" || businessType === "authorized_distributor" ? "Distributor" : "Local";
}

async function resolveCountryName(countryCode: string | undefined, cid: string): Promise<string | null> {
  if (!countryCode) return null;
  const rows = await getList<{ name: string }>("Country", {
    filters: [["code", "=", countryCode.toLowerCase()]],
    fields: ["name"],
    limit: 1,
    correlationId: cid,
  });
  return rows[0]?.name ?? null;
}

/** يجد Supplier مرتبطاً بجهة اتصال بنفس البريد/الجوال */
async function findSupplierByContact(email: string, phone: string, cid: string): Promise<string | null> {
  const byEmail = email ? await getList<{ name: string }>("Contact", { filters: [["email_id", "=", email]], fields: ["name"], limit: 1, correlationId: cid }) : [];
  const byPhone = !byEmail.length && phone ? await getList<{ name: string }>("Contact", { filters: [["mobile_no", "=", phone]], fields: ["name"], limit: 1, correlationId: cid }) : [];
  const contactName = byEmail[0]?.name || byPhone[0]?.name;
  if (!contactName) return null;
  const contact = await getDoc<{ links?: { link_doctype?: string; link_name?: string }[] }>("Contact", contactName, cid);
  const link = (contact.links || []).find((l) => l.link_doctype === "Supplier" && l.link_name);
  return link?.link_name ?? null;
}

async function ensureBrand(brand: string, cid: string): Promise<string | null> {
  const name = brand.trim();
  if (!name) return null;
  const existing = await getList<{ name: string }>("Brand", { filters: [["brand", "=", name]], fields: ["name"], limit: 1, correlationId: cid });
  if (existing[0]?.name) return existing[0].name;
  try {
    const created = await createDoc<{ name: string }>("Brand", { brand: name, description: "Supplier-declared brand (build.sa/register)" }, cid);
    return created.name;
  } catch (error) {
    if (error instanceof ErpnextClientError && error.kind === "conflict") return name;
    throw error;
  }
}

async function addPartySpecificItem(supplier: string, basedOn: "Item Group" | "Brand", value: string, cid: string): Promise<void> {
  // تجنّب التكرار
  const existing = await getList("Party Specific Item", {
    filters: [
      ["party_type", "=", "Supplier"],
      ["party", "=", supplier],
      ["restrict_based_on", "=", basedOn],
      ["based_on_value", "=", value],
    ],
    fields: ["name"],
    limit: 1,
    correlationId: cid,
  });
  if (existing.length) return;
  await createDoc(
    "Party Specific Item",
    { party_type: "Supplier", party: supplier, restrict_based_on: basedOn, based_on_value: value },
    cid
  );
}

export async function registerVendorInErpnext(input: ErpnextVendorInput): Promise<ErpnextVendorResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.establishment_name.trim();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([name.normalize("NFKC").toLowerCase().replace(/\s+/g, " "), input.country_code || input.country, email]))
    .digest("hex");
  const reference = `build:erpnext:vendor:${fingerprint}`;
  const correlationId = randomUUID();

  const claim = await claimSubmission(reference, { status: "processing", submissionId: fingerprint, correlationId });
  if (!claim.claimed) {
    if (claim.state.status === "completed" && claim.state.trackingNumber) {
      return { status: "already_registered", supplier: claim.state.trackingNumber };
    }
    throw new ErpnextVendorError("Registration already processing");
  }

  const complete = async (supplier: string) => {
    try {
      await saveSubmissionState(reference, { status: "completed", submissionId: fingerprint, correlationId, trackingNumber: supplier });
    } catch {
      console.error("[erpnext-vendor] unable to update submission cache", correlationId);
    }
  };

  try {
    // validate categories
    const unknown = input.category_names.filter((c) => !CATEGORY_TO_ITEM_GROUP[c]);
    if (!input.category_names.length || unknown.length) {
      throw new ErpnextVendorError("Invalid categories", 400, "فئة أو أكثر لم تعد متاحة. أعد تحميل الصفحة واختر من جديد.");
    }

    // dedup: by contact, else by name
    const viaContact = await findSupplierByContact(email, input.phone, correlationId);
    if (viaContact) {
      await complete(viaContact);
      return { status: "already_registered", supplier: viaContact };
    }
    const byName = await getList<{ name: string }>("Supplier", { filters: [["supplier_name", "=", name]], fields: ["name"], limit: 1, correlationId });
    if (byName[0]?.name) {
      await complete(byName[0].name);
      return { status: "already_registered", supplier: byName[0].name };
    }

    const countryName = await resolveCountryName(input.country_code, correlationId);

    const detailLines = [
      `Source: build.sa/register`,
      `Lifecycle: pre-onboarding`,
      `Supplier type: ${input.supplier_type}`,
      `Business type: ${input.business_type}`,
      `Brands: ${input.brands.join(", ") || "—"}`,
      `Categories: ${input.category_names.join(", ")}`,
      input.other_category_suggestion ? `Other category: ${input.other_category_suggestion}` : null,
      input.short_description ? `Description: ${input.short_description}` : null,
      input.fileNames?.length ? `Declared files: ${input.fileNames.join(", ")}` : null,
      `Submitted: ${new Date().toISOString()}`,
    ].filter(Boolean);

    // create Supplier (pre-onboarding: disabled + RFQ-blocked)
    const supplier = await createDoc<{ name: string }>(
      "Supplier",
      {
        supplier_name: name,
        supplier_type: "Company",
        supplier_group: supplierGroupFor(input.business_type),
        ...(countryName ? { country: countryName } : {}),
        ...(input.country_code === "SA" ? { default_currency: "SAR" } : {}),
        website: input.website || undefined,
        language: input.preferred_language === "ar" ? "ar" : "en",
        disabled: 1,
        prevent_rfqs: 1,
        supplier_details: detailLines.join("\n"),
      },
      correlationId
    );

    // lifecycle tag
    try {
      await addTag("Supplier", supplier.name, PRE_ONBOARDING_TAG, correlationId);
    } catch {
      /* الوسم تحسيني */
    }

    // Contact (primary) linked to supplier
    const [firstName, ...rest] = input.contact_name.trim().split(/\s+/);
    try {
      const contact = await createDoc<{ name: string }>(
        "Contact",
        {
          first_name: firstName || input.contact_name,
          last_name: rest.join(" ") || undefined,
          designation: input.job_title || undefined,
          company_name: name,
          is_primary_contact: 1,
          email_ids: email ? [{ email_id: email, is_primary: 1 }] : [],
          phone_nos: input.phone ? [{ phone: input.phone, is_primary_mobile_no: 1 }] : [],
          links: [{ link_doctype: "Supplier", link_name: supplier.name }],
        },
        correlationId
      );
      await updateDoc("Supplier", supplier.name, { supplier_primary_contact: contact.name }, correlationId).catch(() => {});
    } catch {
      /* جهة الاتصال تحسينية — لا تُفشل التسجيل */
    }

    // Party Specific Item: capabilities (Item Group per category + Brand per declared brand)
    for (const cat of input.category_names) {
      const group = CATEGORY_TO_ITEM_GROUP[cat];
      try {
        await addPartySpecificItem(supplier.name, "Item Group", group, correlationId);
      } catch {
        /* قدرة واحدة لا تُفشل التسجيل */
      }
    }
    for (const brand of input.brands) {
      const brandName = await ensureBrand(brand, correlationId).catch(() => null);
      if (brandName) {
        try {
          await addPartySpecificItem(supplier.name, "Brand", brandName, correlationId);
        } catch {
          /* قدرة واحدة لا تُفشل التسجيل */
        }
      }
    }

    await complete(supplier.name);
    return { status: "registered", supplier: supplier.name };
  } catch (error) {
    await saveSubmissionState(reference, { status: "failed", submissionId: fingerprint, correlationId }).catch(() => {});
    if (error instanceof ErpnextClientError) {
      throw new ErpnextVendorError(error.message, error.kind === "validation" || error.kind === "conflict" ? 400 : 503, error.publicMessage);
    }
    throw error;
  }
}
