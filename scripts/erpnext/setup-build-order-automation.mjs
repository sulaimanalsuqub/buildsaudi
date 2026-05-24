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
async function build_get_or_create_customer(frm) {
  if (frm.doc.quotation_to === "Customer" && frm.doc.party_name) {
    return frm.doc.party_name;
  }

  const customerName = frm.doc.customer_name || frm.doc.party_name || frm.doc.name;
  const existing = await frappe.db.get_list("Customer", {
    fields: ["name"],
    filters: [["Customer", "customer_name", "=", customerName]],
    limit: 1,
  });

  if (existing && existing.length) {
    return existing[0].name;
  }

  const customer = await frappe.db.insert({
    doctype: "Customer",
    customer_name: customerName,
    customer_type: "Company",
    customer_group: "Commercial",
    territory: "Saudi Arabia",
    lead_name: frm.doc.quotation_to === "Lead" ? frm.doc.party_name : undefined,
  });

  return customer.name;
}

async function build_create_sales_order(frm, customer, values) {
  const existing = await frappe.db.get_list("Sales Order", {
    fields: ["name", "build_purchase_order"],
    filters: [
      ["Sales Order", "build_customer_quotation", "=", frm.doc.name],
      ["Sales Order", "docstatus", "!=", 2],
    ],
    limit: 1,
  });

  if (existing && existing.length) {
    return existing[0];
  }

  const today = frappe.datetime.get_today();
  const deliveryDate = values.delivery_date || today;

  return frappe.db.insert({
    doctype: "Sales Order",
    company: frm.doc.company,
    customer,
    customer_name: frm.doc.customer_name,
    order_type: "Sales",
    transaction_date: today,
    delivery_date: deliveryDate,
    currency: frm.doc.currency || "SAR",
    conversion_rate: flt(frm.doc.conversion_rate || 1) || 1,
    selling_price_list: frm.doc.selling_price_list || "Standard Selling",
    price_list_currency: frm.doc.price_list_currency || frm.doc.currency || "SAR",
    plc_conversion_rate: flt(frm.doc.plc_conversion_rate || 1) || 1,
    ignore_pricing_rule: 1,
    build_opportunity: frm.doc.build_opportunity,
    build_customer_quotation: frm.doc.name,
    build_supplier_quotation: frm.doc.build_supplier_quotation,
    build_fulfillment_method: values.fulfillment_method,
    build_delivery_status: "Pending",
    build_customer_approval_date: today,
    items: (frm.doc.items || []).map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description,
      qty: flt(item.qty || 1) || 1,
      uom: item.uom || item.stock_uom || "Nos",
      stock_uom: item.stock_uom || item.uom || "Nos",
      conversion_factor: flt(item.conversion_factor || 1) || 1,
      delivery_date: deliveryDate,
      rate: flt(item.rate || 0),
      price_list_rate: flt(item.price_list_rate || item.rate || 0),
      base_rate: flt(item.base_rate || item.rate || 0),
      prevdoc_docname: frm.doc.name,
      quotation_item: item.name,
      delivered_by_supplier: values.fulfillment_method === "Drop Ship" ? 1 : 0,
      supplier: values.fulfillment_method === "Drop Ship" ? values.supplier : undefined,
    })),
  });
}

