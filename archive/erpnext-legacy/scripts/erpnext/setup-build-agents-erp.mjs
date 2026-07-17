/**
 * ERPNext agent UI: decision cards, supplier suggestions, workflow guidance.
 *
 * Run: ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-agents-erp.mjs
 */

const BASE = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const TOKEN = process.env.ERPNEXT_API_TOKEN;
if (!TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const H = { Authorization: `token ${TOKEN}`, "Content-Type": "application/json", Accept: "application/json" };

async function api(method, path, body) {
  const r = await fetch(`${BASE}${path}`, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let d; try { d = JSON.parse(t); } catch { d = { raw: t }; }
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status}: ${d?.exception || d?.message || t}`);
  return d?.data ?? d?.message ?? d;
}

async function upsert(dt, name, doc) {
  try {
    await api("GET", `/api/resource/${encodeURIComponent(dt)}/${encodeURIComponent(name)}`);
    await api("PUT", `/api/resource/${encodeURIComponent(dt)}/${encodeURIComponent(name)}`, doc);
  } catch {
    await api("POST", `/api/resource/${encodeURIComponent(dt)}`, { ...doc, name });
  }
  console.log(`  ✓ ${name}`);
  return name;
}

const opportunityAgentScript = String.raw`
function build_render_agent_card(frm, summary, color, title) {
  $("#build-agent-card").remove();
  if (!summary) return;
  const pre = $("<pre></pre>")
    .text(summary)
    .css({ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: "13px", lineHeight: "1.7", color: "#1D3F1F" });
  const div = $("<div id='build-agent-card'></div>").css({
    background: color || "#f0f7f0",
    borderRadius: "10px",
    padding: "14px 18px",
    margin: "10px 0 8px 0",
    direction: "rtl",
    border: "1px solid rgba(29,63,31,.12)",
  });
  if (title) {
    div.append($("<div></div>").css({ fontWeight: "700", marginBottom: "8px", color: "#1D3F1F" }).text(title));
  }
  div.append(pre);
  $(frm.layout.wrapper).find(".form-page").first().prepend(div);
}

function build_parse_suggestions(frm) {
  try {
    return JSON.parse(frm.doc.build_suggested_suppliers || "[]");
  } catch (e) {
    return [];
  }
}

async function build_show_supplier_suggestions(frm) {
  let suggestions = build_parse_suggestions(frm);
  if (!suggestions.length) {
    const approved = await frappe.db.get_list("Supplier", {
      fields: ["name", "supplier_name", "build_product_categories", "build_coverage_regions", "build_rfq_priority"],
      filters: [["Supplier", "build_supplier_stage", "=", "Approved"], ["Supplier", "build_profile_completed", "=", 1], ["Supplier", "build_rfq_priority", "!=", "Do Not Use"]],
      limit: 10,
    });
    suggestions = approved.map((s) => ({
      name: s.name,
      supplier_name: s.supplier_name,
      score: s.build_rfq_priority === "Preferred" ? 50 : 20,
      priority: s.build_rfq_priority || "Standard",
      categories: s.build_product_categories || "",
      regions: s.build_coverage_regions || "",
      reasons: [s.build_rfq_priority === "Preferred" ? "⭐ مورد مفضل" : "○ مورد معتمد"],
    }));
  }

  if (!suggestions.length) {
    frappe.msgprint({ title: __("لا يوجد موردون"), indicator: "orange", message: __("لا يوجد موردون معتمدون. اعتمد مورداً أولاً.") });
    return;
  }

  const rows = suggestions.map((s, i) => {
    const badge = s.priority === "Preferred" ? '<span class="indicator-pill green">Preferred</span>' : '<span class="indicator-pill blue">Standard</span>';
    return '<tr>'
      + '<td><b>' + frappe.utils.escape_html(s.supplier_name) + '</b><div class="text-muted small">' + frappe.utils.escape_html(s.name) + '</div></td>'
      + '<td>' + (s.score || 0) + '</td>'
      + '<td>' + badge + '</td>'
      + '<td>' + frappe.utils.escape_html((s.reasons || []).join(" | ")) + '</td>'
      + '<td><button class="btn btn-xs btn-primary" data-build-add-supplier="' + frappe.utils.escape_html(s.name) + '">' + __("إضافة لـ RFQ") + '</button></td>'
      + '</tr>';
  }).join("");

  const dialog = new frappe.ui.Dialog({
    title: __("📊 موردون مقترحون (مطابقة تلقائية)"),
    size: "large",
    fields: [{ fieldtype: "HTML", fieldname: "html", options:
      '<div class="table-responsive"><table class="table table-bordered"><thead><tr>'
      + '<th>' + __("المورد") + '</th><th>' + __("الدرجة") + '</th><th>' + __("الأولوية") + '</th><th>' + __("الأسباب") + '</th><th>' + __("الإجراء") + '</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div><p class="text-muted">' + __("بعد اختيار الموردين، أنشئ RFQ ثم أضفهم في جدول الموردين.") + '</p>'
    }],
  });
  dialog.show();
  dialog.$wrapper.find("[data-build-add-supplier]").on("click", async function () {
    const supplierName = this.getAttribute("data-build-add-supplier");
    frappe.show_alert({ message: __("تم اختيار") + " " + supplierName, indicator: "green" });
  });
}

// اسم فريد لتجنب اصطدام const عند دمج Client Scripts لنفس الـ DocType
const BUILD_OPP_STAGE_GUIDE = {
  "New Product Request": { color: "#e8f5e9", title: "📥 طلب جديد — راجع الملخص التلقائي ثم Start Review", action: "Start Review" },
  "Reviewing Request": { color: "#fff3e0", title: "🔍 قيد المراجعة — راجع المواد ثم Source Suppliers", action: "Source Suppliers" },
  "Sourcing Suppliers": { color: "#fffde7", title: "📨 جاري التسعير — أنشئ RFQ وأرسله للموردين المقترحين", action: "Send Quote" },
  "Quoted to Customer": { color: "#e3f2fd", title: "💰 عرض أُرسل للعميل — بعد موافقة العميل أنشئ أوامر التنفيذ", action: "Mark Fulfilled" },
  "Fulfilled": { color: "#e8f5e9", title: "✅ تم التنفيذ", action: null },
  "Cancelled": { color: "#ffebee", title: "❌ ملغي — يمكن Reopen", action: "Reopen" },
};

frappe.ui.form.on("Opportunity", {
  refresh(frm) {
    if (frm.is_new() || frm.doc.opportunity_type !== "Build Product Request") return;

    const stage = frm.doc.build_request_stage;
    const guide = BUILD_OPP_STAGE_GUIDE[stage] || {};
    build_render_agent_card(frm, frm.doc.build_agent_summary, guide.color, guide.title);

    frm.add_custom_button(__("📊 موردون مقترحون"), () => build_show_supplier_suggestions(frm), __("Build"));
  },
});
`;

// Summary card only — workflow guidance lives in Build Supplier Next Action.
const supplierAgentScript = String.raw`
function build_render_supplier_agent(frm) {
  $("#build-supplier-agent").remove();
  const summary = frm.doc.build_agent_summary;
  if (!summary) return;

  const stage = frm.doc.build_supplier_stage;
  const profileDone = !!frm.doc.build_profile_completed;
  const colors = {
    "Pre Registration": "#e8f5e9",
    "Under Review": "#fff3e0",
    Approved: "#e3f2fd",
    Rejected: "#ffebee",
  };

  const div = $("<div id='build-supplier-agent'></div>").css({
    background: colors[stage] || "#f0f7f0",
    borderRadius: "10px",
    padding: "14px 18px",
    margin: "10px 0 8px 0",
    direction: "rtl",
    border: "1px solid rgba(29,63,31,.12)",
  });

  const title = stage === "Pre Registration"
    ? "📊 ملخص تلقائي من الموقع"
    : stage === "Under Review"
      ? profileDone
        ? "📋 ملف التوريد مكتمل — جاهز للاعتماد النهائي"
        : "🔍 مراجعة أولية — الخطوة التالية: Approve"
      : stage === "Approved"
        ? profileDone
          ? "✅ مورد معتمد نهائياً"
          : "📨 بانتظار إكمال ملف التوريد"
        : "❌ مورد مرفوض";

  div.append($("<div></div>").css({ fontWeight: "700", marginBottom: "8px", color: "#1D3F1F" }).text(title));
  div.append($("<pre></pre>").text(summary).css({ whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", fontSize: "13px", lineHeight: "1.7", color: "#374151" }));

  if (frm.doc.build_agent_catalog_groups) {
    div.append($("<div></div>").css({ marginTop: "8px", fontSize: "12px", color: "#6b7280" })
      .html("<b>الكتالوج:</b> " + frappe.utils.escape_html(frm.doc.build_agent_catalog_groups)));
  }
  if (frm.doc.build_agent_score) {
    div.append($("<div></div>").css({ marginTop: "4px", fontSize: "12px", color: "#6b7280" })
      .html("<b>الدرجة:</b> " + frm.doc.build_agent_score + "/100"));
  }

  $(frm.layout.wrapper).find(".form-page").first().prepend(div);
}

frappe.ui.form.on("Supplier", {
  refresh(frm) {
    build_render_supplier_agent(frm);
  },
});
`;

async function main() {
  console.log(`\nBuild Agents ERP UI — ${BASE}\n`);

  // مهم: لا تدمج agent UI داخل "Build Opportunity RFQ Button".
  // Frappe يدمج كل Client Scripts لنفس الـ DocType في Function واحدة؛
  // إعادة اللصق كانت تكرّر const STAGE_GUIDE وتكسر نموذج Opportunity.

  await upsert("Client Script", "Build Opportunity Next Action", {
    dt: "Opportunity", view: "Form", enabled: 1, script: opportunityAgentScript.trim(),
  });

  await upsert("Client Script", "Build Supplier Agent Summary", {
    dt: "Supplier", view: "Form", enabled: 1, script: supplierAgentScript.trim(),
  });

  console.log("\n✅ Agent ERP UI deployed.\n");
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });