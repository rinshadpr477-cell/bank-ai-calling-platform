"use client";

import { toast } from "sonner";
import { Zap } from "lucide-react";

export function showCreditLimitToast() {
  toast.custom(
    (t) => (
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl animate-fade-in font-sans">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <p className="text-sm font-bold text-slate-900">
            Voice Call Quota Exhausted
          </p>
        </div>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          You have utilized all your complimentary free calls. Upgrade your plan to resume immediate outbound dialing.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              window.location.href = "/billing";
              toast.dismiss(t);
            }}
            className="flex-1 rounded-xl bg-[#004e9f] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003d7c] transition-colors"
          >
            Upgrade Plan
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    ),
    { duration: 10000 }
  );
}