const baseUrl = process.env.ERPNEXT_URL?.replace(/\/$/, "") || "https://build.k.frappe.cloud";
const apiToken = process.env.ERPNEXT_API_TOKEN;

if (!apiToken) {
  throw new Error("ERPNEXT_API_TOKEN is required");
}

const headers = {
  Authorization: `token ${apiToken}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(JSON.stringify(json || text));
  }
  return json;
}

async function findByFilters(doctype, filters) {
  const params = new URLSearchParams({
    fields: JSON.stringify(["name"]),
    filters: JSON.stringify(filters),
    limit_page_length: "1",
  });
  const result = await request(`/api/resource/${encodeURIComponent(doctype)}?${params}`);
  return result.data?.[0]?.name || null;
}

async function upsert(doctype, name, data, fallbackName) {
  if (name) {
    await request(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return name;
  }

  const created = await request(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    body: JSON.stringify({ data: { doctype, name: fallbackName, ...data } }),
  });
  return created.data.name;
}

async function ensureDocType() {
  const existing = await findByFilters("DocType", [["DocType", "name", "=", "Build Request Material Item"]]);
  const data = {
    name: "Build Request Material Item",
    module: "Core",
    custom: 1,
    istable: 1,
    editable_grid: 1,
    fields: [
      { idx: 1, fieldname: "build_item_name", label: "اسم المادة", fieldtype: "Data", reqd: 1, in_list_view: 1, columns: 3 },
      { idx: 2, fieldname: "build_quantity", label: "الكمية", fieldtype: "Float", in_list_view: 1, columns: 1 },
      { idx: 3, fieldname: "build_uom", label: "الوحدة", fieldtype: "Data", in_list_view: 1, columns: 1 },
      { idx: 4, fieldname: "build_category", label: "الفئة", fieldtype: "Data", in_list_view: 1, columns: 2 },
      { idx: 5, fieldname: "build_confidence", label: "الثقة", fieldtype: "Percent", in_list_view: 1, columns: 1 },
      { idx: 6, fieldname: "build_review_status", label: "حالة المراجعة", fieldtype: "Select", options: "Needs Review\nApproved\nRejected", default: "Needs Review", in_list_view: 1, columns: 2 },
      { idx: 7, fieldname: "build_description", label: "الوصف", fieldtype: "Small Text" },
      { idx: 8, fieldname: "build_specifications", label: "المواصفات", fieldtype: "Small Text" },
      { idx: 9, fieldname: "build_item_code", label: "الصنف في الكتالوج", fieldtype: "Link", options: "Item" },
      { idx: 10, fieldname: "build_source", label: "مصدر الاستخراج", fieldtype: "Select", options: "ai\nfallback\nmanual", default: "fallback" },
      { idx: 11, fieldname: "build_notes", label: "ملاحظات داخلية", fieldtype: "Small Text" },
    ],
    permissions: [],
  };

  return upsert("DocType", existing, data, "Build Request Material Item");
}

async function ensureCustomField(fieldname, data) {
  const name = await findByFilters("Custom Field", [
    ["Custom Field", "dt", "=", "Opportunity"],
    ["Custom Field", "fieldname", "=", fieldname],
  ]);

  return upsert("Custom Field", name, {
    dt: "Opportunity",
    fieldname,
    ...data,
  }, `Opportunity-${fieldname}`);
}

const childDoctype = await ensureDocType();

const customFields = [];
customFields.push(await ensureCustomField("build_material_extraction_section", {
  label: "تحليل المواد",
  fieldtype: "Section Break",
  insert_after: "build_customer_notes",
}));
customFields.push(await ensureCustomField("build_material_extraction_status", {
  label: "حالة تحليل المواد",
  fieldtype: "Select",
  options: "Pending\nExtracted\nNeeds Review\nFailed",
  default: "Pending",
  insert_after: "build_material_extraction_section",
}));
customFields.push(await ensureCustomField("build_material_extraction_summary", {
  label: "ملخص تحليل المواد",
  fieldtype: "Long Text",
  insert_after: "build_material_extraction_status",
}));
customFields.push(await ensureCustomField("build_extracted_material_items", {
  label: "بنود المواد المستخرجة",
  fieldtype: "Table",
  options: "Build Request Material Item",
  insert_after: "build_material_extraction_summary",
}));

console.log(JSON.stringify({
  ok: true,
  childDoctype,
  customFields,
}, null, 2));
