import * as XLSX from "xlsx";
import { PDFParse } from "pdf-parse";

const MAX_EXTRACTED_TEXT = 80_000;

function truncate(text: string) {
  return text.replace(/\u0000/g, "").trim().slice(0, MAX_EXTRACTED_TEXT);
}

function worksheetToText(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    return `Sheet: ${sheetName}\n${rows}`;
  }).join("\n\n");
}

export async function extractTextFromBuffer(fileName: string, mimeType: string, buffer: Buffer) {
  if (mimeType === "text/csv" || fileName.toLowerCase().endsWith(".csv")) {
    return truncate(buffer.toString("utf8"));
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    /\.(xlsx|xls)$/i.test(fileName)
  ) {
    return truncate(worksheetToText(buffer));
  }

  if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return truncate(parsed.text || "");
    } finally {
      await parser.destroy();
    }
  }

  return "";
}

export async function extractTextFromProcurementFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return extractTextFromBuffer(file.name, file.type, buffer);
}
