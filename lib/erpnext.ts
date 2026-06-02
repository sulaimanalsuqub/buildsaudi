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
  const res = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `token ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

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

export async function attachERPNextFileToDocument(fileName: string, doctype: string, docname: string) {
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
  const duplicates = await getERPNextList<{ name: string }>("Supplier", {
    fields: ["name"],
    filters: [
      ["Supplier", "build_cr_number", "=", vendor.cr_number],
    ],
    limit: 1,
  });

  if (duplicates.length > 0) {
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
    build_manager_name: vendor.manager_name,
    build_contact_number: vendor.contact_number,
    build_email: vendor.email,
    build_cr_number: vendor.cr_number,
    build_vendor_type: vendor.vendor_type,
    build_product_categories: vendor.product_categories.join(", "),
    build_represented_brands: vendor.represented_brands || "",
    build_coverage_regions: vendor.coverage_regions.join(", "),
    build_has_warehouse: vendor.has_warehouse ? 1 : 0,
    build_offers_credit: vendor.offers_credit ? 1 : 0,
    build_payment_terms: vendor.payment_terms.join(", "),
    build_credit_limit: vendor.credit_limit ?? 0,
    build_gov_projects: vendor.worked_on_gov_projects ? 1 : 0,
    supplier_details: [
      `Responsible Person: ${vendor.manager_name}`,
      `Contact Number: ${vendor.contact_number}`,
      `Email: ${vendor.email}`,
      `CR Number: ${vendor.cr_number}`,
    ].join("\n"),
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
}) {
  const materialSummary = quote.materials || "يرجى مراجعة ملف الكميات أو الرابط المرفق.";
  let lead = quote.client_email
    ? (await getERPNextList<{ name: string }>("Lead", {
        fields: ["name"],
        filters: [["Lead", "email_id", "=", quote.client_email]],
        limit: 1,
      }))[0]
    : undefined;

  if (!lead) {
    lead = (await getERPNextList<{ name: string }>("Lead", {
      fields: ["name"],
      filters: [["Lead", "mobile_no", "=", quote.phone]],
      limit: 1,
    }))[0];
  }

  if (!lead) {
    lead = await createERPNextDocument<{ name: string }>("Lead", {
      lead_name: quote.client_name,
      company_name: quote.client_name,
      email_id: quote.client_email || undefined,
      mobile_no: quote.phone,
      status: "Lead",
      source: "Website",
    });
  }

  const extractedItems = quote.extracted_items || [];

  return createERPNextDocument<{ name: string }>("Opportunity", {
    opportunity_from: "Lead",
    party_name: lead.name,
    title: quote.project_name,
    opportunity_type: "Build Product Request",
    status: "Open",
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
  });
}
