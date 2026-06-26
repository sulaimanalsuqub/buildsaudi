type ERPNextRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
};

type ERPNextListResponse<T> = {
  data: T[];
};

type ERPNextDocumentResponse<T> = {
  data: T;
};

type ERPNextUploadResponse = {
  message: {
    name: string;
    file_name?: string;
    file_url: string;
  };
};

export type ERPNextMaterialItem = {
  item_name: string;
  description: string;
  quantity: number;
  uom: string;
  category: string;
  specifications: string;
  confidence: number;
  source: string;
};

function getERPNextConfig() {
  const baseUrl = process.env.ERPNEXT_URL?.replace(/\/$/, "");
  const apiToken = process.env.ERPNEXT_API_TOKEN;

  if (!baseUrl || !apiToken) {
    throw new Error("ERPNext is not configured");
  }

  return { baseUrl, apiToken };
}

async function erpnextRequest<T>(path: string, options: ERPNextRequestOptions = {}): Promise<T> {
  const { baseUrl, apiToken } = getERPNextConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Authorization: `token ${apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("abort") || msg.includes("signal")) {
      throw new Error(`ERPNext request timed out: ${path}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail = json?._server_messages ?? json?.exception ?? json?.exc_type ?? text;
    const detailStr = typeof detail === "string" ? detail : JSON.stringify(detail);
    // تسجيل التفاصيل الكاملة في سجلات السيرفر فقط — لا تُرسل للـ client
    console.error(`[ERPNext] ${options.method ?? "GET"} ${path} → ${res.status}:`, detailStr);
    throw new Error(`ERPNext error: ${res.status}`);
  }

  return json as T;
}

function encodeDocType(doctype: string) {
  return encodeURIComponent(doctype);
}

export async function createERPNextDocument<T>(doctype: string, data: Record<string, unknown>): Promise<T> {
  const response = await erpnextRequest<ERPNextDocumentResponse<T>>(`/api/resource/${encodeDocType(doctype)}`, {
    method: "POST",
    body: { data: { doctype, ...data } },
  });

  return response.data;
}

export async function applyERPNextWorkflow<T extends Record<string, unknown>>(
  doctype: string,
  name: string,
  action: string
): Promise<T> {
  const doc = await getERPNextDocument<T>(doctype, name);
  if (!doc) throw new Error(`${doctype} not found: ${name}`);
  const response = await erpnextRequest<{ message: T }>("/api/method/frappe.model.workflow.apply_workflow", {
    method: "POST",
    body: { doc, action },
  });
  return response.message;
}

