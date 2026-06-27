import { downloadERPNextFile } from "@/lib/erpnext";
import { extractTextFromBuffer } from "@/lib/file-text";

export async function resolveBoqFileText(params: {
  boq_file_text?: string;
  boq_file_url?: string | null;
  boq_file_name?: string | null;
}): Promise<string> {
  const inline = (params.boq_file_text || "").trim();
  if (inline.length >= 20) return inline;

  const fileUrl = (params.boq_file_url || "").trim();
  if (!fileUrl) return inline;

  try {
    const downloaded = await downloadERPNextFile(fileUrl);
    const fileName = params.boq_file_name || downloaded.fileName;
    const extracted = await extractTextFromBuffer(fileName, downloaded.mimeType, downloaded.buffer);
    return extracted.trim() || inline;
  } catch (error) {
    console.error("BOQ file text resolution failed:", error);
    return inline;
  }
}