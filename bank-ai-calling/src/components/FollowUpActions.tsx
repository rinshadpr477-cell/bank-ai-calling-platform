"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, RotateCcw, Loader2, Calendar } from "lucide-react";

interface FollowUpActionsProps {
  taskId: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  dueDate: string;
}

export function FollowUpActions({ taskId, status, dueDate }: FollowUpActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDueDate, setNewDueDate] = useState(dueDate.slice(0, 16));

  async function updateStatus(newStatus: "PENDING" | "COMPLETED" | "CANCELLED") {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/follow-ups/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setLoading(false);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to update task.");
        return;
      }

      toast.success(
        newStatus === "COMPLETED"
          ? "Follow-up marked as completed."
          : newStatus === "CANCELLED"
          ? "Follow-up task cancelled."
          : "Follow-up marked as pending."
      );
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Network error while updating task.");
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/follow-ups/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: new Date(newDueDate).toISOString() }),
      });
      setLoading(false);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to reschedule task.");
        return;
      }

      toast.success("Task rescheduled successfully.");
      setRescheduleOpen(false);
      router.refresh();
    } catch {
      setLoading(false);
      toast.error("Network error while rescheduling task.");
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {status === "PENDING" ? (
        <>
          <button
            onClick={() => updateStatus("COMPLETED")}
            disabled={loading}
            title="Mark as completed"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            )}
            Complete
          </button>

          <button
            onClick={() => setRescheduleOpen(true)}
            disabled={loading}
            title="Reschedule task"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Calendar className="h-3 w-3 text-slate-500" />
            Reschedule
          </button>
        </>
      ) : (
        <button
          onClick={() => updateStatus("PENDING")}
          disabled={loading}
          title="Re-open task"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3 text-slate-400" />
          )}
          Reopen
        </button>
      )}

      {rescheduleOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setRescheduleOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <h3 className="text-sm font-bold text-slate-900">Reschedule Follow-up</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select a new target date and time for collector outreach.
            </p>

            <form onSubmit={handleReschedule} className="mt-4 space-y-4">
              <input
                type="datetime-local"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-[#004e9f] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#003d7c]"
                >
                  {loading ? "Updating..." : "Save Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
