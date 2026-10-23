"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Zap, AlertTriangle, ArrowRight } from "lucide-react";

export function CreditLimitChecker({ exhausted }: { exhausted: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (exhausted && !shown.current) {
      shown.current = true;
      setOpen(true);
    }
  }, [exhausted]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="credit-limit-dialog-title"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 id="credit-limit-dialog-title" className="text-base font-bold text-slate-900">
              Free Voice Credits Depleted
            </h2>
            <p className="text-xs text-slate-500">
              Monthly trial quota limit reached
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
          You have placed all 10 free outbound voice calls allocated to your account. Upgrade to the Standard Plan to continue dialing without queue suspension.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              setOpen(false);
              router.push("/billing");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003d7c] transition-all"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            Upgrade Plan
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}