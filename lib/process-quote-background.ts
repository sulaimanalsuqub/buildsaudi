import {
  attachERPNextFileToDocument,
  updateERPNextDocument,
  type ERPNextMaterialItem,
} from "@/lib/erpnext";
import { runOpportunityAgent, suggestSuppliersForOpportunity } from "@/lib/build-agents";
import { extractMaterialItems } from "@/lib/material-extraction";
import { resolveBoqFileText } from "@/lib/resolve-boq-text";
import { sendNewQuoteNotification, sendQuoteConfirmationToClient } from "@/lib/email";
import { verifyUploadAttachToken } from "@/lib/upload-token";

export type QuoteBackgroundInput = {
  opportunityName: string;
  project_name: string;
  client_name: string;
  phone: string;
  client_email?: string;
  delivery_address: string;
  materials?: string;
  notes?: string;
  boq_file_url?: string | null;
  boq_file_name?: string | null;
  boq_attach_token?: string | null;
  boq_file_text?: string;
};

export async function processQuoteBackground(quote: QuoteBackgroundInput): Promise<void> {
  const tasks: Promise<unknown>[] = [
    sendNewQuoteNotification({
      id: quote.opportunityName,
      project_name: quote.project_name,
      client_name: quote.client_name,
      phone: quote.phone,
      delivery_address: quote.delivery_address,
      materials: quote.materials || quote.boq_file_text || quote.boq_file_url || "ملف كميات مرفق",
    }),
  ];

  if (quote.client_email) {
    tasks.push(
      sendQuoteConfirmationToClient({
        project_name: quote.project_name,
        client_name: quote.client_name,
        client_email: quote.client_email,
      })
    );
  }

  if (
    quote.boq_file_name &&
    quote.boq_attach_token &&
    verifyUploadAttachToken(quote.boq_file_name, quote.boq_attach_token)
  ) {
    tasks.push(attachERPNextFileToDocument(quote.boq_file_name, "Opportunity", quote.opportunityName));
  }

  tasks.push(
    (async () => {
      const boqFileText = await resolveBoqFileText({
        boq_file_text: quote.boq_file_text,
        boq_file_url: quote.boq_file_url,
        boq_file_name: quote.boq_file_name,
      });
      return extractMaterialItems({
        materials: quote.materials,
        notes: quote.notes,
        boq_file_url: quote.boq_file_url,
        boq_file_text: boqFileText,
      });
    })()
      .then(async (items) => {
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
          // لا اعتماد آلي: كل البنود تحتاج تأكيدًا بشريًا قبل RFQ (نسبة الثقة محفوظة في build_confidence)
          // النسخة الآمنة من docs/erpnext-workflow-spec.md#البند-2 — تستخدم قيمة موجودة بدل إدخال Select جديد
          build_review_status: "Needs Review",
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
          materials: quote.materials || quote.boq_file_text,
          extracted_items: mappedItems.map((i) => ({
            item_name: i.build_item_name,
            category: i.build_category,
            confidence: i.build_confidence,
          })),
          suggested_suppliers: suggestedSuppliers,
        });

        await updateERPNextDocument("Opportunity", quote.opportunityName, {
          build_required_materials:
            quote.materials?.trim() ||
            (mappedItems.length
              ? mappedItems.map((i) => `${i.build_item_name} — ${i.build_quantity} ${i.build_uom}`).join("\n")
              : "ملف كميات مرفق — راجع البنود المستخرجة"),
          build_material_extraction_status: mappedItems.length ? "Extracted" : "Needs Review",
          build_material_extraction_summary: mappedItems.length
            ? `استُخرج ${mappedItems.length} بند مادة/كمية. جاهز تلقائياً: ${agent.autoApprovedItems}.`
            : "لم تُستخرج بنود structured — راجع المرفق يدوياً.",
          build_extracted_material_items: mappedItems,
          build_agent_summary: agent.summary,
          build_suggested_suppliers: JSON.stringify(suggestedSuppliers, null, 2),
          build_agent_score: suggestedSuppliers[0]?.score ?? 0,
        });
      })
      .catch(async (error) => {
        console.error("Quote material extraction failed:", error);
        const suggestedSuppliers = await suggestSuppliersForOpportunity({
          categories: ["مواد بناء"],
          deliveryAddress: quote.delivery_address,
        }).catch(() => []);
        const agent = runOpportunityAgent({
          project_name: quote.project_name,
          client_name: quote.client_name,
          delivery_address: quote.delivery_address,
          materials: quote.materials || quote.boq_file_text,
          suggested_suppliers: suggestedSuppliers,
        });
        await updateERPNextDocument("Opportunity", quote.opportunityName, {
          build_agent_summary: agent.summary,
          build_suggested_suppliers: JSON.stringify(suggestedSuppliers, null, 2),
        });
      })
  );

  await Promise.allSettled(tasks);
}