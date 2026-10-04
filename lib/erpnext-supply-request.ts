import {
  addComment,
  addTag,
  createDoc,
  erpnextCompany,
  getDoc,
  getList,
  updateDoc,
  uploadFileToDoc,
  ErpnextClientError,
} from "./erpnext.ts";

/**
 * تحويل "طلب توريد" العميل (get-quote) إلى مستندات ERPNext أصلية:
 *   Customer (+ Contact + Address)  →  Items (مطابقة/إنشاء)  →  Material Request (Purpose = Purchase, Draft).
 * رقم التتبّع المعروض للعميل = اسم الـMaterial Request (naming series أصلية) — لا نظام ترقيم موازٍ.
 */

export type SupplyRequestLine = {
  itemName: string;
  quantity: number;
  unit?: string;
  brand?: string;
  countryOfOrigin?: string;
};

export type SupplyRequestFile = {
  name: string;
  mimeType: string;
  base64Data: string;
};

export type SupplyRequestInput = {
  submissionId: string;
  legalName?: string;
  contactName: string;
  email: string;
  phone: string;
  projectName: string;
  notes?: string;
  requestedDeliveryDate?: string; // ISO yyyy-mm-dd أو فارغ
  lines: SupplyRequestLine[];
  files?: SupplyRequestFile[];
  correlationId: string;
};

export type SupplyRequestResult = {
  trackingNumber: string; // = material request name
  materialRequest: string;
  customer: string;
  project: string;
  createdItems: string[];
  reusedItems: string[];
};

const REVIEW_ITEM_GROUP = "Needs Review";
const REVIEW_TAG = "Needs Review";

/** تعيين وحدات القياس الحرة (عربي/إنجليزي) إلى UOM قياسية؛ غير المعروف → Nos (مع إبقاء النص الأصلي في الوصف) */
const UOM_MAP: Record<string, string> = {
  قطعة: "Nos",
  حبة: "Nos",
  حبه: "Nos",
  عدد: "Nos",
  وحدة: "Unit",
  متر: "Meter",
  م: "Meter",
  "م2": "Square Meter",
  "م٢": "Square Meter",
  "م3": "Cubic Meter",
  "م٣": "Cubic Meter",
  كجم: "Kg",
  كيلو: "Kg",
  كغم: "Kg",
  طن: "Tonne",
  لتر: "Litre",
  كرتون: "Box",
  علبة: "Box",
  صندوق: "Box",
  كيس: "Bag",
  رول: "Roll",
  لفة: "Roll",
};

function mapUom(unit: string | undefined): { uom: string; raw: string | null } {
  const raw = (unit || "").trim();
  if (!raw) return { uom: "Nos", raw: null };
  if (UOM_MAP[raw]) return { uom: UOM_MAP[raw], raw };
  // إنجليزي قياسي شائع — مرّره كما هو إن بدا UOM معروفاً، وإلا Nos
  const known = ["Nos", "Unit", "Meter", "Square Meter", "Cubic Meter", "Kg", "Tonne", "Litre", "Box", "Bag", "Roll", "Set", "Pair"];
  const match = known.find((k) => k.toLowerCase() === raw.toLowerCase());
  return match ? { uom: match, raw: null } : { uom: "Nos", raw };
}

/** رمز صنف صالح من اسم حر */
function toItemCode(name: string): string {
  return name
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[<>/\\]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 140)
    .trim();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// Customer / Contact / Address (dedup: lookup-before-create)
// ─────────────────────────────────────────────────────────────

type ContactRow = { name: string };
type DynamicLink = { link_doctype?: string; link_name?: string };

async function findCustomerByContact(email: string, phone: string, cid: string): Promise<string | null> {
  // ابحث عن Contact بالبريد أو الجوال، ثم اتبع الرابط الديناميكي للعميل
  const byEmail = email ? await getList<ContactRow>("Contact", { filters: [["email_id", "=", email]], fields: ["name"], limit: 1, correlationId: cid }) : [];
  const byPhone = !byEmail.length && phone ? await getList<ContactRow>("Contact", { filters: [["mobile_no", "=", phone]], fields: ["name"], limit: 1, correlationId: cid }) : [];
  const contactName = byEmail[0]?.name || byPhone[0]?.name;
  if (!contactName) return null;
  const contact = await getDoc<{ links?: DynamicLink[] }>("Contact", contactName, cid);
  const link = (contact.links || []).find((l) => l.link_doctype === "Customer" && l.link_name);
  return link?.link_name ?? null;
}

