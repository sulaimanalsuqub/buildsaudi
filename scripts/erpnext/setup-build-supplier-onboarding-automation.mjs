/**
 * Supplier onboarding automation for Build Saudi ERPNext.
 * Uses Client Scripts + ERPNext Notifications (no Server Scripts — Frappe Cloud safe).
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-supplier-onboarding-automation.mjs
 */

const baseUrl = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const apiToken = process.env.ERPNEXT_API_TOKEN;
const adminEmail = process.env.ADMIN_EMAIL || "sulaimanalsuqub@gmail.com";

if (!apiToken) throw new Error("ERPNEXT_API_TOKEN is required");

const headers = {
  Authorization: `token ${apiToken}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const clientScript = String.raw`
function build_supplier_stage_updates(doc) {
  const stage = doc.build_supplier_stage;
  const today = frappe.datetime.get_today();
  const reviewer = frappe.session.user_fullname || frappe.session.user;
  const base = {
    build_review_date: today,
    build_reviewed_by: reviewer,
  };

  if (stage === "Approved") {
    if (doc.build_profile_completed) {
      const score = doc.build_agent_score || 0;
      return {
        ...base,
        supplier_group: "Build Approved Suppliers",
        build_verification_status: "Verified",
        build_preferred_for_rfq: 1,
        build_rfq_priority: score >= 70 ? "Preferred" : "Standard",
      };
    }
    return {
      ...base,
      supplier_group: "Build Pre-Registered Suppliers",
      build_verification_status: "Invited",
      build_preferred_for_rfq: 0,
      build_rfq_priority: "Standard",
    };
  }

  if (stage === "Rejected") {
    return {
      ...base,
      supplier_group: "Build Rejected Suppliers",
      build_verification_status: "Failed",
      build_preferred_for_rfq: 0,
      build_rfq_priority: "Do Not Use",
    };
  }

  if (stage === "Under Review") {
    return {
      ...base,
      build_verification_status: doc.build_profile_completed ? "Profile Submitted" : "Pending",
    };
  }

  return {};
}

async function build_sync_supplier_stage_fields(frm) {
  const updates = build_supplier_stage_updates(frm.doc);
  if (!Object.keys(updates).length) {
    return;
  }

  await frappe.db.set_value("Supplier", frm.doc.name, updates);
  await frm.reload_doc();
}

frappe.ui.form.on("Supplier", {
  onload(frm) {
    frm._build_last_supplier_stage = frm.doc.build_supplier_stage;
    if (frm.is_new() && frm.doc.build_website_source) {
      frm.set_value("build_verification_status", frm.doc.build_verification_status || "Pending");
    }
  },

  async refresh(frm) {
    $("#build-supplier-action").remove();

    if (!frm.is_new() && frm._build_last_supplier_stage !== frm.doc.build_supplier_stage) {
      try {
        await build_sync_supplier_stage_fields(frm);
      } catch (error) {
        frappe.msgprint({
          title: __("تعذر تحديث بيانات المورد"),
          indicator: "red",
          message: error.message || error,
        });
      }
      frm._build_last_supplier_stage = frm.doc.build_supplier_stage;
    }

    const stage = frm.doc.build_supplier_stage;
    const profileDone = !!frm.doc.build_profile_completed;
    const actions = {
      "Pre Registration": {
        msg: "📋 مورد جديد — راجع البيانات الأساسية ثم Review",
        color: "#e8f5e9",
        steps: ["تحقق من السجل التجاري والجوال والبريد", "اضغط Review من شريط Workflow", "ثم Approve لإرسال رابط إكمال الملف"],
      },
      "Under Review": {
        msg: profileDone
          ? "📋 ملف التوريد مكتمل — راجع الفئات والبنك والمستندات ثم اعتمد نهائياً"
          : "🔍 مراجعة أولية — وافق لإرسال رابط إكمال الملف للمورد",
        color: "#fff3e0",
        steps: profileDone
          ? ["راجع build_product_categories والبنك والمرفقات", "Approve = اعتماد نهائي لـ RFQ", "Reject = رفض مع سبب"]
          : ["تأكد من بيانات التواصل والسجل", "Approve = إرسال رابط إكمال الملف فقط", "Reject = رفض الطلب"],
      },
      Approved: {
        msg: profileDone
          ? "✅ مورد معتمد نهائياً — جاهز لإضافته في RFQ"
          : "📨 بانتظار إكمال ملف التوريد من الموقع",
        color: profileDone ? "#e8f5e9" : "#e3f2fd",
        steps: profileDone
          ? ["أضفه في طلبات RFQ", "يظهر في اقتراحات الوكيل", "build_preferred_for_rfq مفعّل"]
          : ["يصل المورد بريد رابط إكمال الملف", "بعد الإرسال يرجع للمراجعة النهائية", "لا يُضاف في RFQ قبل الاعتماد النهائي"],
      },
      Rejected: {
        msg: "❌ مورد مرفوض — يمكن إعادة فتحه بـ Review",
        color: "#ffebee",
        steps: ["سجّل سبب الرفض في build_rejection_reason", "يصله بريد تلقائياً"],
      },
    };

    if (!stage || !actions[stage]) {
      return;
    }

    const info = actions[stage];
    const stepsHtml = (info.steps || [])
      .map((step, index) => "<li style='margin:4px 0;'>" + (index + 1) + ". " + frappe.utils.escape_html(step) + "</li>")
      .join("");

    const div = $("<div id='build-supplier-action'></div>").css({
      background: info.color,
      borderRadius: "10px",
      padding: "14px 18px",
      margin: "10px 0 8px 0",
      fontSize: "14px",
      direction: "rtl",
      border: "1px solid rgba(29,63,31,.08)",
    });

    div.append($("<div></div>").css({ fontWeight: "700", marginBottom: "8px", color: "#1D3F1F" }).text(info.msg));
    if (stepsHtml) {
      div.append($("<ol></ol>").css({ margin: "0", paddingRight: "18px", color: "#374151" }).html(stepsHtml));
    }

    $(frm.layout.wrapper).find(".form-page").first().prepend(div);

    if (stage === "Rejected" && !frm.doc.build_rejection_reason) {
      frm.set_intro(__("يرجى تعبئة سبب الرفض في حقل build_rejection_reason"), "orange");
    }
  },
});
`;

const emailTemplates = [
  {
    name: "Build Supplier Approved",
    subject: "تم تفعيل حسابك كمورد — Build Saudi",
    response: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#1D3F1F">
<p>مرحباً {{ doc.build_manager_name or doc.supplier_name }}،</p>
<p>يسعدنا إبلاغكم بأن منشأة <strong>{{ doc.supplier_name }}</strong> أصبحت <strong>مورداً معتمداً</strong> في Build Saudi.</p>
<p>سنتواصل معكم عند توفر فرص توريد مناسبة لتخصصاتكم.</p>
<ul>
  <li>ستصلكم طلبات عروض الأسعار (RFQ) عبر البريد</li>
  <li>يمكنكم الرد بعرض السعر والمدة والشروط</li>
</ul>
<p>مع تحياتنا،<br/>فريق Build Saudi</p>
</div>`,
  },
  {
    name: "Build Supplier Rejected",
    subject: "بخصوص طلب الانضمام — Build Saudi",
    response: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#1D3F1F">
<p>مرحباً {{ doc.build_manager_name or doc.supplier_name }}،</p>
<p>نشكركم على اهتمامكم بالانضمام إلى شبكة موردي Build Saudi.</p>
<p>للأسف، لم نتمكن من قبول طلبكم في الوقت الحالي.</p>
{% if doc.build_rejection_reason %}<p><strong>السبب:</strong> {{ doc.build_rejection_reason }}</p>{% endif %}
<p>يمكنكم التواصل معنا لإعادة التقديم مستقبلاً.</p>
<p>مع تحياتنا،<br/>فريق Build Saudi</p>
</div>`,
  },
  {
    name: "Build Supplier New Registration Alert",
    subject: "مورد جديد من الموقع — {{ doc.supplier_name }}",
    response: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8;color:#1D3F1F">
<p><strong>مورد جديد من build.sa</strong></p>
<table style="width:100%;border-collapse:collapse">
<tr><td style="padding:8px;border:1px solid #e5e7eb">المنشأة</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.supplier_name }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">المسؤول</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.build_manager_name }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">الجوال</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.build_contact_number }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">البريد</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.build_email }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">السجل التجاري</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.build_cr_number }}</td></tr>
<tr><td style="padding:8px;border:1px solid #e5e7eb">الفئات</td><td style="padding:8px;border:1px solid #e5e7eb">{{ doc.build_product_categories }}</td></tr>
</table>
<p>الخطوة التالية: افتح المورد في ERPNext → Review → Approve أو Reject</p>
</div>`,
  },
];

