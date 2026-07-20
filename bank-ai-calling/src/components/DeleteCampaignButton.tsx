"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function DeleteCampaignButton({ campaignId, campaignName }: { campaignId: string; campaignName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/campaigns/${campaignId}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Failed to delete campaign.");
      return;
    }
    toast.success("Campaign deleted.");
    router.push("/campaigns");
  }

  if (confirming) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 p-3">
        <p className="text-sm text-red-800">
          Delete <strong>{campaignName}</strong>? This permanently removes all its customers and call history.
        </p>
        <div className="mt-2 flex gap-2">
          <button onClick={handleDelete} disabled={deleting} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50">
            {deleting ? "Deleting..." : "Yes, delete permanently"}
          </button>
          <button onClick={() => setConfirming(false)} className="rounded-md border border-[#BA9B5F]/40 px-3 py-1.5 text-sm font-medium text-[#132B23] transition-colors hover:bg-[#BA9B5F]/10">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50">
      Delete Campaign
    </button>
  );
}