async function findOrCreateCustomer(input: SupplyRequestInput): Promise<string> {
  const cid = input.correlationId;
  // 1) عبر Contact الموجود
  const viaContact = await findCustomerByContact(input.email, input.phone, cid);
  if (viaContact) return viaContact;

  // 2) عبر اسم العميل (الشركة أو جهة الاتصال)
  const name = (input.legalName || input.contactName).trim();
  const existing = await getList<{ name: string }>("Customer", { filters: [["customer_name", "=", name]], fields: ["name"], limit: 1, correlationId: cid });
  if (existing[0]?.name) {
    await ensureContactAndAddress(existing[0].name, input);
    return existing[0].name;
  }

  // 3) إنشاء عميل جديد
  const isCompany = Boolean(input.legalName && input.legalName.trim());
  const customer = await createDoc<{ name: string }>(
    "Customer",
    {
      customer_name: name,
      customer_type: isCompany ? "Company" : "Individual",
      customer_group: isCompany ? "Commercial" : "Individual",
      territory: "Saudi Arabia",
    },
    cid
  );
  await ensureContactAndAddress(customer.name, input);
  return customer.name;
}

async function ensureContactAndAddress(customerName: string, input: SupplyRequestInput): Promise<void> {
  const cid = input.correlationId;
  // Contact
  let contactName: string | null = null;
  const existingContact = input.email
    ? await getList<ContactRow>("Contact", { filters: [["email_id", "=", input.email]], fields: ["name"], limit: 1, correlationId: cid })
    : [];
  if (existingContact[0]?.name) {
    contactName = existingContact[0].name;
  } else {
    const [firstName, ...rest] = input.contactName.trim().split(/\s+/);
    const contact = await createDoc<{ name: string }>(
      "Contact",
      {
        first_name: firstName || input.contactName,
        last_name: rest.join(" ") || undefined,
        company_name: input.legalName || undefined,
        is_primary_contact: 1,
        email_ids: input.email ? [{ email_id: input.email, is_primary: 1 }] : [],
        phone_nos: input.phone ? [{ phone: input.phone, is_primary_mobile_no: 1 }] : [],
        links: [{ link_doctype: "Customer", link_name: customerName }],
      },
      cid
    );
    contactName = contact.name;
  }

  // Address (موقع التسليم) — ننشئ واحداً إن لم يوجد عنوان مرتبط بالعميل
  const existingAddr = await getList<{ name: string }>("Address", {
    filters: [["address_title", "=", customerName]],
    fields: ["name"],
    limit: 1,
    correlationId: cid,
  });
  let addressName = existingAddr[0]?.name || null;
  if (!addressName) {
    const line1 = (input.notes || input.projectName || "موقع المشروع").slice(0, 140);
    const addr = await createDoc<{ name: string }>(
      "Address",
      {
        address_title: customerName,
        address_type: "Shipping",
        address_line1: line1 || "—",
        city: "غير محدد",
        country: "Saudi Arabia",
        is_shipping_address: 1,
        phone: input.phone || undefined,
        email_id: input.email || undefined,
        links: [{ link_doctype: "Customer", link_name: customerName }],
      },
      cid
    );
    addressName = addr.name;
  }

  // اربط الأساسي على العميل (best-effort — لا يفشل الطلب)
  try {
    await updateDoc(
      "Customer",
      customerName,
      {
        ...(contactName ? { customer_primary_contact: contactName } : {}),
        ...(addressName ? { customer_primary_address: addressName } : {}),
      },
      cid
    );
  } catch {
    /* ربط الأساسي تحسيني فقط */
  }
}

// ─────────────────────────────────────────────────────────────
// Project (native customer↔purchase↔sales↔costs linkage, spec §7)
// ملاحظة: MR.customer عليه depends_on=Customer Provided فيُمسح لنوع Purchase،
// فالربط الأصلي الصحيح للعميل بطلب شراء هو عبر Project على بنود الـMR.
// ─────────────────────────────────────────────────────────────

