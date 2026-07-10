import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UpgradeButton } from "@/components/UpgradeButton";
import { AutoRefresh } from "@/components/AutoRefresh";

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

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <AutoRefresh intervalMs={20000} />
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-[#132B23]">Billing</h1>

        <div className="mt-6 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#5E775E]">Current Plan</p>
              <p className="mt-1 text-2xl text-[#132B23]">
                {billingAccount.subscriptionStatus === "ACTIVE"
                  ? "Standard — ₹500/month"
                  : billingAccount.subscriptionStatus === "PAST_DUE"
                    ? "Payment overdue"
                    : billingAccount.subscriptionStatus === "CANCELED"
                      ? "Cancelled"
                      : "Free tier"}
              </p>
            </div>
            <span className="rounded-full bg-[#BA9B5F]/20 px-3 py-1 text-xs font-medium text-[#132B23]">
              {billingAccount.subscriptionStatus}
            </span>
          </div>

          {isFree && (
            <p className="mt-4 text-sm text-[#5E775E]">
              {remaining} of {billingAccount.freeCallsLimit} free calls remaining this account.
            </p>
          )}

          {billingAccount.currentPeriodEnd && billingAccount.subscriptionStatus === "ACTIVE" && (
            <p className="mt-4 text-sm text-[#5E775E]">
              Next billing date:{" "}
              {new Date(billingAccount.currentPeriodEnd).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}

          {(isFree || billingAccount.subscriptionStatus === "CANCELED") && (
            <div className="mt-6">
              <UpgradeButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}