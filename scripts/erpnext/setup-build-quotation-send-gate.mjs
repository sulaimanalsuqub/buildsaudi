/**
 * Gate customer quotation email behind explicit manager approval.
 * Nothing is sent to the client until "إرسال عرض السعر للعميل" is clicked.
 *
 * Run: ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-quotation-send-gate.mjs
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
}

// ─── 1. Custom fields on Quotation ──────────────────────────────────────────

const FIELDS = [
  { dt: "Quotation", fieldname: "build_send_section", fieldtype: "Section Break", label: "Build Customer Send", insert_after: "build_final_notes" },
  { dt: "Quotation", fieldname: "build_sent_to_customer", fieldtype: "Check", label: "Sent to Customer", insert_after: "build_send_section", read_only: 1 },
  { dt: "Quotation", fieldname: "build_sent_to_customer_at", fieldtype: "Datetime", label: "Sent At", insert_after: "build_sent_to_customer", read_only: 1 },
  { dt: "Quotation", fieldname: "build_sent_to_customer_by", fieldtype: "Data", label: "Sent By", insert_after: "build_sent_to_customer_at", read_only: 1 },
  { dt: "Quotation", fieldname: "build_contact_email", fieldtype: "Data", label: "Customer Email", insert_after: "build_sent_to_customer_by", read_only: 1 },
  { dt: "Quotation", fieldname: "build_project_name", fieldtype: "Data", label: "Project Name", insert_after: "build_contact_email", read_only: 1 },
];

// ─── 2. Disable auto-send on workflow stage ─────────────────────────────────

async function disableAutoQuoteNotification() {
  await api("PUT", `/api/resource/Notification/${encodeURIComponent("Build Opp Stage QuotedtoCustomer")}`, { enabled: 0 });
  console.log("  ✕ disabled Build Opp Stage QuotedtoCustomer (auto-send)");
}

// ─── 3. Email only when build_sent_to_customer is checked ───────────────────

const emailTemplate = {
  name: "Build Customer Quotation",
  subject: "عرض سعر — {{ doc.build_project_name or doc.title }}",
  use_html: 1,
  response: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#1D3F1F">
<p>مرحباً،</p>
<p>يسعدنا إرسال عرض السعر لمشروع <strong>{{ doc.build_project_name or doc.customer_name }}</strong>.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:8px;border:1px solid #e5e7eb">رقم العرض</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.name }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">الإجمالي</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.grand_total }} {{ doc.currency }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">صالح حتى</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.valid_till }}</td></tr>
</table>
{% if doc.build_final_notes %}<p><strong>ملاحظات:</strong> {{ doc.build_final_notes }}</p>{% endif %}
<p>للموافقة أو الاستفسار، رد على هذا البريد مباشرة.</p>
<p>مع تحياتنا،<br/>فريق Build Saudi</p>
</div>`,
};

const quotationNotification = {
  name: "Build Quotation Sent to Customer",
  enabled: 1,
  channel: "Email",
  event: "Value Change",
  document_type: "Quotation",
  value_changed: "build_sent_to_customer",
  condition: "doc.build_sent_to_customer and doc.build_contact_email",
  subject: "عرض سعر — {{ doc.customer_name }}",
  message_type: "HTML",
  message: emailTemplate.response,
  sender: "Build Resend",
  recipients: [{ idx: 1, receiver_by_document_field: "build_contact_email" }],
};

// ─── 4. Client Script — manual send button (manager approval) ───────────────

const clientScript = String.raw`
function build_user_can_send_quotation() {
  const roles = frappe.boot.user.roles || [];
  return roles.includes("Build Manager") || roles.includes("System Manager");
}

function build_render_quotation_gate(frm) {
  $("#build-quotation-gate").remove();
  if (frm.doc.build_sent_to_customer) {
    const div = $("<div id='build-quotation-gate'></div>").css({
      background: "#e3f2fd", borderRadius: "10px", padding: "14px 18px", margin: "10px 0",
      direction: "rtl", border: "1px solid rgba(29,63,31,.1)",
    });
    div.append($("<div></div>").css({ fontWeight: "700", color: "#1D3F1F" })
      .text("✅ تم إرسال عرض السعر للعميل"));
    div.append($("<div></div>").css({ fontSize: "12px", color: "#6b7280", marginTop: "6px" })
      .text((frm.doc.build_sent_to_customer_by || "") + " — " + (frm.doc.build_sent_to_customer_at || "")));
    $(frm.layout.wrapper).find(".form-page").first().prepend(div);
    return;
  }

  const div = $("<div id='build-quotation-gate'></div>").css({
    background: "#fff3e0", borderRadius: "10px", padding: "14px 18px", margin: "10px 0",
    direction: "rtl", border: "1px solid rgba(245,158,11,.3)",
  });
  div.append($("<div></div>").css({ fontWeight: "700", color: "#92400e" })
    .text("⏳ عرض السعر جاهز — لم يُرسل للعميل بعد"));
  div.append($("<div></div>").css({ fontSize: "13px", color: "#374151", marginTop: "6px" })
    .text("راجع العرض ثم اضغط «إرسال عرض السعر للعميل» — لا يُرسل تلقائياً."));
  $(frm.layout.wrapper).find(".form-page").first().prepend(div);
}

async function build_send_quotation_to_customer(frm) {
  if (frm.doc.build_sent_to_customer) {
    frappe.msgprint(__("تم إرسال هذا العرض للعميل مسبقاً."));
    return;
  }
  if (!build_user_can_send_quotation()) {
    frappe.msgprint({ title: __("صلاحية مطلوبة"), indicator: "red",
      message: __("فقط Build Manager يستطيع إرسال عرض السعر للعميل.") });
    return;
  }
  if (!frm.doc.build_contact_email) {
    frappe.msgprint({ title: __("لا يوجد بريد"), indicator: "orange",
      message: __("لا يوجد بريد إلكتروني للعميل في هذا العرض.") });
    return;
  }
  if (!frm.doc.grand_total && !frm.doc.net_total) {
    frappe.msgprint(__("أكمل بنود العرض والإجمالي قبل الإرسال."));
    return;
  }

  frappe.confirm(
    __("إرسال عرض السعر إلى") + " " + frm.doc.build_contact_email + "?<br><br>"
      + __("<b>تأكيد:</b> لن يصل أي عرض سعر للعميل إلا بعد هذا الإجراء."),
    async () => {
      frappe.dom.freeze(__("جاري الإرسال..."));
      try {
        await frappe.db.set_value("Quotation", frm.doc.name, {
          build_sent_to_customer: 1,
          build_sent_to_customer_at: frappe.datetime.now_datetime(),
          build_sent_to_customer_by: frappe.session.user_fullname || frappe.session.user,
        });

        if (frm.doc.build_opportunity) {
          const opp = await frappe.db.get_doc("Opportunity", frm.doc.build_opportunity);
          if (opp.build_request_stage !== "Quoted to Customer") {
            try {
              await frappe.xcall("frappe.model.workflow.apply_workflow", {
                doc: opp,
                action: "Send Quote",
              });
            } catch (wfErr) {
              console.warn("Workflow Send Quote skipped:", wfErr);
            }
          }
        }

        await frm.reload_doc();
        frappe.show_alert({ message: __("تم إرسال عرض السعر للعميل"), indicator: "green" });
      } catch (error) {
        frappe.msgprint({ title: __("تعذر الإرسال"), indicator: "red", message: error.message || error });
      } finally {
        frappe.dom.unfreeze();
      }
    }
  );
}

frappe.ui.form.on("Quotation", {
  refresh(frm) {
    if (frm.is_new() || !frm.doc.build_opportunity) return;

    build_render_quotation_gate(frm);

    if (!frm.doc.build_sent_to_customer && build_user_can_send_quotation()) {
      frm.add_custom_button(__("إرسال عرض السعر للعميل"), () => {
        build_send_quotation_to_customer(frm);
      }, __("Build"));
    }
  },
});
`;

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nBuild Quotation Send Gate — ${BASE}\n`);

  console.log("── Custom Fields ──");
  for (const f of FIELDS) {
    await upsert("Custom Field", `${f.dt}-${f.fieldname}`, { ...f, module: "Custom" });
  }

  console.log("\n── Disable Auto-Send ──");
  await disableAutoQuoteNotification();

  console.log("\n── Email Template + Notification ──");
  await upsert("Email Template", emailTemplate.name, emailTemplate);
  await upsert("Notification", quotationNotification.name, quotationNotification);

  console.log("\n── Client Script ──");
  await upsert("Client Script", "Build Quotation Send Gate", {
    dt: "Quotation",
    view: "Form",
    enabled: 1,
    script: clientScript.trim(),
  });

  console.log("\n✅ Quotation send gate active — email only after manager clicks send.\n");
}

main().catch((e) => { console.error("\n❌", e.message); process.exit(1); });