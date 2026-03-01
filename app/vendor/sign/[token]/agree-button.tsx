"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function AgreeButton({ token }: { token: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAgree = async () => {
    if (!checked) {
      setError("يرجى تأكيد قراءة العقد أولاً");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("vendor_contract_signatures")
        .update({ signed_at: new Date().toISOString() })
        .eq("token", token);

      if (updateError) throw updateError;

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مجدداً");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => {
            setChecked(e.target.checked);
            setError("");
          }}
          className="mt-0.5 h-4 w-4 rounded border-[#1D3F1F]/30 accent-[#09B14B]"
        />
        <span className="text-sm text-[#1D3F1F]/70">
          لقد قرأت جميع بنود العقد وأفهمها وأوافق عليها
        </span>
      </label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        onClick={handleAgree}
        disabled={loading}
        className="w-full rounded-xl bg-[#09B14B] py-3 text-sm font-bold text-white hover:bg-[#09B14B]/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "جارٍ التسجيل..." : "✓ أوافق على العقد"}
      </button>
    </div>
  );
}
