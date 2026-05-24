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

function build_money(value) {
  return format_currency(flt(value || 0), "SAR");
}

function build_escape(value) {
  return frappe.utils.escape_html(value || "");
}

async function show_build_supplier_quote_comparison(frm) {
  const supplierQuotations = await frappe.db.get_list("Supplier Quotation", {
    fields: [
      "name",
      "supplier",
      "supplier_name",
      "status",
      "transaction_date",
      "valid_till",
      "grand_total",
      "rounded_total",
      "build_rfq",
      "build_delivery_lead_time",
      "build_supplier_response_notes",
    ],
    filters: [
      ["Supplier Quotation", "build_opportunity", "=", frm.doc.name],
      ["Supplier Quotation", "docstatus", "!=", 2],
    ],
    order_by: "grand_total asc",
    limit: 50,
  });

  if (!supplierQuotations.length) {
    frappe.msgprint({
      title: __("لا توجد عروض موردين"),
      indicator: "orange",
      message: __("لم يتم تسجيل عروض موردين مرتبطة بهذا الطلب حتى الآن."),
    });
    return;
  }

  const rows = supplierQuotations.map((quote, index) => {
    const total = quote.rounded_total || quote.grand_total || 0;
    const bestBadge = index === 0
      ? '<span class="indicator-pill green">' + __("الأقل سعرًا") + "</span>"
      : "";

    return ''
      + '<tr>'
      + '<td><b>' + build_escape(quote.supplier_name || quote.supplier) + '</b><div class="text-muted small">' + build_escape(quote.name) + '</div></td>'
      + '<td>' + build_money(total) + '<div>' + bestBadge + '</div></td>'
      + '<td>' + build_escape(quote.build_delivery_lead_time || "-") + '</td>'
      + '<td>' + build_escape(quote.valid_till || "-") + '</td>'
      + '<td>' + build_escape(quote.status || "-") + '</td>'
      + '<td>' + build_escape(quote.build_supplier_response_notes || "-") + '</td>'
      + '<td><button class="btn btn-xs btn-default" data-build-open-sq="' + build_escape(quote.name) + '">' + __("فتح") + '</button></td>'
      + '</tr>';
  }).join("");

  const dialog = new frappe.ui.Dialog({
    title: __("مقارنة عروض الموردين"),
    size: "extra-large",
    fields: [
      {
        fieldtype: "HTML",
        fieldname: "comparison_html",
        options: ''
          + '<div class="table-responsive">'
          + '<table class="table table-bordered table-hover">'
          + '<thead>'
          + '<tr>'
          + '<th>' + __("المورد") + '</th>'
          + '<th>' + __("الإجمالي") + '</th>'
          + '<th>' + __("مدة التوريد") + '</th>'
          + '<th>' + __("صالح حتى") + '</th>'
          + '<th>' + __("الحالة") + '</th>'
          + '<th>' + __("الملاحظات") + '</th>'
          + '<th>' + __("الإجراء") + '</th>'
          + '</tr>'
          + '</thead>'
          + '<tbody>' + rows + '</tbody>'
          + '</table>'
          + '</div>',
      },
    ],
  });

  dialog.show();
  dialog.$wrapper.find("[data-build-open-sq]").on("click", function () {
    const quoteName = this.getAttribute("data-build-open-sq");
    dialog.hide();
    frappe.set_route("Form", "Supplier Quotation", quoteName);
  });
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

    frm.add_custom_button(__("مقارنة عروض الموردين"), () => {
      frappe.dom.freeze(__("جاري تحميل عروض الموردين..."));
      show_build_supplier_quote_comparison(frm)
        .catch((error) => {
          frappe.msgprint({
            title: __("تعذر تحميل عروض الموردين"),
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
