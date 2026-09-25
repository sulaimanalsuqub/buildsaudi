export const MAX_VENDOR_FILES = 5;
// Each multipart request stays below the hosting platform's 4.5 MB request limit.
export const MAX_VENDOR_FILE_BYTES = 3 * 1024 * 1024;
export const VENDOR_FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
export const VENDOR_FILE_ACCEPT = Object.keys(VENDOR_FILE_TYPES).map(ext => `.${ext}`).join(",");
export function validateVendorFileMetadata(file: { name: string; size: number; type: string }): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!file.name || file.name.length > 180 || /[\\/\x00-\x1f\x7f<>:\u202a-\u202e\u2066-\u2069]/u.test(file.name) || file.name.startsWith(".") || /\.(exe|com|bat|cmd|ps1|js|vbs|sh|html|svg|scr|msi)(\.|$)/i.test(file.name)) return "name";
  if (!VENDOR_FILE_TYPES[ext] || file.type !== VENDOR_FILE_TYPES[ext]) return "type";
  if (file.size < 1 || file.size > MAX_VENDOR_FILE_BYTES) return "size";
  return null;
}
