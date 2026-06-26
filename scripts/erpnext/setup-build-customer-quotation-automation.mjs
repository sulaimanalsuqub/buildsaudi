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
function build_supplier_cost(frm) {
  return flt(frm.doc.rounded_total || frm.doc.grand_total || frm.doc.net_total || frm.doc.total || 0);
}

function build_calculate_service_fee(cost, values) {
  if (values.service_fee_type === "Percentage") {
    return cost * flt(values.service_fee_percent || 0) / 100;
  }

  return flt(values.service_fee_amount || 0);
}

async function create_build_customer_quotation(frm, values) {
  const existing = await frappe.db.get_list("Quotation", {
    fields: ["name"],
    filters: [
      ["Quotation", "build_supplier_quotation", "=", frm.doc.name],
      ["Quotation", "docstatus", "!=", 2],
    ],
    limit: 1,
  });

  if (existing && existing.length) {
    frappe.show_alert({
      message: __("يوجد عرض عميل مرتبط مسبقاً"),
      indicator: "orange",
    });
    frappe.set_route("Form", "Quotation", existing[0].name);
    return;
  }

  const opportunity = await frappe.db.get_doc("Opportunity", frm.doc.build_opportunity);
  const supplierCost = build_supplier_cost(frm);
  const serviceFee = build_calculate_service_fee(supplierCost, values);
  const finalTotal = supplierCost + serviceFee;
  const supplierTotal = (frm.doc.items || []).reduce((sum, item) => sum + flt(item.amount || 0), 0) || supplierCost || 1;
  const today = frappe.datetime.get_today();
  const quotationTo = opportunity.opportunity_from === "Customer" ? "Customer" : "Lead";
  const partyName = opportunity.party_name;

  if (!partyName) {
    frappe.throw(__("لا يوجد Lead أو Customer مرتبط بالطلب."));
  }

  const quotation = await frappe.db.insert({
    doctype: "Quotation",
    quotation_to: quotationTo,
    party_name: partyName,
    customer_name: opportunity.customer_name || opportunity.build_project_name || opportunity.title,
    transaction_date: today,
    valid_till: values.valid_till || undefined,
    order_type: "Sales",
    company: frm.doc.company || opportunity.company || frappe.defaults.get_user_default("Company"),
    currency: "SAR",
    conversion_rate: 1,
    selling_price_list: "Standard Selling",
    price_list_currency: "SAR",
    plc_conversion_rate: 1,
    ignore_pricing_rule: 1,
    opportunity: opportunity.name,
    supplier_quotation: frm.doc.name,
    build_opportunity: opportunity.name,
    build_supplier_quotation: frm.doc.name,
    build_supplier_cost: supplierCost,
    build_service_fee_type: values.service_fee_type,
    build_service_fee_percent: values.service_fee_type === "Percentage" ? flt(values.service_fee_percent || 0) : 0,
    build_service_fee_amount: serviceFee,
    build_final_notes: values.notes || "",
    build_contact_email: opportunity.build_contact_email || "",
    build_project_name: opportunity.build_project_name || opportunity.title || "",
    items: (frm.doc.items || []).map((item) => {
      const qty = flt(item.qty || 1) || 1;
      const itemCost = flt(item.amount || item.rate || 0);
      const itemShare = supplierTotal ? itemCost / supplierTotal : 1 / (frm.doc.items || []).length;
      const itemFinalTotal = finalTotal * itemShare;
      const rate = itemFinalTotal / qty;

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
      };
    }),
  });

  frappe.show_alert({
    message: __("تم إنشاء عرض العميل"),
    indicator: "green",
  });
  frappe.set_route("Form", "Quotation", quotation.name);
}

frappe.ui.form.on("Supplier Quotation", {
  refresh(frm) {
    if (frm.is_new() || !frm.doc.build_opportunity || !frm.doc.build_rfq) {
      return;
    }

    frm.add_custom_button(__("اعتماد كعرض فائز"), () => {
      const supplierCost = build_supplier_cost(frm);
      const dialog = new frappe.ui.Dialog({
        title: __("اعتماد عرض المورد وإنشاء عرض العميل"),
        fields: [
          {
            fieldname: "supplier_cost",
            label: __("تكلفة المورد"),
            fieldtype: "Currency",
            default: supplierCost,
            read_only: 1,
          },
          {
            fieldname: "service_fee_type",
            label: __("نوع رسوم بيلد"),
            fieldtype: "Select",
            options: "Percentage\nFixed Amount",
            default: "Percentage",
            reqd: 1,
          },
          {
            fieldname: "service_fee_percent",
            label: __("نسبة رسوم بيلد"),
            fieldtype: "Percent",
            default: 15,
            depends_on: "eval:doc.service_fee_type=='Percentage'",
          },
          {
            fieldname: "service_fee_amount",
            label: __("مبلغ رسوم بيلد"),
            fieldtype: "Currency",
            depends_on: "eval:doc.service_fee_type=='Fixed Amount'",
          },
          {
            fieldname: "valid_till",
            label: __("عرض العميل صالح حتى"),
            fieldtype: "Date",
          },
          {
            fieldname: "notes",
            label: __("ملاحظات عرض العميل"),
            fieldtype: "Small Text",
          },
        ],
        primary_action_label: __("إنشاء عرض العميل"),
        primary_action(values) {
          const serviceFee = build_calculate_service_fee(supplierCost, values);
          if (serviceFee < 0) {
            frappe.msgprint(__("رسوم بيلد لا يمكن أن تكون سالبة."));
            return;
          }

          dialog.hide();
          frappe.dom.freeze(__("جاري إنشاء عرض العميل..."));
          create_build_customer_quotation(frm, values)
            .catch((error) => {
              frappe.msgprint({
                title: __("تعذر إنشاء عرض العميل"),
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
  ["Client Script", "dt", "=", "Supplier Quotation"],
]);

const savedClientScript = await upsert("Client Script", clientScriptName, {
  dt: "Supplier Quotation",
  view: "Form",
  enabled: 1,
  script: clientScript.trim(),
}, "Build Supplier Quotation Winner Button");

console.log(JSON.stringify({
  ok: true,
  clientScript: savedClientScript,
}, null, 2));
