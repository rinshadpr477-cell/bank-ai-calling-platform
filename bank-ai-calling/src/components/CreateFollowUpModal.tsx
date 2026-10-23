"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarCheck, X, Loader2, Plus } from "lucide-react";

interface CreateFollowUpModalProps {
  customerId: string;
  customerName: string;
  callId?: string | null;
  buttonLabel?: string;
  buttonClass?: string;
}

export function CreateFollowUpModal({
  customerId,
  customerName,
  callId,
  buttonLabel = "Add Follow-up",
  buttonClass,
}: CreateFollowUpModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW" | "NONE">("MEDIUM");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Default due date to tomorrow 10:00 AM
  useEffect(() => {
    if (open && !dueDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const iso = tomorrow.toISOString().slice(0, 16);
      setDueDate(iso);
    }
  }, [open, dueDate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toast.error("Please enter a task title and scheduled due date.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/crm/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          callId: callId || undefined,
          title,
          dueDate: new Date(dueDate).toISOString(),
          priority,
          notes: notes.trim() || undefined,
        }),
      });

      setLoading(false);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to create follow-up task.");
        return;
      }

      toast.success("Follow-up task scheduled successfully.");
      setTitle("");
      setNotes("");
      setOpen(false);
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Network error while creating follow-up task.");
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          buttonClass ??
          "inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#004e9f] hover:text-[#004e9f] transition-all"
        }
      >
        <CalendarCheck className="h-3.5 w-3.5 text-amber-600" />
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => !loading && setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="followup-dialog-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <CalendarCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 id="followup-dialog-title" className="text-sm font-bold text-slate-900">
                    Schedule Follow-up Task
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    For {customerName}
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

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Call back regarding EMI repayment promise"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Scheduled Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as never)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                  >
                    <option value="HIGH">High (Urgent)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Task Notes & Collector Instructions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Customer promised to transfer ₹15,000 on Friday afternoon. Verify settlement receipt."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003d7c] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving Task...
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Save Follow-up
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
