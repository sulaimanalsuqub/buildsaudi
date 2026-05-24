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
function build_sales_order_status_for_supplier_status(status) {
  const map = {
    Pending: "PO Created",
    Confirmed: "In Fulfillment",
    "In Progress": "In Fulfillment",
    Shipped: "In Fulfillment",
    Delivered: "Delivered",
    Cancelled: "Cancelled",
  };

  return map[status] || "In Fulfillment";
}

async function build_update_delivery_status(frm, values) {
  const salesOrderStatus = build_sales_order_status_for_supplier_status(values.supplier_status);
  const notes = [
    frm.doc.build_delivery_notes || "",
    values.notes ? frappe.datetime.now_datetime() + " - " + values.notes : "",
  ].filter(Boolean).join("\n");

  await frappe.db.set_value("Purchase Order", frm.doc.name, {
    build_supplier_delivery_status: values.supplier_status,
    build_delivery_notes: notes,
  });

  if (frm.doc.build_sales_order) {
    await frappe.db.set_value("Sales Order", frm.doc.build_sales_order, {
      build_delivery_status: salesOrderStatus,
    });
  }

  frappe.show_alert({
    message: __("تم تحديث حالة التوريد"),
    indicator: "green",
  });

  await frm.reload_doc();
}

frappe.ui.form.on("Purchase Order", {
  refresh(frm) {
    if (frm.is_new() || !frm.doc.build_sales_order || !frm.doc.build_customer_quotation) {
      return;
    }

    frm.add_custom_button(__("تحديث حالة التوريد"), () => {
      const dialog = new frappe.ui.Dialog({
        title: __("تحديث حالة التوريد"),
        fields: [
          {
            fieldname: "supplier_status",
            label: __("حالة المورد"),
            fieldtype: "Select",
            options: "Pending\nConfirmed\nIn Progress\nShipped\nDelivered\nCancelled",
            default: frm.doc.build_supplier_delivery_status || "Pending",
            reqd: 1,
          },
          {
            fieldname: "sales_order_status_preview",
            label: __("حالة طلب العميل المتوقعة"),
            fieldtype: "Data",
            read_only: 1,
          },
          {
            fieldname: "notes",
            label: __("ملاحظات التحديث"),
            fieldtype: "Small Text",
          },
        ],
        primary_action_label: __("تحديث الحالة"),
        primary_action(values) {
          dialog.hide();
          frappe.dom.freeze(__("جاري تحديث حالة التوريد..."));
          build_update_delivery_status(frm, values)
            .catch((error) => {
              frappe.msgprint({
                title: __("تعذر تحديث حالة التوريد"),
                indicator: "red",
                message: error.message || error,
              });
            })
            .finally(() => frappe.dom.unfreeze());
        },
      });

      const updatePreview = () => {
        const status = dialog.get_value("supplier_status");
        dialog.set_value("sales_order_status_preview", build_sales_order_status_for_supplier_status(status));
      };

      dialog.fields_dict.supplier_status.df.onchange = updatePreview;
      dialog.show();
      updatePreview();
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
  ["Client Script", "dt", "=", "Purchase Order"],
]);

const savedClientScript = await upsert("Client Script", clientScriptName, {
  dt: "Purchase Order",
  view: "Form",
  enabled: 1,
  script: clientScript.trim(),
}, "Build Purchase Order Delivery Status");

console.log(JSON.stringify({
  ok: true,
  clientScript: savedClientScript,
}, null, 2));
