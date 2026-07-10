"use client";

import { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/billing/create-subscription", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error ?? "Failed to start upgrade"}`);
        setLoading(false);
        return;
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "Bank AI Calling Platform",
        description: "Standard Plan — ₹500/month",
        theme: { color: "#132B23" },
        handler: function () {
          setMessage("Payment submitted — your plan will update within a few seconds. Refresh if it doesn't update automatically.");
          setLoading(false);
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function () {
        setMessage("Payment failed. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch {
      setMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button onClick={handleUpgrade} disabled={loading} className="rounded-md bg-[#132B23] px-5 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
        {loading ? "Opening checkout..." : "Upgrade — ₹500/month"}
      </button>
      {message && <p className="mt-3 text-sm text-[#132B23]">{message}</p>}
    </>
  );
}