async function build_create_purchase_order(frm, salesOrder, supplierQuotation, values) {
  const existing = await frappe.db.get_list("Purchase Order", {
    fields: ["name"],
    filters: [
      ["Purchase Order", "build_sales_order", "=", salesOrder.name],
      ["Purchase Order", "docstatus", "!=", 2],
    ],
    limit: 1,
  });

  if (existing && existing.length) {
    return existing[0];
  }

  const today = frappe.datetime.get_today();
  const deliveryDate = values.delivery_date || today;

  return frappe.db.insert({
    doctype: "Purchase Order",
    supplier: supplierQuotation.supplier,
    company: frm.doc.company,
    transaction_date: today,
    schedule_date: deliveryDate,
    currency: supplierQuotation.currency || "SAR",
    conversion_rate: flt(supplierQuotation.conversion_rate || 1) || 1,
    buying_price_list: supplierQuotation.buying_price_list || "Standard Buying",
    price_list_currency: supplierQuotation.price_list_currency || supplierQuotation.currency || "SAR",
    plc_conversion_rate: flt(supplierQuotation.plc_conversion_rate || 1) || 1,
    ignore_pricing_rule: 1,
    ref_sq: supplierQuotation.name,
    build_opportunity: frm.doc.build_opportunity,
    build_sales_order: salesOrder.name,
    build_customer_quotation: frm.doc.name,
    build_supplier_quotation: supplierQuotation.name,
    build_fulfillment_method: values.fulfillment_method,
    build_supplier_delivery_status: "Pending",
    build_delivery_notes: values.notes || "",
    items: (supplierQuotation.items || []).map((item) => ({
      item_code: item.item_code,
      item_name: item.item_name,
      description: item.description,
      qty: flt(item.qty || 1) || 1,
      uom: item.uom || item.stock_uom || "Nos",
      stock_uom: item.stock_uom || item.uom || "Nos",
      conversion_factor: flt(item.conversion_factor || 1) || 1,
      schedule_date: deliveryDate,
      rate: flt(item.rate || 0),
      price_list_rate: flt(item.price_list_rate || item.rate || 0),
      base_rate: flt(item.base_rate || item.rate || 0),
      sales_order: salesOrder.name,
      supplier_quotation: supplierQuotation.name,
      supplier_quotation_item: item.name,
      delivered_by_supplier: values.fulfillment_method === "Drop Ship" ? 1 : 0,
    })),
  });
}

async function build_create_orders_from_customer_quotation(frm, values) {
  const supplierQuotationName = frm.doc.build_supplier_quotation || frm.doc.supplier_quotation;
  if (!supplierQuotationName) {
    frappe.throw(__("لا يوجد عرض مورد مختار في عرض العميل."));
  }

  const customer = await build_get_or_create_customer(frm);
  const supplierQuotation = await frappe.db.get_doc("Supplier Quotation", supplierQuotationName);
  values.supplier = supplierQuotation.supplier;

  const salesOrder = await build_create_sales_order(frm, customer, values);
  const purchaseOrder = await build_create_purchase_order(frm, salesOrder, supplierQuotation, values);

  await frappe.db.set_value("Sales Order", salesOrder.name, {
    build_purchase_order: purchaseOrder.name,
    build_delivery_status: "PO Created",
  });

  frappe.show_alert({
    message: __("تم إنشاء Sales Order و Purchase Order"),
    indicator: "green",
  });

  frappe.msgprint({
    title: __("تم إنشاء أوامر التنفيذ"),
    indicator: "green",
    message:
      __("Sales Order") + ": <b>" + salesOrder.name + "</b><br>" +
      __("Purchase Order") + ": <b>" + purchaseOrder.name + "</b>",
    primary_action: {
      label: __("فتح Sales Order"),
      action() {
        frappe.set_route("Form", "Sales Order", salesOrder.name);
      },
    },
  });
}

frappe.ui.form.on("Quotation", {
  refresh(frm) {
    if (frm.is_new() || !frm.doc.build_opportunity || !frm.doc.build_supplier_quotation) {
      return;
    }

    frm.add_custom_button(__("إنشاء أوامر التنفيذ"), () => {
      const dialog = new frappe.ui.Dialog({
        title: __("إنشاء Sales Order و Purchase Order"),
        fields: [
          {
            fieldname: "fulfillment_method",
            label: __("طريقة التنفيذ"),
            fieldtype: "Select",
            options: "Drop Ship\nBuild Warehouse\nTo Be Decided",
            default: "Drop Ship",
            reqd: 1,
          },
          {
            fieldname: "delivery_date",
            label: __("تاريخ التسليم"),
            fieldtype: "Date",
            default: frappe.datetime.get_today(),
            reqd: 1,
          },
          {
            fieldname: "notes",
            label: __("ملاحظات التنفيذ"),
            fieldtype: "Small Text",
          },
        ],
        primary_action_label: __("إنشاء الأوامر"),
        primary_action(values) {
          dialog.hide();
          frappe.dom.freeze(__("جاري إنشاء أوامر التنفيذ..."));
          build_create_orders_from_customer_quotation(frm, values)
            .catch((error) => {
              frappe.msgprint({
                title: __("تعذر إنشاء أوامر التنفيذ"),
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
  ["Client Script", "dt", "=", "Quotation"],
]);

const savedClientScript = await upsert("Client Script", clientScriptName, {
  dt: "Quotation",
  view: "Form",
  enabled: 1,
  script: clientScript.trim(),
}, "Build Quotation Order Automation");

console.log(JSON.stringify({
  ok: true,
  clientScript: savedClientScript,
}, null, 2));
