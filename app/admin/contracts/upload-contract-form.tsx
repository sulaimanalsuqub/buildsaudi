"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function UploadContractForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("يرجى إدخال العنوان واختيار الملف");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Upload PDF to Supabase Storage
      const fileName = `contracts/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(fileName);

      // Deactivate old contracts
      await supabase
        .from("contracts")
        .update({ is_active: false })
        .eq("is_active", true);

      // Insert new contract
      const { error: insertError } = await supabase
        .from("contracts")
        .insert({ title: title.trim(), file_url: urlData.publicUrl, is_active: true });

      if (insertError) throw insertError;

      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs text-[#1D3F1F]/50">عنوان العقد</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: اتفاقية الموردين 2025"
          className="w-full rounded-lg border border-[#1D3F1F]/15 bg-[#F4F3EB]/60 px-3 py-2 text-sm text-[#1D3F1F] placeholder:text-[#1D3F1F]/30 focus:border-[#09B14B] focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-[#1D3F1F]/50">ملف العقد (PDF)</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-lg border border-dashed border-[#1D3F1F]/20 bg-[#F4F3EB]/40 px-3 py-4 text-center hover:bg-[#F4F3EB]"
        >
          {file ? (
            <p className="text-xs font-medium text-[#1D3F1F]">📄 {file.name}</p>
          ) : (
            <p className="text-xs text-[#1D3F1F]/40">اضغط لاختيار ملف PDF</p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#1D3F1F] py-2 text-sm font-semibold text-white hover:bg-[#09B14B] disabled:opacity-50 transition-colors"
      >
        {loading ? "جارٍ الرفع..." : "رفع العقد"}
      </button>
    </form>
  );
}
