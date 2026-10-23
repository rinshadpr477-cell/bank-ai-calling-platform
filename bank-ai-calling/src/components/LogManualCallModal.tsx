"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, FileText, Loader2, Sparkles, X } from "lucide-react";

export function LogManualCallModal({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleSave() {
    if (!notes.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/customers/${customerId}/manual-call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to save call log.");
      return;
    }

    toast.success("Manual call logged and structured verdict extracted.");
    setNotes("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:border-[#004e9f] hover:text-[#004e9f] transition-all"
      >
        <Phone className="h-3 w-3" />
        Log Call
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => !saving && setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-call-dialog-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#004e9f]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2
                    id="manual-call-dialog-title"
                    className="text-sm font-bold text-slate-900"
                  >
                    Log Manual Call — {customerName}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Natural language notes are processed to extract interest and action items.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Conversation Notes & Summary
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="e.g. Spoke with Rahul regarding the loan rate. He asked for an EMI chart and requested a follow-up call on Monday morning."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
              />
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400">
                <Sparkles className="h-3 w-3 text-[#004e9f]" />
                System automatically categorizes sentiment, outcome, and follow-up dates.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !notes.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003d7c] transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Save & Extract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}