const notifications = emailTemplates.map((template) => {
  if (template.name === "Build Supplier Approved") {
    return {
      name: "Build Supplier Approved Email",
      enabled: 0,
      document_type: "Supplier",
      event: "Value Change",
      value_changed: "build_supplier_stage",
      condition: 'doc.build_supplier_stage == "Approved" and doc.build_email',
      subject: template.subject,
      message: template.response,
      recipients: [{ receiver_by_document_field: "build_email" }],
    };
  }
  if (template.name === "Build Supplier Rejected") {
    return {
      name: "Build Supplier Rejected Email",
      document_type: "Supplier",
      event: "Value Change",
      value_changed: "build_supplier_stage",
      condition: 'doc.build_supplier_stage == "Rejected" and doc.build_email',
      subject: template.subject,
      message: template.response,
      recipients: [{ receiver_by_document_field: "build_email" }],
    };
  }
  return {
    name: "Build Supplier New Registration Alert",
    document_type: "Supplier",
    event: "New",
    condition: "doc.build_website_source",
    subject: template.subject,
    message: template.response,
    recipients: [
      { receiver_by_role: "Build Manager" },
      { receiver_by_role: "Build Operations" },
      { cc: adminEmail },
    ],
  };
});

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(JSON.stringify(json || text));
  }
  return json;
}