async function findOrCreateProject(customer: string, projectName: string, cid: string): Promise<string> {
  const name = projectName.trim().slice(0, 140) || "Build Supply Request";
  const existing = await getList<{ name: string }>("Project", {
    filters: [
      ["customer", "=", customer],
      ["project_name", "=", name],
    ],
    fields: ["name"],
    limit: 1,
    correlationId: cid,
  });
  if (existing[0]?.name) return existing[0].name;
  const project = await createDoc<{ name: string }>(
    "Project",
    { project_name: name, company: erpnextCompany(), customer, status: "Open" },
    cid
  );
  return project.name;
}

// ─────────────────────────────────────────────────────────────
// Items (match → reuse → else create tagged "Needs Review")
// ─────────────────────────────────────────────────────────────

type ResolvedItem = { itemCode: string; stockUom: string; created: boolean; line: SupplyRequestLine };

async function resolveItem(line: SupplyRequestLine, cid: string): Promise<ResolvedItem> {
  const name = line.itemName.trim();
  // مطابقة عالية الثقة = تطابق اسم (collation غير حساس لحالة الأحرف في MySQL)
  const match = await getList<{ name: string; stock_uom: string }>("Item", {
    filters: [["item_name", "=", name]],
    fields: ["name", "stock_uom"],
    limit: 1,
    correlationId: cid,
  });
  if (match[0]?.name) {
    return { itemCode: match[0].name, stockUom: match[0].stock_uom || "Nos", created: false, line };
  }

  const { uom, raw } = mapUom(line.unit);
  const descParts = [
    line.brand ? `Brand (free text): ${line.brand}` : null,
    line.countryOfOrigin ? `Country of origin: ${line.countryOfOrigin}` : null,
    raw ? `Requested unit: ${raw}` : null,
    "Auto-created from customer supply request — review & normalize.",
  ].filter(Boolean);
  const itemCode = toItemCode(name);
  try {
    const item = await createDoc<{ name: string; stock_uom: string }>(
      "Item",
      {
        item_code: itemCode,
        item_name: name.slice(0, 140),
        item_group: REVIEW_ITEM_GROUP,
        stock_uom: uom,
        is_stock_item: 1,
        is_purchase_item: 1,
        is_sales_item: 1,
        include_item_in_manufacturing: 0,
        description: descParts.join("\n"),
      },
      cid
    );
    try {
      await addTag("Item", item.name, REVIEW_TAG, cid);
    } catch {
      /* الوسم تحسيني */
    }
    return { itemCode: item.name, stockUom: item.stock_uom || uom, created: true, line };
  } catch (error) {
    // سباق/تكرار: صنف بنفس الرمز أُنشئ بالتوازي — أعد الجلب وأعد الاستخدام
    if (error instanceof ErpnextClientError && error.kind === "conflict") {
      const again = await getList<{ name: string; stock_uom: string }>("Item", {
        filters: [["item_code", "=", itemCode]],
        fields: ["name", "stock_uom"],
        limit: 1,
        correlationId: cid,
      });
      if (again[0]?.name) return { itemCode: again[0].name, stockUom: again[0].stock_uom || uom, created: false, line };
    }
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// Material Request (Purpose = Purchase, Draft)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Customer tracking (safe view) — /api/quotes/track
// token = Material Request name (the reference shown to the customer).
// Returns ONLY customer-safe fields (spec §40): no supplier, cost, margin, or internal notes.
// ─────────────────────────────────────────────────────────────

export type SupplyRequestTracking = {
  trackingNumber: string;
  projectName: string;
  customerStatus: string;
  requestDate: string;
  declineReason: string | null;
};

/** يحوّل حالة Material Request إلى حالة عامة آمنة للعميل */
function mapMrStatus(status: string): { customerStatus: string; declineReason: string | null } {
  switch (status) {
    case "Draft":
    case "Pending":
      return { customerStatus: "reviewing", declineReason: null };
    case "Partially Ordered":
      return { customerStatus: "confirmed", declineReason: null };
    case "Ordered":
      return { customerStatus: "preparing", declineReason: null };
    case "Partially Received":
      return { customerStatus: "preparing", declineReason: null };
    case "Received":
      return { customerStatus: "ready_to_ship", declineReason: null };
    case "Issued":
    case "Transferred":
      return { customerStatus: "in_transit", declineReason: null };
    case "Stopped":
      return { customerStatus: "needs_attention", declineReason: null };
    case "Cancelled":
      return { customerStatus: "declined", declineReason: "other" };
    default:
      return { customerStatus: "received", declineReason: null };
  }
}

export async function getSupplyRequestTracking(token: string, cid: string): Promise<SupplyRequestTracking | null> {
  const name = token.trim();
  // قبول اسم Material Request فقط (لا تخمين على doctypes أخرى)
  if (!name) return null;
  let mr: { name: string; status: string; transaction_date: string; items?: { project?: string }[] };
  try {
    mr = await getDoc("Material Request", name, cid);
  } catch (error) {
    if (error instanceof ErpnextClientError && error.kind === "not_found") return null;
    throw error;
  }
  // اسم المشروع (للعرض) — من أول بند مرتبط بمشروع
  let projectName = "";
  const projectId = (mr.items || []).map((i) => i.project).find(Boolean);
  if (projectId) {
    try {
      const p = await getDoc<{ project_name?: string }>("Project", projectId, cid);
      projectName = p.project_name || "";
    } catch {
      /* اسم المشروع تحسيني */
    }
  }
  const { customerStatus, declineReason } = mapMrStatus(mr.status);
  return { trackingNumber: mr.name, projectName, customerStatus, requestDate: mr.transaction_date || "", declineReason };
}

export async function createSupplyRequestInErpnext(input: SupplyRequestInput): Promise<SupplyRequestResult> {
  const cid = input.correlationId;
  if (!input.lines.length) {
    throw new ErpnextClientError({
      message: "supply request has no lines",
      kind: "validation",
      retryable: false,
      correlationId: cid,
      publicMessage: "أضف صنفاً واحداً على الأقل للطلب",
    });
  }

  const customer = await findOrCreateCustomer(input);
  const project = await findOrCreateProject(customer, input.projectName, cid);

  const resolved: ResolvedItem[] = [];
  for (const line of input.lines) {
    resolved.push(await resolveItem(line, cid));
  }

  const scheduleDate = input.requestedDeliveryDate?.trim() || plusDaysIso(7);
  const mrItems = resolved.map((r) => {
    const { uom } = mapUom(r.line.unit);
    const itemUom = r.created ? uom : r.stockUom; // لصنف جديد استخدم الوحدة المعيّنة، وإلا stock_uom للموجود
    return {
      item_code: r.itemCode,
      qty: r.line.quantity,
      schedule_date: scheduleDate,
      uom: itemUom,
      stock_uom: r.stockUom,
      conversion_factor: 1,
      item_group: REVIEW_ITEM_GROUP,
      project, // ربط العميل الأصلي عبر المشروع
      description: [r.line.itemName, r.line.brand ? `(${r.line.brand})` : null].filter(Boolean).join(" "),
    };
  });

  const mr = await createDoc<{ name: string }>(
    "Material Request",
    {
      material_request_type: "Purchase",
      company: erpnextCompany(),
      transaction_date: todayIso(),
      schedule_date: scheduleDate,
      items: mrItems,
      // يبقى Draft — لا submit ولا أي أثر محاسبي. ربط العميل عبر Project على البنود (MR.customer يُمسح لنوع Purchase).
    },
    cid
  );

  // ملاحظات تشغيلية (الوصف + موقع التسليم + المشروع + معرّف الإرسال) كتعليق أصلي
  const commentLines = [
    `Project: ${input.projectName}`,
    input.notes ? `Notes / delivery: ${input.notes}` : null,
    `Website submission_id: ${input.submissionId}`,
  ].filter(Boolean);
  try {
    await addComment("Material Request", mr.name, commentLines.join("\n"), cid);
  } catch {
    /* التعليق تحسيني */
  }

  // إرفاق ملفات العميل (BOQ/PDF) بالـMR — best-effort، لا يُفشل الطلب
  for (const f of input.files || []) {
    try {
      await uploadFileToDoc({
        fileName: f.name,
        base64Data: f.base64Data,
        mimeType: f.mimeType,
        doctype: "Material Request",
        docname: mr.name,
        isPrivate: true,
        correlationId: cid,
      });
    } catch {
      /* إرفاق الملف تحسيني */
    }
  }

  return {
    trackingNumber: mr.name,
    materialRequest: mr.name,
    customer,
    project,
    createdItems: resolved.filter((r) => r.created).map((r) => r.itemCode),
    reusedItems: resolved.filter((r) => !r.created).map((r) => r.itemCode),
  };
}
