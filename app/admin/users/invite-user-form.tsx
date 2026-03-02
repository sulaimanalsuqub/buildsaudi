"use client";

import { useState } from "react";

export function InviteUserForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setMsg({ type: "success", text: "تم إرسال دعوة التسجيل إلى " + email });
      setEmail("");
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "حدث خطأ" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-[#1D3F1F]/50">إضافة مستخدم جديد</h2>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-semibold text-[#1D3F1F]">
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            dir="ltr"
            className="w-full rounded-xl border border-[#1D3F1F]/15 bg-white px-4 py-2.5 text-sm text-[#1D3F1F] placeholder:text-[#1D3F1F]/30 focus:border-[#09B14B] focus:outline-none focus:ring-2 focus:ring-[#09B14B]/10"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="rounded-full bg-[#09B14B] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1D3F1F] disabled:opacity-60"
        >
          {loading ? "جارٍ الإرسال..." : "إرسال دعوة"}
        </button>
      </form>
      {msg && (
        <p className={`mt-3 text-sm ${msg.type === "success" ? "text-[#09B14B]" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
