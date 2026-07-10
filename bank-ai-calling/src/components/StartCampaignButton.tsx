"use client";

import { useState } from "react";
import { toast } from "sonner";
import { showCreditLimitToast } from "@/lib/creditLimitToast";

export function StartCampaignButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns/trigger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId }) });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "CREDIT_LIMIT_REACHED") {
          showCreditLimitToast();
        } else {
          toast.error(data.error ?? "Failed to start campaign");
        }
      } else {
        toast.success("Call triggered — check the customer list for status updates.");
      }
    } catch {
      toast.error("Network error — is the bridge server running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="rounded-md bg-[#5E775E] px-4 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#132B23] active:bg-[#0d1f18] disabled:opacity-50">
      {loading ? "Starting..." : "▶ Start Next Call"}
    </button>
  );
}