async function findByName(doctype, name) {
  try {
    await request(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`);
    return name;
  } catch {
    return null;
  }
}

async function upsert(doctype, name, data) {
  if (await findByName(doctype, name)) {
    await request(`/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return name;
  }

  const created = await request(`/api/resource/${encodeURIComponent(doctype)}`, {
    method: "POST",
    body: JSON.stringify({ data: { doctype, name, ...data } }),
  });
  return created.data.name;
}

// Remove legacy server scripts — not supported on Frappe Cloud
for (const name of ["Build Supplier Onboarding Automation", "Build Supplier Onboarding After Save"]) {
  if (await findByName("Server Script", name)) {
    await request(`/api/resource/Server%20Script/${encodeURIComponent(name)}`, { method: "DELETE" });
    console.log(`  ✕ removed Server Script / ${name}`);
  }
}

const savedTemplates = [];
for (const template of emailTemplates) {
  savedTemplates.push(
    await upsert("Email Template", template.name, {
      subject: template.subject,
      use_html: 1,
      response: template.response,
    })
  );
}

const savedNotifications = [];
for (const notification of notifications) {
  savedNotifications.push(
    await upsert("Notification", notification.name, {
      enabled: notification.enabled ?? 1,
      channel: "Email",
      event: notification.event,
      document_type: notification.document_type,
      value_changed: notification.value_changed || "",
      condition: notification.condition,
      subject: notification.subject,
      message_type: "HTML",
      message: notification.message,
      sender: "Build Resend",
      recipients: notification.recipients.map((row, idx) => ({
        idx: idx + 1,
        ...row,
      })),
    })
  );
}

const savedClientScript = await upsert("Client Script", "Build Supplier Next Action", {
  dt: "Supplier",
  view: "Form",
  enabled: 1,
  script: clientScript.trim(),
});

console.log(
  JSON.stringify(
    {
      ok: true,
      approach: "client-script-and-notifications",
      emailTemplates: savedTemplates,
      notifications: savedNotifications,
      clientScript: savedClientScript,
      adminEmail,
    },
    null,
    2
  )
);