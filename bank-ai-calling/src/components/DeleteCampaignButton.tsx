"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteCampaignButton({ campaignId, campaignName }: { campaignId: string; campaignName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);


  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to delete campaign.");
      setOpen(false);
      return;
    }
    toast.success("Campaign deleted.");
    router.push("/campaigns");
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50">
        Delete Campaign
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setOpen(false)} role="presentation">
          <div className="w-full max-w-sm rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-6 shadow-xl"onClick={(e) => e.stopPropagation()} role="alertdialog"aria-modal="true"aria-labelledby="delete-dialog-title">
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-[#132B23]">
              Delete campaign?
            </h2>
            <p className="mt-2 text-sm text-[#5E775E]">
              This permanently removes <strong className="text-[#132B23]">{campaignName}</strong>, along with all its customers and call history. This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} disabled={deleting} className="rounded-md border border-[#BA9B5F]/40 px-4 py-2 text-sm font-medium text-[#132B23] transition-colors hover:bg-[#BA9B5F]/10 disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}