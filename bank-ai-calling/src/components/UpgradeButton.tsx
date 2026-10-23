"use client";

import { useState } from "react";
import Script from "next/script";
import { Zap, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleUpgrade() {
    setLoading(true);
    setMessage(null);
    setIsSuccess(false);

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
        theme: { color: "#004e9f" },
        handler: function () {
          setMessage("Payment authorization confirmed. Your plan is activating in the background.");
          setIsSuccess(true);
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
        setMessage("Payment failed or was cancelled. Please try again.");
        setLoading(false);
      });
      rzp.open();
    } catch {
      setMessage("Connection error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Initializing Razorpay Checkout...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 fill-current" />
            Upgrade to Standard — ₹500/month
          </>
        )}
      </button>

      {message && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium border ${
            isSuccess
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{message}</span>
        </div>
      )}
    </>
  );
}