import { createHash, randomUUID } from "node:crypto";
import { claimSubmission, saveSubmissionState } from "./shared-store.ts";

// This flow uses only native Odoo models; the former x_build_* models and
// Build-OPT server are not dependencies of public supplier registration.
export class VendorRegistrationError extends Error {
  status: number;
  publicMessage: string;
  constructor(message: string, status = 503, publicMessage = "تعذر حفظ الطلب حالياً. حاول مرة أخرى بعد قليل.") {
    super(message);
    this.status = status;
    this.publicMessage = publicMessage;
  }
}

export async function vendorOdooCall<T>(model: string, method: string, params: Record<string, unknown>): Promise<T> {
  const base = (process.env.VENDOR_ODOO_BASE_URL || process.env.ODOO_BASE_URL)?.replace(/\/$/, "");
  const database = process.env.VENDOR_ODOO_DATABASE || process.env.ODOO_DATABASE;
  const key = process.env.VENDOR_ODOO_API_KEY || process.env.ODOO_API_KEY;
  if (!base || !database || !key) throw new VendorRegistrationError("Odoo is not configured");
  try {
    const response = await fetch(`${base}/json/2/${model}/${method}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "X-Odoo-Database": database, "Content-Type": "application/json" },
      body: JSON.stringify(params), cache: "no-store", signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new VendorRegistrationError(`Odoo ${model}.${method}: HTTP ${response.status}`);
    return await response.json() as T;
  } catch (error) {
    if (error instanceof VendorRegistrationError) throw error;
    // Never log request credentials or Odoo error bodies, and never blindly retry writes.
    throw new VendorRegistrationError(`Odoo ${model}.${method}: connection failed`);
  }
}

export async function listVendorCategories(): Promise<{ id: string; nameAr: string; nameEn: string }[]> {
  const labels = [
    ["الأدوات الصحية", "Sanitaryware & Bath Fittings"],
    ["الكهرباء والإنارة", "Electrical & Lighting"],
    ["السباكة وأنظمة الأنابيب", "Plumbing & Piping Systems"],
    ["التكييف والتهوية", "HVAC"],
    ["الأرضيات", "Tiles & Flooring"],
    ["الجداريات", "Wall Finishes & Coverings"],
    ["الدهانات الداخلية والخارجية", "Paints & Coatings"],
    ["اللواصق والمواد المساعدة", "Adhesives, Grouts & Sealants"],
  ] as const;
  const names = labels.map(([name]) => name);
  const tags = await vendorOdooCall<{ id: number; name: string }[]>("res.partner.category", "search_read", {
    domain: [["name", "in", names]], fields: ["id", "name"], order: "name", limit: 100,
  });
  const ids = new Set(tags.map((tag) => tag.name));
  return labels.filter(([name]) => ids.has(name)).map(([nameAr, nameEn]) => ({ id: nameAr, nameAr, nameEn }));
}

export type VendorCommercialOptions = {
  currencies: { id: number; name: string; symbol: string }[];
  paymentTerms: { id: number; name: string }[];
  paymentMethods: { id: number; name: string }[];
  incoterms: { id: number; code: string; name: string }[];
};

const commercialOptionsCache = new Map<"ar" | "en", { expiresAt: number; value: VendorCommercialOptions }>();

export async function listVendorCommercialOptions(language: "ar" | "en" = "ar"): Promise<VendorCommercialOptions> {
  const cached = commercialOptionsCache.get(language);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  const context = { lang: language === "ar" ? "ar_001" : "en_US" };
  const currencies = await vendorOdooCall<VendorCommercialOptions["currencies"]>("res.currency", "search_read", {
    domain: [["active", "=", true]], fields: ["id", "name", "symbol"], order: "name", limit: 100,
  });
  const paymentTerms = await vendorOdooCall<VendorCommercialOptions["paymentTerms"]>("account.payment.term", "search_read", {
    domain: [], fields: ["id", "name"], order: "name", limit: 100, context,
  });
  const paymentMethods = await vendorOdooCall<{ id: number; name: string; payment_method_id: [number, string] | false }[]>("account.payment.method.line", "search_read", {
    domain: [["payment_type", "=", "outbound"], ["company_id", "!=", false]], fields: ["id", "name", "payment_method_id"], order: "id", limit: 100, context,
  });
  const incoterms = await vendorOdooCall<VendorCommercialOptions["incoterms"]>("account.incoterms", "search_read", {
    domain: [], fields: ["id", "code", "name"], order: "code", limit: 100, context,
  });
  const seenMethodNames = new Set<string>();
  const value = {
    currencies,
    paymentTerms,
    paymentMethods: paymentMethods
      .map((method) => ({ id: method.id, name: Array.isArray(method.payment_method_id) ? method.payment_method_id[1] : method.name }))
      .filter((method) => !seenMethodNames.has(method.name) && !!seenMethodNames.add(method.name)),
    incoterms,
  };
  commercialOptionsCache.set(language, { value, expiresAt: Date.now() + 5 * 60_000 });
  return value;
}

export type VendorRegistrationInput = {
  establishment_name: string; country: string; country_code?: string;
  supplier_type: string; business_type: string; contact_name: string; job_title?: string;
  email: string; phone: string; category_names: string[]; brands: string[];
  short_description?: string; website?: string;
  other_category_suggestion?: string; preferred_language: string;
  supplier_currency_id?: number; supplier_payment_term_id?: number; supplier_payment_method_line_id?: number;
  purchase_incoterm_id?: number; purchase_incoterm_location?: string;
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!));
const escapeLike = (text: string) => text.replace(/[\\%_]/g, "\\$&");

export async function registerVendor(input: VendorRegistrationInput): Promise<{ status: "registered" | "already_registered"; vendorId: number }> {
  const email = input.email.trim().toLowerCase();
  const name = input.establishment_name.trim();
  const fingerprint = createHash("sha256").update(JSON.stringify([
    name.normalize("NFKC").toLowerCase().replace(/\s+/g, " "), input.country_code || input.country, email,
  ])).digest("hex");
  const reference = `build:vendor:${fingerprint}`;
  const correlationId = randomUUID();
  const claim = await claimSubmission(reference, { status: "processing", submissionId: fingerprint, correlationId });
  if (!claim.claimed) {
    if (claim.state.status === "completed" && claim.state.requestId) return { status: "already_registered", vendorId: claim.state.requestId };
    throw new VendorRegistrationError("Registration already processing");
  }
  const lookup = (domain: unknown[]) => vendorOdooCall<{ id: number }[]>("res.partner", "search_read", {
    domain, fields: ["id"], limit: 1, context: { active_test: false },
  });
  const complete = async (id: number) => {
    try {
      await saveSubmissionState(reference, { status: "completed", submissionId: fingerprint, correlationId, requestId: id });
    } catch {
      // The durable Odoo reference still lets the next request reconcile the saved supplier.
      console.error("[vendor-registration] unable to update submission cache", correlationId);
    }
  };
  try {
    const previous = await lookup([["ref", "=", reference]]);
    if (previous.length) { await complete(previous[0].id); return { status: "already_registered", vendorId: previous[0].id }; }

    const categories = await listVendorCategories();
    if (!input.category_names.length || input.category_names.some((name) => !categories.some((c) => c.id === name))) {
      throw new VendorRegistrationError("Invalid categories", 400, "فئة أو أكثر لم تعد متاحة. أعد تحميل الصفحة واختر من جديد.");
    }
    const [countries, tags] = await Promise.all([
      input.country_code ? vendorOdooCall<{ id: number }[]>("res.country", "search_read", {
        domain: [["code", "=", input.country_code]], fields: ["id"], limit: 1,
      }) : Promise.resolve([]),
      vendorOdooCall<{ id: number; name: string }[]>("res.partner.category", "search_read", {
        domain: [["name", "in", ["Supplier", "pending_review", ...input.category_names]]], fields: ["id", "name"], context: { lang: "ar_001" },
      }),
    ]);
    if (input.country_code && !countries.length) throw new VendorRegistrationError("Invalid country", 400);
    if (!tags.some((t) => t.name === "Supplier") || !tags.some((t) => t.name === "pending_review")) {
      throw new VendorRegistrationError("Supplier review tags are not configured");
    }
    const countryId = countries[0]?.id || false;
    const duplicate = await lookup([
      ["is_company", "=", true], ["supplier_rank", ">", 0], ["country_id", "=", countryId],
      ["name", "=ilike", escapeLike(name)], "|", ["email", "=ilike", escapeLike(email)], ["phone", "=", input.phone],
    ]);
    if (duplicate.length) { await complete(duplicate[0].id); return { status: "already_registered", vendorId: duplicate[0].id }; }

    const selectedCategoryTags = tags.filter((tag) => input.category_names.includes(tag.name));
    if (selectedCategoryTags.length !== input.category_names.length) {
      throw new VendorRegistrationError("Supplier category tags are not configured");
    }
    const details = [
      ["Source", "build.sa/register"], ["Status", "pending_review"],
      ["Submitted at", new Date().toISOString()], ["Country", input.country],
      ["Supplier type", input.supplier_type], ["Business type", input.business_type],
      ["Brands", input.brands.join(", ")],
      ["Other category", input.other_category_suggestion], ["Description", input.short_description],
      ["Preferred language", input.preferred_language],
      ["Privacy policy accepted", "Yes"], ["Registration terms accepted", "Yes"],
    ];
    const vals = {
      name, ref: reference, is_company: true, supplier_rank: 1, country_id: countryId,
      email, phone: input.phone, website: input.website || false,
      property_purchase_currency_id: input.supplier_currency_id || false,
      property_supplier_payment_term_id: input.supplier_payment_term_id || false,
      property_outbound_payment_method_line_id: input.supplier_payment_method_line_id || false,
      purchase_incoterm_id: input.purchase_incoterm_id || false,
      purchase_incoterm_location: input.purchase_incoterm_location || false,
      lang: input.preferred_language === "ar" ? "ar_001" : "en_US",
      // Standard Odoo Contacts tags: supplier lifecycle tags + the eight Build product categories.
      category_id: [[6, 0, [...tags.filter((t) => t.name === "Supplier" || t.name === "pending_review" || input.category_names.includes(t.name)).map((t) => t.id)]]],
      comment: details.filter(([, value]) => value).map(([label, value]) => `<p><strong>${escapeHtml(label!)}:</strong> ${escapeHtml(value!)}</p>`).join(""),
      // Nested create is one Odoo transaction: company and contact succeed or fail together.
      child_ids: [[0, 0, { name: input.contact_name, function: input.job_title || false, email, phone: input.phone, type: "contact" }]],
    };
    let id: number;
    try {
      const ids = await vendorOdooCall<number[]>("res.partner", "create", {
        vals_list: [vals], context: { tracking_disable: true, mail_create_nosubscribe: true, mail_create_nolog: true },
      });
      if (!Array.isArray(ids) || !Number.isInteger(ids[0]) || ids[0] <= 0) throw new VendorRegistrationError("Invalid Odoo create result");
      id = ids[0];
    } catch (error) {
      // A timeout can arrive after Odoo committed. Reconcile, never retry create blindly.
      const saved = await lookup([["ref", "=", reference]]).catch(() => []);
      if (!saved.length) throw error;
      id = saved[0].id;
    }
    await complete(id);
    return { status: "registered", vendorId: id };
  } catch (error) {
    await saveSubmissionState(reference, {
      status: "failed", submissionId: fingerprint, correlationId,
      retryAfter: error instanceof VendorRegistrationError && error.status === 400 ? Date.now() : undefined,
    }).catch(() => {});
    throw error;
  }
}
