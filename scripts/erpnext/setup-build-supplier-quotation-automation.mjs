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
function build_supplier_options(frm) {
  return (frm.doc.suppliers || [])
    .filter((row) => row.supplier)
    .map((row) => row.supplier);
}

async function create_build_supplier_quotation_from_rfq(frm, values) {
  const existing = await frappe.db.get_list("Supplier Quotation", {
    fields: ["name"],
    filters: [
      ["Supplier Quotation", "build_rfq", "=", frm.doc.name],
      ["Supplier Quotation", "supplier", "=", values.supplier],
      ["Supplier Quotation", "docstatus", "!=", 2],
    ],
    limit: 1,
  });

  if (existing && existing.length) {
    frappe.show_alert({
      message: __("يوجد عرض مورد مرتبط مسبقاً"),
      indicator: "orange",
    });
    frappe.set_route("Form", "Supplier Quotation", existing[0].name);
    return;
  }

  const totalPrice = flt(values.total_price);
  const totalQty = (frm.doc.items || []).reduce((sum, item) => sum + flt(item.qty || 1), 0) || 1;
  const distributedRate = totalPrice / totalQty;
  const today = frappe.datetime.get_today();

  const supplierQuotation = await frappe.db.insert({
    doctype: "Supplier Quotation",
    supplier: values.supplier,
    company: frm.doc.company || frappe.defaults.get_user_default("Company"),
    transaction_date: today,
    valid_till: values.valid_till || undefined,
    currency: "SAR",
    conversion_rate: 1,
    ignore_pricing_rule: 1,
    build_opportunity: frm.doc.build_opportunity,
    build_rfq: frm.doc.name,
    build_supplier_response_notes: values.notes || "",
    build_delivery_lead_time: values.delivery_lead_time || "",
    items: (frm.doc.items || []).map((item) => {
      const qty = flt(item.qty || 1) || 1;
      const rate = (frm.doc.items || []).length === 1 ? totalPrice / qty : distributedRate;
      return {
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        qty,
        uom: item.uom || item.stock_uom || "Nos",
        stock_uom: item.stock_uom || item.uom || "Nos",
        conversion_factor: flt(item.conversion_factor || 1) || 1,
        rate,
        price_list_rate: rate,
        base_rate: rate,
        request_for_quotation: frm.doc.name,
        request_for_quotation_item: item.name,
      };
    }),
  });

  frappe.show_alert({
    message: __("تم إنشاء عرض المورد"),
    indicator: "green",
  });
  frappe.set_route("Form", "Supplier Quotation", supplierQuotation.name);
}

frappe.ui.form.on("Request for Quotation", {
  refresh(frm) {
    if (frm.is_new() || !frm.doc.build_opportunity) {
      return;
    }

    frm.add_custom_button(__("تسجيل عرض مورد"), () => {
      const suppliers = build_supplier_options(frm);
      if (!suppliers.length) {
        frappe.msgprint({
          title: __("لا يوجد موردون"),
          indicator: "orange",
          message: __("أضف الموردين في جدول الموردين داخل RFQ أولاً."),
        });
        return;
      }

      const dialog = new frappe.ui.Dialog({
        title: __("تسجيل عرض مورد"),
        fields: [
          {
            fieldname: "supplier",
            label: __("المورد"),
            fieldtype: "Select",
            options: suppliers.join("\n"),
            reqd: 1,
          },
          {
            fieldname: "total_price",
            label: __("إجمالي عرض المورد"),
            fieldtype: "Currency",
            reqd: 1,
          },
          {
            fieldname: "delivery_lead_time",
            label: __("مدة التوريد"),
            fieldtype: "Data",
            placeholder: __("مثال: 7 أيام"),
          },
          {
            fieldname: "valid_till",
            label: __("العرض صالح حتى"),
            fieldtype: "Date",
          },
          {
            fieldname: "notes",
            label: __("ملاحظات المورد"),
            fieldtype: "Small Text",
          },
        ],
        primary_action_label: __("إنشاء عرض المورد"),
        primary_action(values) {
          if (flt(values.total_price) <= 0) {
            frappe.msgprint(__("إجمالي عرض المورد يجب أن يكون أكبر من صفر."));
            return;
          }

          dialog.hide();
          frappe.dom.freeze(__("جاري إنشاء عرض المورد..."));
          create_build_supplier_quotation_from_rfq(frm, values)
            .catch((error) => {
              frappe.msgprint({
                title: __("تعذر إنشاء عرض المورد"),
                indicator: "red",
                message: error.message || error,
              });
            })
            .finally(() => frappe.dom.unfreeze());
        },
      });

      dialog.show();
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

const clientScriptName = await findByFilters("Client Script", [
  ["Client Script", "dt", "=", "Request for Quotation"],
]);

const savedClientScript = await upsert("Client Script", clientScriptName, {
  dt: "Request for Quotation",
  view: "Form",
  enabled: 1,
  script: clientScript.trim(),
}, "Build RFQ Supplier Quotation Button");

console.log(JSON.stringify({
  ok: true,
  clientScript: savedClientScript,
}, null, 2));
