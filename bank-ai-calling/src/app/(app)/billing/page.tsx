import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UpgradeButton } from "@/components/UpgradeButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  CheckCircle2,
  Zap,
  Calendar,
  Layers,
} from "lucide-react";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let billingAccount = await prisma.billingAccount.findFirst();
  if (!billingAccount) {
    billingAccount = await prisma.billingAccount.create({ data: {} });
  }

  const isFree = billingAccount.subscriptionStatus === "FREE";
  const remaining = Math.max(billingAccount.freeCallsLimit - billingAccount.freeCallsUsed, 0);
  const usedPercent = Math.min(
    Math.round((billingAccount.freeCallsUsed / billingAccount.freeCallsLimit) * 100),
    100
  );

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <AutoRefresh intervalMs={20000} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organization plan, dialer credits, and recurring payment methods.
        </p>
      </div>

      {/* Active Subscription Overview Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Tier
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              {billingAccount.subscriptionStatus === "ACTIVE"
                ? "Standard Plan — ₹500/month"
                : billingAccount.subscriptionStatus === "PAST_DUE"
                ? "Payment Overdue"
                : billingAccount.subscriptionStatus === "CANCELED"
                ? "Cancelled Plan"
                : "Free Trial Account"}
            </h2>
          </div>

          <span
            className={`self-start sm:self-auto rounded-full px-3 py-1 text-xs font-semibold border ${
              billingAccount.subscriptionStatus === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : billingAccount.subscriptionStatus === "PAST_DUE"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-blue-50 text-[#004e9f] border-blue-200"
            }`}
          >
            {billingAccount.subscriptionStatus}
          </span>
        </div>

        {/* Quota Progress for Free Tier */}
        {isFree && (
          <div className="mt-6 rounded-xl bg-slate-50 p-5 border border-slate-100">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span>Free Quota Allocation</span>
              <span>
                <strong className="text-slate-900">{billingAccount.freeCallsUsed}</strong> of{" "}
                {billingAccount.freeCallsLimit} calls placed ({remaining} remaining)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  remaining === 0 ? "bg-rose-500" : "bg-[#004e9f]"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Next billing date for active paid tier */}
        {billingAccount.currentPeriodEnd && billingAccount.subscriptionStatus === "ACTIVE" && (
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Next automated billing renewal date:{" "}
              <strong className="text-slate-900">
                {new Date(billingAccount.currentPeriodEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
            </span>
          </div>
        )}

        {/* Upgrade Call-to-action */}
        {(isFree || billingAccount.subscriptionStatus === "CANCELED") && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Unlock Unlimited Outbound Voice Calls
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upgrade instantly to the Standard Plan at ₹500/month. No call caps, priority queue processing, and full analytics.
            </p>
            <UpgradeButton />
          </div>
        )}
      </div>

      {/* Feature Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-slate-500" />
            <h3 className="font-semibold text-sm text-slate-900">Free Tier</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Ideal for initial pilot evaluation</p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              10 complimentary live voice calls
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              Full Gemini Live bilingual agent integration
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              CSV contact list ingestion
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border-2 border-[#004e9f]/30 bg-blue-50/20 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#004e9f]" />
              <h3 className="font-semibold text-sm text-slate-900">Standard Enterprise</h3>
            </div>
            <span className="rounded-full bg-[#004e9f] px-2 py-0.5 text-[10px] font-bold text-white">
              POPULAR
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">₹500 / month, cancel anytime</p>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#004e9f] shrink-0" />
              <strong>Unlimited outbound calling</strong>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#004e9f] shrink-0" />
              Live conversation monitor & supervisor stream
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#004e9f] shrink-0" />
              Automated structured AI verdicts & Excel export
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#004e9f] shrink-0" />
              Priority Twilio Media Stream channels
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}