export async function deleteERPNextDocument(doctype: string, name: string) {
  await erpnextRequest(`/api/resource/${encodeDocType(doctype)}/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
}

export async function updateERPNextDocument<T>(
  doctype: string,
  name: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await erpnextRequest<ERPNextDocumentResponse<T>>(
    `/api/resource/${encodeDocType(doctype)}/${encodeURIComponent(name)}`,
    {
      method: "PUT",
      body: data,
    }
  );

  return response.data;
}

export async function uploadERPNextFile(file: File) {
  const { baseUrl, apiToken } = getERPNextConfig();
  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("is_private", "1");
  formData.append("folder", "Home/Attachments");

  const res = await fetch(`${baseUrl}/api/method/upload_file`, {
    method: "POST",
    headers: {
      Authorization: `token ${apiToken}`,
      Accept: "application/json",
    },
    body: formData,
    cache: "no-store",
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail = json?._server_messages ?? json?.exception ?? json?.exc_type ?? text;
    const detailStr = typeof detail === "string" ? detail : JSON.stringify(detail);
    console.error(`[ERPNext] POST /api/method/upload_file → ${res.status}:`, detailStr);
    throw new Error(`ERPNext upload error: ${res.status}`);
  }

  const uploaded = (json as ERPNextUploadResponse).message;
  return {
    name: uploaded.name,
    fileName: uploaded.file_name ?? uploaded.name,
    fileUrl: uploaded.file_url,
  };
}

export async function getERPNextDocument<T>(doctype: string, name: string): Promise<T | null> {
  try {
    const response = await erpnextRequest<ERPNextDocumentResponse<T>>(
      `/api/resource/${encodeDocType(doctype)}/${encodeURIComponent(name)}`
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function attachERPNextFileToDocument(fileName: string, doctype: string, docname: string) {
  const file = await getERPNextDocument<{
    name: string;
    attached_to_doctype?: string | null;
    attached_to_name?: string | null;
    is_private?: number;
  }>("File", fileName);

  if (!file) {
    throw new Error("File not found");
  }
  if (file.attached_to_doctype && file.attached_to_name) {
    throw new Error("File already attached");
  }

  return updateERPNextDocument<{ name: string }>("File", fileName, {
    attached_to_doctype: doctype,
    attached_to_name: docname,
  });
}

export async function getERPNextList<T>(
  doctype: string,
  params: {
    fields?: string[];
    filters?: unknown[];
    limit?: number;
  } = {}
): Promise<T[]> {
  const query = new URLSearchParams();
  if (params.fields) query.set("fields", JSON.stringify(params.fields));
  if (params.filters) query.set("filters", JSON.stringify(params.filters));
  if (params.limit) query.set("limit_page_length", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await erpnextRequest<ERPNextListResponse<T>>(`/api/resource/${encodeDocType(doctype)}${suffix}`);
  return response.data;
}

export async function findSupplierByCrNumber(crNumber: string) {
  const rows = await getERPNextList<{ name: string }>("Supplier", {
    fields: ["name"],
    filters: [["Supplier", "build_cr_number", "=", crNumber]],
    limit: 1,
  });
  return rows[0] ?? null;
}

export async function createERPNextSupplierBasicRegistration(vendor: {
  establishment_name: string;
  manager_name: string;
  contact_number: string;
  email: string;
  cr_number: string;
}) {
  if (await findSupplierByCrNumber(vendor.cr_number)) {
    const error = new Error("رقم السجل التجاري مسجل مسبقاً");
    error.name = "DuplicateSupplier";
    throw error;
  }

  return createERPNextDocument<{ name: string }>("Supplier", {
    supplier_name: vendor.establishment_name,
    supplier_type: "Company",
    supplier_group: "Build Pre-Registered Suppliers",
    build_supplier_stage: "Pre Registration",
    build_website_source: 1,
    build_profile_completed: 0,
    build_manager_name: vendor.manager_name,
    build_contact_number: vendor.contact_number,
    build_email: vendor.email,
    build_cr_number: vendor.cr_number,
    build_verification_status: "Pending",
    supplier_details: [
      `Responsible Person: ${vendor.manager_name}`,
      `Contact Number: ${vendor.contact_number}`,
      `Email: ${vendor.email}`,
      `CR Number: ${vendor.cr_number}`,
      "Registration Phase: Basic (awaiting admin approval)",
    ].join("\n"),
  });
}

export async function completeERPNextSupplierProfile(
  supplierName: string,
  vendor: {
    vendor_type: string;
    represented_brands?: string;
    product_categories: string[];
    coverage_regions: string[];
    has_warehouse: boolean;
    offers_credit: boolean;
    credit_limit?: number | null;
    payment_terms: string[];
    worked_on_gov_projects: boolean;
    bank_name: string;
    iban: string;
    cr_document_url?: string;
    bank_letter_url?: string;
    agent_summary?: string;
    agent_score?: number;
    agent_catalog_groups?: string;
    rfq_priority?: string;
  }
) {
  return updateERPNextDocument<{ name: string }>("Supplier", supplierName, {
    build_vendor_type: vendor.vendor_type,
    build_product_categories: vendor.product_categories.join(", "),
    build_represented_brands: vendor.represented_brands || "",
    build_coverage_regions: vendor.coverage_regions.join(", "),
    build_has_warehouse: vendor.has_warehouse ? 1 : 0,
    build_offers_credit: vendor.offers_credit ? 1 : 0,
    build_payment_terms: vendor.payment_terms.join(", "),
    build_credit_limit: vendor.credit_limit ?? 0,
    build_gov_projects: vendor.worked_on_gov_projects ? 1 : 0,
    build_bank_name: vendor.bank_name,
    build_iban: vendor.iban.toUpperCase(),
    build_cr_document_url: vendor.cr_document_url || "",
    build_bank_letter_url: vendor.bank_letter_url || "",
    build_profile_completed: 1,
    build_profile_completed_at: new Date().toISOString().slice(0, 19).replace("T", " "),
    build_verification_status: "Profile Submitted",
    build_preferred_for_rfq: 0,
    build_rfq_priority: "Standard",
    build_agent_summary: vendor.agent_summary,
    build_agent_score: vendor.agent_score,
    build_agent_catalog_groups: vendor.agent_catalog_groups,
  });
}

/** @deprecated Use createERPNextSupplierBasicRegistration + completeERPNextSupplierProfile */
export async function createERPNextSupplierRegistration(vendor: {
  establishment_name: string;
  manager_name: string;
  contact_number: string;
  email: string;
  cr_number: string;
  vendor_type: string;
  represented_brands?: string;
  product_categories: string[];
  coverage_regions: string[];
  has_warehouse: boolean;
  offers_credit: boolean;
  credit_limit?: number | null;
  payment_terms: string[];
  worked_on_gov_projects: boolean;
}) {
  const created = await createERPNextSupplierBasicRegistration(vendor);
  await completeERPNextSupplierProfile(created.name, {
    vendor_type: vendor.vendor_type,
    represented_brands: vendor.represented_brands,
    product_categories: vendor.product_categories,
    coverage_regions: vendor.coverage_regions,
    has_warehouse: vendor.has_warehouse,
    offers_credit: vendor.offers_credit,
    credit_limit: vendor.credit_limit,
    payment_terms: vendor.payment_terms,
    worked_on_gov_projects: vendor.worked_on_gov_projects,
    bank_name: "",
    iban: "",
  });
  return created;
}

export async function resolveOrCreateLead(params: {
  client_name: string;
  phone: string;
  client_email?: string;
}): Promise<{ name: string }> {
  const [byEmailPhone, byPhone] = await Promise.all([
    params.client_email
      ? getERPNextList<{ name: string }>("Lead", {
          fields: ["name"],
          filters: [
            ["Lead", "email_id", "=", params.client_email],
            ["Lead", "mobile_no", "=", params.phone],
          ],
          limit: 1,
        })
      : Promise.resolve([] as { name: string }[]),
    getERPNextList<{ name: string }>("Lead", {
      fields: ["name"],
      filters: [["Lead", "mobile_no", "=", params.phone]],
      limit: 1,
    }),
  ]);

  const existing = byEmailPhone[0] ?? byPhone[0];
  if (existing) return existing;

  return createERPNextDocument<{ name: string }>("Lead", {
    lead_name: params.client_name,
    company_name: params.client_name,
    email_id: params.client_email || undefined,
    mobile_no: params.phone,
    status: "Lead",
  });
}

export async function createERPNextProductOpportunity(quote: {
  project_name: string;
  client_name: string;
  phone: string;
  client_email?: string;
  contact_method?: "email" | "whatsapp";
  materials?: string;
  delivery_address: string;
  delivery_date: string;
  notes?: string;
  boq_file_url?: string | null;
  extracted_items?: ERPNextMaterialItem[];
  resolved_lead?: { name: string };
}) {
  const materialSummary = quote.materials || "يرجى مراجعة ملف الكميات أو الرابط المرفق.";

  const lead = quote.resolved_lead ?? await resolveOrCreateLead({
    client_name: quote.client_name,
    phone: quote.phone,
    client_email: quote.client_email,
  });

  const extractedItems = quote.extracted_items || [];

  return createERPNextDocument<{ name: string }>("Opportunity", {
    opportunity_from: "Lead",
    party_name: lead.name,
    title: quote.project_name,
    opportunity_type: "Build Product Request",
    status: "Open",
    company: "ايفاد",
    build_request_source: "Build Website",
    build_request_stage: "New Product Request",
    build_project_name: quote.project_name,
    build_contact_phone: quote.phone,
    build_contact_email: quote.client_email || "",
    build_contact_method: quote.contact_method || "whatsapp",
    build_delivery_address: quote.delivery_address,
    build_delivery_date: quote.delivery_date,
    build_required_materials: materialSummary,
    build_boq_file_url: quote.boq_file_url || "",
    build_material_extraction_status: extractedItems.length ? "Extracted" : "Needs Review",
    build_material_extraction_summary: extractedItems.length
      ? `Extracted ${extractedItems.length} material item(s) from website request. Review before RFQ.`
      : "No structured material items were extracted. Review the raw request before RFQ.",
    build_extracted_material_items: extractedItems.map((item, index) => ({
      doctype: "Build Request Material Item",
      idx: index + 1,
      build_item_name: item.item_name,
      build_description: item.description,
      build_quantity: item.quantity,
      build_uom: item.uom,
      build_category: item.category,
      build_specifications: item.specifications,
      build_confidence: item.confidence,
      build_source: item.source,
      build_review_status: "Needs Review",
    })),
    build_customer_notes: [
      materialSummary,
      quote.notes ? `Notes: ${quote.notes}` : "",
      quote.boq_file_url ? `BOQ File: ${quote.boq_file_url}` : "",
    ].filter(Boolean).join("\n\n"),
    build_agent_summary: "🤖 جاري تحليل الطلب بواسطة وكيل Build...",
  });
}
