/**
 * setup-build-print-formats.mjs
 * Creates professional Arabic print formats for Build Saudi in ERPNext.
 *
 * Formats:
 *   1. "Build عرض السعر"        — Customer Quotation (sent to client)
 *   2. "Build طلب عرض المورد"   — Request for Quotation (sent to supplier)
 *
 * Run:
 *   ERPNEXT_API_TOKEN=key:secret node scripts/erpnext/setup-build-print-formats.mjs
 */

const BASE_URL = (process.env.ERPNEXT_URL || "https://build.k.frappe.cloud").replace(/\/$/, "");
const API_TOKEN = process.env.ERPNEXT_API_TOKEN;
if (!API_TOKEN) throw new Error("ERPNEXT_API_TOKEN is required");

const headers = {
  Authorization: `token ${API_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${data?.exception || data?.message || text}`);
  return data?.data ?? data?.message ?? data;
}

async function exists(name) {
  try {
    await api("GET", `/api/resource/Print Format/${encodeURIComponent(name)}`);
    return true;
  } catch (e) {
    if (e.message.includes("404") || e.message.includes("DoesNotExist")) return false;
    throw e;
  }
}

async function upsert(name, doc) {
  if (await exists(name)) {
    console.log(`  ↻ update  Print Format / ${name}`);
    return api("PUT", `/api/resource/Print Format/${encodeURIComponent(name)}`, doc);
  }
  console.log(`  + create  Print Format / ${name}`);
  return api("POST", `/api/resource/Print Format`, { ...doc, name });
}

// ─── Shared CSS ──────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

body, .print-format {
  font-family: 'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif;
  font-size: 13px;
  color: #1a1a1a;
  direction: rtl;
  background: #fff;
}

.page {
  padding: 40px 48px;
  max-width: 900px;
  margin: 0 auto;
}

