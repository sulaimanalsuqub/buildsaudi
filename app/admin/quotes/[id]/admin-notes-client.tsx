"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AdminNotesClient({ id, currentNotes }: { id: string; currentNotes: string }) {
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.from("quotes").update({ admin_notes: notes }).eq("id", id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-2">
      <textarea
        value={notes}
        onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
        rows={3}
        placeholder="أضف ملاحظات داخلية عن هذا الطلب..."
        className="w-full resize-none rounded-xl border border-[#1D3F1F]/15 bg-[#F4F3EB]/60 px-4 py-3 text-sm text-[#1D3F1F] outline-none placeholder:text-[#1D3F1F]/30 focus:border-[#09B14B]/50 focus:ring-2 focus:ring-[#09B14B]/15"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-[#1D3F1F] px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-[#09B14B] disabled:opacity-60"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ"}
        </button>
        {saved && <span className="text-xs text-[#09B14B]">تم الحفظ ✓</span>}
      </div>
    </div>
  );
}
