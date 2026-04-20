"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddBrandForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "حدث خطأ، حاول مجدداً");
    } else {
      setName("");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); setError(""); }}
        placeholder="مثال: Hilti, Bosch, 3M"
        className="w-full rounded-lg border border-[#1D3F1F]/15 bg-[#F4F3EB]/60 px-3 py-2 text-sm text-[#1D3F1F] placeholder:text-[#1D3F1F]/30 focus:border-[#09B14B] focus:outline-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-lg bg-[#1D3F1F] py-2 text-sm font-semibold text-white hover:bg-[#09B14B] disabled:opacity-40 transition-colors"
      >
        {loading ? "جارٍ الإضافة..." : "+ إضافة"}
      </button>
    </form>
  );
}