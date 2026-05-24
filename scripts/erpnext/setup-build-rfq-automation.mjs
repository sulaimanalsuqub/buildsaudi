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

const clientScript = String.raw`
async function create_build_rfq_from_opportunity(frm) {
  const existing = await frappe.db.get_list("Request for Quotation", {
    fields: ["name"],
    filters: [
      ["Request for Quotation", "build_opportunity", "=", frm.doc.name],
      ["Request for Quotation", "docstatus", "!=", 2],
    ],
    limit: 1,
  });

  if (existing && existing.length) {
    frappe.show_alert({
      message: __("يوجد RFQ مرتبط مسبقاً"),
      indicator: "orange",
    });
    frappe.set_route("Form", "Request for Quotation", existing[0].name);
    return;
  }

  const today = frappe.datetime.get_today();
  const deliveryDate = frm.doc.build_delivery_date || today;
  const requiredMaterials = frm.doc.build_required_materials || frm.doc.title || "Build material request";

  const rfq = await frappe.db.insert({
    doctype: "Request for Quotation",
    company: frm.doc.company || frappe.defaults.get_user_default("Company"),
    transaction_date: today,
    schedule_date: deliveryDate,
    build_opportunity: frm.doc.name,
    build_project_name: frm.doc.build_project_name || frm.doc.title,
    build_customer_name: frm.doc.customer_name || frm.doc.party_name,
    build_contact_phone: frm.doc.build_contact_phone || frm.doc.phone,
    build_delivery_address: frm.doc.build_delivery_address,
    build_delivery_date: deliveryDate,
    build_required_materials: requiredMaterials,
    build_boq_file_url: frm.doc.build_boq_file_url,
    build_internal_notes: frm.doc.build_customer_notes,
    message_for_supplier: __("يرجى تزويدنا بعرض سعر للمواد المطلوبة حسب تفاصيل الطلب المرفقة.") + "\n\n" + requiredMaterials,
    items: [
      {
        item_code: "BUILD-MATERIALS-REQUEST",
        description: requiredMaterials,
        qty: 1,
        uom: "Nos",
        schedule_date: deliveryDate,
      },
    ],
  });

  frappe.show_alert({
    message: __("تم إنشاء RFQ"),
    indicator: "green",
  });
  frappe.set_route("Form", "Request for Quotation", rfq.name);
}

frappe.ui.form.on("Opportunity", {
  refresh(frm) {
    if (frm.is_new() || frm.doc.opportunity_type !== "Build Product Request") {
      return;
    }

    frm.add_custom_button(__("إنشاء RFQ لبيلد"), () => {
      frappe.dom.freeze(__("جاري إنشاء RFQ..."));
      create_build_rfq_from_opportunity(frm)
        .catch((error) => {
          frappe.msgprint({
            title: __("تعذر إنشاء RFQ"),
            indicator: "red",
            message: error.message || error,
          });
        })
        .finally(() => frappe.dom.unfreeze());
    }, __("Build"));
  },
});
`;

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

const serverScriptName = await findByFilters("Server Script", [
  ["Server Script", "api_method", "=", "build_create_rfq_from_opportunity"],
]);

let savedServerScript = null;
if (serverScriptName) {
  savedServerScript = await upsert("Server Script", serverScriptName, {
    disabled: 1,
  });
}

const clientScriptName = await findByFilters("Client Script", [
  ["Client Script", "dt", "=", "Opportunity"],
]);

const savedClientScript = await upsert("Client Script", clientScriptName, {
  dt: "Opportunity",
  view: "Form",
  enabled: 1,
  script: clientScript.trim(),
}, "Build Opportunity RFQ Button");

console.log(JSON.stringify({
  ok: true,
  serverScript: savedServerScript,
  clientScript: savedClientScript,
}, null, 2));
