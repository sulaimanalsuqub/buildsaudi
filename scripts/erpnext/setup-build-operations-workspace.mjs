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

const workspaceName = "Build";

const shortcutBlocks = [
  ["طلبات جديدة", 3],
  ["طلبات قيد المراجعة", 3],
  ["جاري تسعيرها", 3],
  ["عروض مرسلة للعملاء", 3],
  ["موردون جدد", 3],
  ["موردون قيد المراجعة", 3],
  ["موردون معتمدون", 3],
  ["أوامر قيد التنفيذ", 3],
];

const content = [
  { id: "build_header_1", type: "header", data: { text: '<span class="h4"><b>Build Operations</b></span>', col: 12 } },
  ...shortcutBlocks.map(([shortcutName, col], index) => ({
    id: `build_shortcut_${index + 1}`,
    type: "shortcut",
    data: { shortcut_name: shortcutName, col },
  })),
  { id: "build_spacer_1", type: "spacer", data: { col: 12 } },
  { id: "build_header_2", type: "header", data: { text: '<span class="h4"><b>العمليات اليومية</b></span>', col: 12 } },
  { id: "build_card_1", type: "card", data: { card_name: "طلبات العملاء", col: 4 } },
  { id: "build_card_2", type: "card", data: { card_name: "الموردون والتسعير", col: 4 } },
  { id: "build_card_3", type: "card", data: { card_name: "التنفيذ والمتابعة", col: 4 } },
  { id: "build_card_4", type: "card", data: { card_name: "الكتالوج والإعدادات", col: 4 } },
];

function buildShortcut(idx, label, linkTo, statsFilter, color = "Grey") {
  return {
    idx,
    type: "DocType",
    link_to: linkTo,
    doc_view: "List",
    label,
    stats_filter: JSON.stringify(statsFilter),
    color,
  };
}

function card(idx, label, description = "") {
  return {
    idx,
    type: "Card Break",
    label,
    description,
    hidden: 0,
    onboard: 0,
    is_query_report: 0,
  };
}

function link(idx, label, linkTo, linkType = "DocType") {
  return {
    idx,
    type: "Link",
    label,
    link_type: linkType,
    link_to: linkTo,
    hidden: 0,
    onboard: 0,
    is_query_report: linkType === "Report" ? 1 : 0,
  };
}

const buildOpportunityFilter = [
  ["Opportunity", "opportunity_type", "=", "Build Product Request"],
];

const shortcuts = [
  buildShortcut(1, "طلبات جديدة", "Opportunity", [
    ...buildOpportunityFilter,
    ["Opportunity", "build_request_stage", "=", "New Product Request"],
  ], "Blue"),
  buildShortcut(2, "طلبات قيد المراجعة", "Opportunity", [
    ...buildOpportunityFilter,
    ["Opportunity", "build_request_stage", "=", "Reviewing Request"],
  ], "Orange"),
  buildShortcut(3, "جاري تسعيرها", "Opportunity", [
    ...buildOpportunityFilter,
    ["Opportunity", "build_request_stage", "=", "Sourcing Suppliers"],
  ], "Yellow"),
  buildShortcut(4, "عروض مرسلة للعملاء", "Opportunity", [
    ...buildOpportunityFilter,
    ["Opportunity", "build_request_stage", "=", "Quoted to Customer"],
  ], "Green"),
  buildShortcut(5, "موردون جدد", "Supplier", [
    ["Supplier", "build_supplier_stage", "=", "Pre Registration"],
  ], "Blue"),
  buildShortcut(6, "موردون قيد المراجعة", "Supplier", [
    ["Supplier", "build_supplier_stage", "=", "Under Review"],
  ], "Orange"),
  buildShortcut(7, "موردون معتمدون", "Supplier", [
    ["Supplier", "build_supplier_stage", "=", "Approved"],
  ], "Green"),
  buildShortcut(8, "أوامر قيد التنفيذ", "Sales Order", [
    ["Sales Order", "build_delivery_status", "in", ["PO Created", "In Fulfillment"]],
    ["Sales Order", "docstatus", "!=", 2],
  ], "Purple"),
];

const links = [
  card(1, "طلبات العملاء", "استقبال ومتابعة طلبات المنتجات الواردة من موقع Build"),
  link(2, "طلبات المنتجات", "Opportunity"),
  link(3, "العملاء المحتملون", "Lead"),
  link(4, "عروض العملاء", "Quotation"),
  link(5, "أوامر البيع", "Sales Order"),

  card(6, "الموردون والتسعير", "تأهيل الموردين وإدارة RFQ وعروض الموردين"),
  link(7, "الموردون", "Supplier"),
  link(8, "مجموعات الموردين", "Supplier Group"),
  link(9, "طلبات عروض الأسعار RFQ", "Request for Quotation"),
  link(10, "عروض الموردين", "Supplier Quotation"),
  link(11, "مقارنة عروض الموردين", "Supplier Quotation Comparison", "Report"),

  card(12, "التنفيذ والمتابعة", "متابعة أوامر الشراء وحالة التوريد حتى الإغلاق"),
  link(13, "أوامر الشراء", "Purchase Order"),
  link(14, "أوامر البيع", "Sales Order"),
  link(15, "سجل التواصل", "Communication"),

  card(16, "الكتالوج والإعدادات", "الكتالوج الأولي وإعدادات تخصيص Build"),
  link(17, "الأصناف", "Item"),
  link(18, "مجموعات الأصناف", "Item Group"),
  link(19, "الحقول المخصصة", "Custom Field"),
  link(20, "Client Scripts", "Client Script"),
  link(21, "قوالب البريد", "Email Template"),
  link(22, "حسابات البريد", "Email Account"),
];

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

async function getWorkspace(name) {
  const response = await request(`/api/resource/Workspace/${encodeURIComponent(name)}`);
  return response.data;
}

async function updateWorkspace(name, data) {
  const response = await request(`/api/resource/Workspace/${encodeURIComponent(name)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return response.data;
}

const existing = await getWorkspace(workspaceName);

const saved = await updateWorkspace(workspaceName, {
  label: "Build",
  title: "Build",
  icon: "hammer",
  public: 1,
  is_hidden: 0,
  content: JSON.stringify(content),
  shortcuts,
  links,
  quick_lists: [],
  number_cards: existing.number_cards || [],
  charts: existing.charts || [],
  custom_blocks: existing.custom_blocks || [],
});

const verified = await getWorkspace(saved.name);

console.log(JSON.stringify({
  ok: true,
  workspace: verified.name,
  title: verified.title,
  shortcuts: verified.shortcuts?.length || 0,
  links: verified.links?.length || 0,
  public: verified.public,
}, null, 2));
