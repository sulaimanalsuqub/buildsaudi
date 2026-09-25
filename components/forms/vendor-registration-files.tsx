"use client";
import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2, CheckCircle2 } from "lucide-react";
import { MAX_VENDOR_FILES, VENDOR_FILE_ACCEPT, validateVendorFileMetadata } from "@/lib/vendor-file-policy";
export type SelectedVendorFile = { id: string; file: File; status: "ready" | "uploading" | "uploaded" | "error"; error?: string };
export function VendorRegistrationFiles({ files, onChange, isRtl, busy, locked }: {
  files: SelectedVendorFile[]; onChange: (files: SelectedVendorFile[]) => void; isRtl: boolean; busy: boolean; locked: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  function add(incoming: File[]) {
    if (busy || locked) return;
    setError("");
    if (files.length + incoming.length > MAX_VENDOR_FILES) { setError(isRtl ? "يمكنك إرفاق خمسة ملفات كحد أقصى." : "You can attach up to five files."); return; }
    const valid: SelectedVendorFile[] = [];
    for (const file of incoming) {
      if (validateVendorFileMetadata(file)) { setError(isRtl ? `تعذر اختيار ${file.name}. تحقق من النوع والاسم والحجم (3MB كحد أقصى).` : `Cannot select ${file.name}. Check its type, name and size (3MB maximum).`); continue; }
      if (!files.some(f => f.file.name === file.name && f.file.size === file.size) && !valid.some(f => f.file.name === file.name && f.file.size === file.size)) valid.push({ id: crypto.randomUUID(), file, status: "ready" });
    }
    onChange([...files, ...valid]);
  }
  return <section className="space-y-3" aria-labelledby="vendor-files-title">
    <h3 id="vendor-files-title" className="text-sm font-semibold text-brand-dark">{isRtl ? "ملفات تعرفنا عليكم أكثر" : "Files that help us get to know you"}</h3>
    <p id="vendor-files-help" className="text-sm leading-6 text-brand-dark/60">{isRtl ? "أرفق أي ملفات تساعدنا على التعرف على منشأتكم ومنتجاتكم بشكل أفضل، مثل الكتالوج، نبذة الشركة، السجل التجاري، قائمة المنتجات أو أي مستندات أخرى." : "Attach any files that help us learn more about your company and products, such as a catalogue, company profile, commercial registration, product list or other documents."}</p>
    {!locked && <div onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); add(Array.from(e.dataTransfer.files)); }} className={`rounded-2xl border-2 border-dashed p-6 text-center transition ${dragging ? "border-brand-primary bg-brand-primary/10" : "border-brand-dark/15 bg-brand-light/20"}`}>
      <Upload className="mx-auto mb-3 h-6 w-6 text-brand-primary" aria-hidden="true" />
      <p className="mb-3 text-sm text-brand-dark/70">{isRtl ? "اسحب الملفات وأفلتها هنا، أو" : "Drag and drop files here, or"}</p>
      <button type="button" disabled={busy} onClick={() => input.current?.click()} className="rounded-xl border border-brand-primary/30 bg-white px-5 py-2.5 text-sm font-semibold text-brand-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary disabled:opacity-50">{isRtl ? "اختر الملفات من جهازك" : "Choose files"}</button>
      <input ref={input} type="file" multiple accept={VENDOR_FILE_ACCEPT} className="hidden" aria-describedby="vendor-files-help" onChange={e => { add(Array.from(e.target.files || [])); e.target.value = ""; }} />
      <p className="mt-3 text-xs leading-5 text-brand-dark/50">PDF, JPG, PNG, WEBP, DOC, DOCX, XLS, XLSX<br />{isRtl ? "حتى 5 ملفات · 3MB لكل ملف · يبدأ الرفع عند إرسال الطلب" : "Up to 5 files · 3MB each · Uploaded when you submit"}</p>
    </div>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    <ul className="space-y-2" aria-live="polite">{files.map(item => <li key={item.id} className="flex items-center gap-3 rounded-2xl border border-brand-dark/10 bg-white p-3">
      {item.status === "uploading" ? <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-primary" /> : item.status === "uploaded" ? <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-primary" /> : <FileText className="h-5 w-5 shrink-0 text-brand-dark/50" />}
      <div className="min-w-0 flex-1"><p dir="auto" className="break-all text-sm font-medium text-brand-dark">{item.file.name}</p><p className={`mt-1 text-xs ${item.status === "error" ? "text-red-600" : "text-brand-dark/55"}`}>{(item.file.size / 1024 / 1024).toFixed(2)} MB · {item.status === "uploading" ? (isRtl ? "جاري الرفع…" : "Uploading…") : item.status === "uploaded" ? (isRtl ? "تم الرفع بنجاح" : "Uploaded") : item.status === "error" ? item.error : (isRtl ? "جاهز للرفع" : "Ready to upload")}</p></div>
      {!busy && item.status !== "uploaded" && <button type="button" aria-label={isRtl ? `حذف ${item.file.name}` : `Remove ${item.file.name}`} onClick={() => onChange(files.filter(f => f.id !== item.id))} className="rounded-lg p-2 text-brand-dark/50 hover:bg-red-50 hover:text-red-600"><X className="h-4 w-4" /></button>}
    </li>)}</ul>
  </section>;
}
