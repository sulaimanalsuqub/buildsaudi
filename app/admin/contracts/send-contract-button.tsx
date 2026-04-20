"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Vendor {
  id: string;
  establishment_name: string;
  email: string;
}

interface Props {
  contractId: string;
  vendors: Vendor[];
  label: string;
  small?: boolean;
}

export function SendContractButton({ contractId, vendors, label, small }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    if (!vendors.length) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/contracts/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId, vendors }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "حدث خطأ");
      setDone(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  };

  if (small) {
    return (
      <div>
        <button
          onClick={handleSend}
          disabled={loading || done}
          className="rounded-lg border border-[#1D3F1F]/15 px-2.5 py-1 text-xs font-medium text-[#1D3F1F]/70 hover:bg-[#1D3F1F]/5 disabled:opacity-40 transition-colors"
        >
          {loading ? "..." : done ? "✓" : label}
        </button>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={loading || done}
        className="w-full rounded-lg bg-[#09B14B] py-2 text-sm font-semibold text-white hover:bg-[#09B14B]/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "جارٍ الإرسال..." : done ? "✓ تم الإرسال" : label}
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}