/* ── Header ── */
.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 3px solid #1D3F1F;
  padding-bottom: 24px;
  margin-bottom: 28px;
}
.doc-header .brand { display: flex; flex-direction: column; gap: 4px; }
.doc-header .brand .tagline { font-size: 11px; color: #6b7280; }
.doc-header .brand .logo-text {
  font-size: 28px; font-weight: 700; color: #1D3F1F; letter-spacing: -1px;
}
.doc-header .doc-meta { text-align: left; }
.doc-header .doc-meta .doc-type {
  font-size: 18px; font-weight: 700; color: #1D3F1F; margin-bottom: 8px;
}
.doc-meta table { font-size: 12px; color: #374151; }
.doc-meta td { padding: 2px 8px; }
.doc-meta td:first-child { color: #6b7280; text-align: right; }

/* ── Party Info ── */
.parties { display: flex; gap: 24px; margin-bottom: 24px; }
.party-card {
  flex: 1;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px 18px;
}
.party-card .party-label {
  font-size: 10px; font-weight: 600; color: #6b7280;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.party-card .party-name { font-size: 15px; font-weight: 700; color: #1D3F1F; margin-bottom: 4px; }
.party-card .party-detail { font-size: 12px; color: #4b5563; line-height: 1.6; }

/* ── Items Table ── */
.section-title {
  font-size: 12px; font-weight: 600; color: #6b7280;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}
.items-table {
  width: 100%; border-collapse: collapse; margin-bottom: 24px;
  font-size: 12.5px;
}
.items-table thead tr {
  background: #1D3F1F; color: #fff;
}
.items-table th {
  padding: 10px 12px; text-align: right; font-weight: 600; font-size: 12px;
}
.items-table td {
  padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top;
}
.items-table tbody tr:nth-child(even) { background: #f9fafb; }
.items-table tbody tr:last-child td { border-bottom: none; }
.items-table .item-name { font-weight: 600; color: #111827; }
.items-table .item-desc { font-size: 11px; color: #6b7280; margin-top: 2px; }
.items-table .num { text-align: left; font-variant-numeric: tabular-nums; }

/* ── Totals ── */
.totals-wrap { display: flex; justify-content: flex-start; margin-bottom: 28px; }
.totals-box {
  width: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}
.totals-box table { width: 100%; font-size: 13px; }
.totals-box td { padding: 9px 14px; }
.totals-box tr:not(:last-child) td { border-bottom: 1px solid #f0f0f0; }
.totals-box tr:last-child { background: #1D3F1F; color: #fff; }
.totals-box tr:last-child td { font-weight: 700; font-size: 14px; }
.totals-box .label { color: #6b7280; text-align: right; }
.totals-box .value { text-align: left; font-variant-numeric: tabular-nums; }
.totals-box tr:last-child .label { color: #d1fae5; }

/* ── Terms ── */
.terms-box {
  background: #f9fafb; border: 1px solid #e5e7eb;
  border-radius: 10px; padding: 16px 18px; margin-bottom: 24px;
  font-size: 12px; color: #374151; line-height: 1.7;
}

/* ── Footer ── */
.doc-footer {
  border-top: 1px solid #e5e7eb; padding-top: 16px;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11px; color: #9ca3af;
}
.doc-footer .brand-small { font-weight: 700; color: #1D3F1F; font-size: 13px; }

/* ── Status Badge ── */
.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 600;
  background: #d1fae5; color: #065f46;
}

/* ── Notes ── */
.notes { font-size: 12px; color: #4b5563; line-height: 1.7; margin-bottom: 24px; }
`.trim();

// ─── 1. Customer Quotation ───────────────────────────────────────────────────

const QUOTATION_HTML = `
<div class="page">

  <div class="doc-header">
    <div class="brand">
      <div class="logo-text">Build</div>
      <div class="tagline">شريك التوريد للمقاولين والمطورين</div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">عرض السعر</div>
      <table>
        <tr><td>رقم العرض</td><td><strong>{{ doc.name }}</strong></td></tr>
        <tr><td>التاريخ</td><td>{{ frappe.format(doc.transaction_date, {fieldtype:"Date"}) }}</td></tr>
        <tr><td>صالح حتى</td><td>{{ frappe.format(doc.valid_till, {fieldtype:"Date"}) }}</td></tr>
        <tr><td>الحالة</td><td><span class="status-badge">{{ doc.status }}</span></td></tr>
      </table>
    </div>
  </div>

  <div class="parties">
    <div class="party-card">
      <div class="party-label">مقدَّم إلى</div>
      <div class="party-name">{{ doc.customer_name or doc.party_name }}</div>
      {% if doc.contact_email %}<div class="party-detail">{{ doc.contact_email }}</div>{% endif %}
      {% if doc.contact_mobile %}<div class="party-detail">{{ doc.contact_mobile }}</div>{% endif %}
    </div>
    <div class="party-card">
      <div class="party-label">من</div>
      <div class="party-name">Build Saudi</div>
      <div class="party-detail">
        info@buildsaudi.com<br>
        www.build.sa<br>
        المملكة العربية السعودية
      </div>
    </div>
  </div>

  {% if doc.items %}
  <div class="section-title">الأصناف والكميات</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>الصنف</th>
        <th style="width:80px" class="num">الكمية</th>
        <th style="width:60px">الوحدة</th>
        <th style="width:100px" class="num">سعر الوحدة</th>
        <th style="width:110px" class="num">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      {% for row in doc.items %}
      <tr>
        <td class="num" style="color:#9ca3af">{{ loop.index }}</td>
        <td>
          <div class="item-name">{{ row.item_name }}</div>
          {% if row.description and row.description != row.item_name %}
          <div class="item-desc">{{ row.description }}</div>
          {% endif %}
        </td>
        <td class="num">{{ row.qty }}</td>
        <td>{{ row.uom }}</td>
        <td class="num">{{ frappe.format(row.rate, {fieldtype:"Currency", currency: doc.currency}) }}</td>
        <td class="num"><strong>{{ frappe.format(row.amount, {fieldtype:"Currency", currency: doc.currency}) }}</strong></td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
  {% endif %}

  <div class="totals-wrap">
    <div class="totals-box">
      <table>
        <tr>
          <td class="label">المجموع</td>
          <td class="value">{{ frappe.format(doc.total, {fieldtype:"Currency", currency: doc.currency}) }}</td>
        </tr>
        {% if doc.discount_amount and doc.discount_amount > 0 %}
        <tr>
          <td class="label">الخصم</td>
          <td class="value">- {{ frappe.format(doc.discount_amount, {fieldtype:"Currency", currency: doc.currency}) }}</td>
        </tr>
        {% endif %}
        {% if doc.taxes %}
        {% for tax in doc.taxes %}
        <tr>
          <td class="label">{{ tax.description }}</td>
          <td class="value">{{ frappe.format(tax.tax_amount, {fieldtype:"Currency", currency: doc.currency}) }}</td>
        </tr>
        {% endfor %}
        {% endif %}
        <tr>
          <td class="label">الإجمالي النهائي</td>
          <td class="value">{{ frappe.format(doc.grand_total, {fieldtype:"Currency", currency: doc.currency}) }}</td>
        </tr>
      </table>
    </div>
  </div>

  {% if doc.terms %}
  <div class="section-title">الشروط والأحكام</div>
  <div class="terms-box">{{ doc.terms }}</div>
  {% endif %}

  {% if doc.note %}
  <div class="section-title">ملاحظات</div>
  <div class="notes">{{ doc.note }}</div>
  {% endif %}

  <div class="doc-footer">
    <div>
      <span class="brand-small">Build Saudi</span><br>
      شريك التوريد الموثوق للمقاولين والمطورين في المملكة
    </div>
    <div style="text-align:left">
      هذا المستند صادر آلياً من منظومة Build<br>
      للاستفسار: info@buildsaudi.com
    </div>
  </div>

</div>
`.trim();

// ─── 2. Request for Quotation ────────────────────────────────────────────────

const RFQ_HTML = `
<div class="page">

  <div class="doc-header">
    <div class="brand">
      <div class="logo-text">Build</div>
      <div class="tagline">شريك التوريد للمقاولين والمطورين</div>
    </div>
    <div class="doc-meta">
      <div class="doc-type">طلب عرض سعر</div>
      <table>
        <tr><td>رقم الطلب</td><td><strong>{{ doc.name }}</strong></td></tr>
        <tr><td>التاريخ</td><td>{{ frappe.format(doc.transaction_date, {fieldtype:"Date"}) }}</td></tr>
        <tr><td>آخر موعد للرد</td><td>{{ frappe.format(doc.message_for_supplier, {fieldtype:"Small Text"}) if not doc.schedule_date else frappe.format(doc.schedule_date, {fieldtype:"Date"}) }}</td></tr>
      </table>
    </div>
  </div>

  {% if doc.suppliers %}
  <div class="parties">
    {% for s in doc.suppliers %}
    <div class="party-card">
      <div class="party-label">إلى المورد</div>
      <div class="party-name">{{ s.supplier_name }}</div>
      {% if s.email_id %}<div class="party-detail">{{ s.email_id }}</div>{% endif %}
    </div>
    {% endfor %}
    <div class="party-card">
      <div class="party-label">من</div>
      <div class="party-name">Build Saudi</div>
      <div class="party-detail">
        procurement@buildsaudi.com<br>
        www.build.sa
      </div>
    </div>
  </div>
  {% endif %}

  {% if doc.message_for_supplier %}
  <div class="notes">
    <strong>رسالة للمورد:</strong><br>
    {{ doc.message_for_supplier }}
  </div>
  {% endif %}

  {% if doc.items %}
  <div class="section-title">الأصناف المطلوبة</div>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px">#</th>
        <th>الصنف</th>
        <th style="width:80px" class="num">الكمية</th>
        <th style="width:70px">الوحدة</th>
        <th style="width:120px" class="num">سعر الوحدة المقترح</th>
        <th style="width:120px" class="num">سعرك النهائي</th>
      </tr>
    </thead>
    <tbody>
      {% for row in doc.items %}
      <tr>
        <td class="num" style="color:#9ca3af">{{ loop.index }}</td>
        <td>
          <div class="item-name">{{ row.item_name }}</div>
          {% if row.description and row.description != row.item_name %}
          <div class="item-desc">{{ row.description }}</div>
          {% endif %}
        </td>
        <td class="num">{{ row.qty }}</td>
        <td>{{ row.uom }}</td>
        <td class="num" style="color:#6b7280">
          {% if row.rate and row.rate > 0 %}
          {{ frappe.format(row.rate, {fieldtype:"Currency"}) }}
          {% else %}
          —
          {% endif %}
        </td>
        <td class="num">
          <div style="border-bottom:1px solid #d1d5db;height:20px;width:90px"></div>
        </td>
      </tr>
      {% endfor %}
    </tbody>
  </table>
  {% endif %}

  <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:16px 18px;margin-bottom:24px;font-size:12px;color:#92400e;">
    <strong>تعليمات الرد:</strong><br>
    يُرجى تعبئة سعر الوحدة لكل صنف وإعادة إرسال هذا النموذج على البريد: procurement@buildsaudi.com<br>
    أو تسجيل عرضكم مباشرة عبر النظام.
  </div>

  {% if doc.terms %}
  <div class="section-title">الشروط والأحكام</div>
  <div class="terms-box">{{ doc.terms }}</div>
  {% endif %}

  <div class="doc-footer">
    <div>
      <span class="brand-small">Build Saudi</span><br>
      شريك التوريد الموثوق للمقاولين والمطورين في المملكة
    </div>
    <div style="text-align:left">
      هذا المستند سري ومخصص للمورد المُرسَل إليه فقط<br>
      للاستفسار: procurement@buildsaudi.com
    </div>
  </div>

</div>
`.trim();

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nBuild Saudi — Print Formats Setup`);
  console.log(`Target: ${BASE_URL}\n`);

  console.log("── Customer Quotation ─────────────────────");
  await upsert("Build عرض السعر", {
    doc_type: "Quotation",
    module: "CRM",
    standard: "No",
    disabled: 0,
    print_format_type: "Jinja",
    html: QUOTATION_HTML,
    css: CSS,
    align_labels_right: 1,
    default_print_language: "ar",
  });

  console.log("\n── Request for Quotation ──────────────────");
  await upsert("Build طلب عرض المورد", {
    doc_type: "Request for Quotation",
    module: "Buying",
    standard: "No",
    disabled: 0,
    print_format_type: "Jinja",
    html: RFQ_HTML,
    css: CSS,
    align_labels_right: 1,
    default_print_language: "ar",
  });

  console.log("\n✅ Done. Open any Quotation or RFQ in ERPNext,");
  console.log('   click Print → choose "Build عرض السعر" or "Build طلب عرض المورد".\n');
}

main().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});
