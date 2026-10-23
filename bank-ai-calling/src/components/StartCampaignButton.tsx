"use client";

import { useState } from "react";
import { toast } from "sonner";
import { showCreditLimitToast } from "@/lib/creditLimitToast";
import { Play, Loader2 } from "lucide-react";

export function StartCampaignButton({ campaignId }: { campaignId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
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
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/25 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Dialing Next...
        </>
      ) : (
        <>
          <Play className="h-3.5 w-3.5 fill-current" />
          Start Next Call
        </>
      )}
    </button>
  );
}