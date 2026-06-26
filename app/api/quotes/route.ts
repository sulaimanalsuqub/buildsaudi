import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { attachERPNextFileToDocument, createERPNextProductOpportunity, resolveOrCreateLead, updateERPNextDocument, type ERPNextMaterialItem } from "@/lib/erpnext";
import { runOpportunityAgent, suggestSuppliersForOpportunity } from "@/lib/build-agents";
import { extractMaterialItems } from "@/lib/material-extraction";
import { checkRateLimit, rateLimitError, getClientIdentifier } from "@/lib/rate-limit";
import { sendNewQuoteNotification, sendQuoteConfirmationToClient } from "@/lib/email";
import { verifyEmailToken } from "@/lib/otp";
import { verifyUploadAttachToken } from "@/lib/upload-token";

const optionalText = z.preprocess(
  (value) => (value === null ? "" : value),
  z.string().trim().optional().or(z.literal(""))
);


const optionalEmail = z.preprocess(
  (value) => (value === null ? "" : value),
  z.string().trim().email().optional().or(z.literal(""))
);

const quoteSchema = z.object({
  project_name: z.string().trim().min(2),
  client_name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  client_email: optionalEmail,
  email_verified_token: z.string().optional(),
  contact_method: z.enum(["email", "whatsapp"]).default("whatsapp"),
  materials: optionalText,
  delivery_address: z.string().trim().min(2),
  delivery_date: z.string().trim().min(1),
  notes: optionalText,
  boq_file_url: optionalText,
  boq_file_name: optionalText,
  boq_attach_token: optionalText,
  boq_file_text: optionalText,
}).refine((data) => Boolean(data.materials || data.boq_file_url || data.boq_file_text), {
  path: ["materials"],
  message: "Materials or quantity file is required",
}).refine((data) => {
  if (!data.client_email) return true;
  return data.email_verified_token && verifyEmailToken(data.client_email, data.email_verified_token);
}, {
  path: ["client_email"],
  message: "يجب التحقق من البريد الإلكتروني أولاً",
});

export async function POST(req: NextRequest) {
  const clientId = getClientIdentifier(req);
  const { ok, resetAt } = checkRateLimit(clientId, "forms");
  if (!ok) return rateLimitError(resetAt, "طلبات تسعير");

  const parsed = quoteSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الطلب غير مكتملة أو غير صحيحة" }, { status: 400 });
  }

  const quote = parsed.data;

  let opportunity: { name: string };
  try {
    // بحث اللـ Lead وإنشاء الـ Opportunity بدون انتظار DeepSeek
    const resolvedLead = await resolveOrCreateLead({
      client_name: quote.client_name,
      phone: quote.phone,
      client_email: quote.client_email,
    });

    opportunity = await createERPNextProductOpportunity({
      ...quote,
      extracted_items: [],
      resolved_lead: resolvedLead,
    });
  } catch (error) {
    console.error("ERPNext opportunity creation failed:", error);
    return NextResponse.json({ error: "تعذر حفظ طلب المنتجات في نظام العمليات" }, { status: 500 });
  }

  // إيميلات + استخراج المواد في الخلفية بعد إرسال الرد
  const opportunityName = opportunity.name;
  void Promise.allSettled([
    sendNewQuoteNotification({
      id: opportunityName,
      project_name: quote.project_name,
      client_name: quote.client_name,
      phone: quote.phone,
      delivery_address: quote.delivery_address,
      materials: quote.materials || quote.boq_file_text || quote.boq_file_url || "ملف كميات مرفق",
    }),
    quote.client_email
      ? sendQuoteConfirmationToClient({
          project_name: quote.project_name,
          client_name: quote.client_name,
          client_email: quote.client_email,
        })
      : Promise.resolve(),
    quote.boq_file_name && quote.boq_attach_token && verifyUploadAttachToken(quote.boq_file_name, quote.boq_attach_token)
      ? attachERPNextFileToDocument(quote.boq_file_name, "Opportunity", opportunityName)
      : Promise.resolve(),
    extractMaterialItems({
      materials: quote.materials,
      notes: quote.notes,
      boq_file_url: quote.boq_file_url,
      boq_file_text: quote.boq_file_text,
    }).then(async (items) => {
      const mappedItems = (items || []).map((item: ERPNextMaterialItem, index: number) => ({
        doctype: "Build Request Material Item",
        idx: index + 1,
        build_item_name: item.item_name,
        build_description: item.description,
        build_quantity: item.quantity,
        build_uom: item.uom,
        build_category: item.category,
        build_specifications: item.specifications,
        build_confidence: item.confidence,
        build_source: item.source,
        build_review_status: item.confidence >= 85 ? "Approved" : "Needs Review",
      }));

      const categories = [...new Set(mappedItems.map((i) => i.build_category).filter(Boolean))];
      const suggestedSuppliers = await suggestSuppliersForOpportunity({
        categories: categories.length ? categories : ["مواد بناء"],
        deliveryAddress: quote.delivery_address,
      }).catch(() => []);

      const agent = runOpportunityAgent({
        project_name: quote.project_name,
        client_name: quote.client_name,
        delivery_address: quote.delivery_address,
        materials: quote.materials,
        extracted_items: mappedItems.map((i) => ({
          item_name: i.build_item_name,
          category: i.build_category,
          confidence: i.build_confidence,
        })),
        suggested_suppliers: suggestedSuppliers,
      });

      return updateERPNextDocument("Opportunity", opportunityName, {
        build_material_extraction_status: mappedItems.length ? "Extracted" : "Needs Review",
        build_material_extraction_summary: mappedItems.length
          ? `Extracted ${mappedItems.length} material item(s). Auto-approved: ${agent.autoApprovedItems}.`
          : "No structured items extracted. Review raw request.",
        build_extracted_material_items: mappedItems,
        build_agent_summary: agent.summary,
        build_suggested_suppliers: JSON.stringify(suggestedSuppliers, null, 2),
        build_agent_score: suggestedSuppliers[0]?.score ?? 0,
      }).catch((e: unknown) => console.error("Background agent update failed:", e));
    }).catch(async () => {
      const suggestedSuppliers = await suggestSuppliersForOpportunity({
        categories: ["مواد بناء"],
        deliveryAddress: quote.delivery_address,
      }).catch(() => []);
      const agent = runOpportunityAgent({
        project_name: quote.project_name,
        client_name: quote.client_name,
        delivery_address: quote.delivery_address,
        materials: quote.materials,
        suggested_suppliers: suggestedSuppliers,
      });
      return updateERPNextDocument("Opportunity", opportunityName, {
        build_agent_summary: agent.summary,
        build_suggested_suppliers: JSON.stringify(suggestedSuppliers, null, 2),
      }).catch((e: unknown) => console.error("Fallback agent update failed:", e));
    }),
  ]).catch(() => {});

  return NextResponse.json({ ok: true, id: opportunity.name });
}
