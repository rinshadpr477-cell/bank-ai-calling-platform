"use client";

import { toast } from "sonner";

export function showCreditLimitToast() {
    toast.custom((t) => (
        <div className="w-full max-w-sm rounded-xl border border-[#BA9B5F]/40 bg-[#F5F0E6] p-5 shadow-xl">
            <p className="text-base font-semibold text-[#132B23]">
                Your credits are over
            </p>
            <p className="mt-1 text-sm text-[#5E775E]">
                You&apos;ve used all your free calls this month. Upgrade to keep making calls.
            </p>
            <div className="mt-4 flex gap-2">
                <button onClick={() => { window.location.href = "/billing"; toast.dismiss(t); }} className="flex-1 rounded-md bg-[#132B23] px-3 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E]">
                    Upgrade now
                </button>
                <button onClick={() => toast.dismiss(t)} className="rounded-md border border-[#BA9B5F]/40 px-3 py-2 text-sm font-medium text-[#132B23] transition-colors hover:bg-[#BA9B5F]/10">
                    Dismiss
                </button>
            </div>
        </div>
    ), { duration: 10000 });
}