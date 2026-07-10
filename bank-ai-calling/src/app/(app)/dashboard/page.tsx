import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [ totalCalls, activeCalls,completedCalls,failedCalls,activeCampaigns,monthlyUsage,billingAccount,recentCampaigns,] = await Promise.all([
    prisma.call.count(),
    prisma.call.count({ where: { status: { in: ["RINGING", "IN_PROGRESS", "QUEUED"] } } }),
    prisma.call.count({ where: { status: "COMPLETED" } }),
    prisma.call.count({ where: { status: { in: ["FAILED", "NO_ANSWER"] } } }),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.call.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.billingAccount.findFirst(),
    prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { customers: true, calls: true } } },
    }),
  ]);

  const remainingCredits = billingAccount
    ? billingAccount.subscriptionStatus === "FREE"
      ? Math.max(billingAccount.freeCallsLimit - billingAccount.freeCallsUsed, 0)
      : "Unlimited"
    : 10;

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
     <AutoRefresh intervalMs={8000} />
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#132B23]">Dashboard</h1>
            <p className="mt-1 text-sm text-[#5E775E]">
              {session.user.email} · {session.user.role}
            </p>
          </div>
          <Link href="/campaigns"className="rounded-md bg-[#132B23] px-4 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18]">
            View Campaigns
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total Calls" value={totalCalls} />
          <StatCard label="Active Calls" value={activeCalls} />
          <StatCard label="Completed" value={completedCalls} />
          <StatCard label="Failed" value={failedCalls} />
          <StatCard label="Active Campaigns" value={activeCampaigns} />
          <StatCard label="Calls This Month" value={monthlyUsage} />
          <StatCard label="Remaining Credits" value={remainingCredits} />
          <StatCard label="Plan" value={billingAccount?.subscriptionStatus ?? "FREE"} />
        </div>

        <div className="mt-8 w-full">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-[#132B23]">Recent Campaigns</h2>
            <Link href="/campaigns" className="text-sm text-[#5E775E] hover:underline">
              View all →
            </Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4 text-sm text-[#5E775E]">
              No campaigns yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentCampaigns.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.id}`}className="flex items-center justify-between rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-3 text-sm transition-colors hover:bg-[#BA9B5F]/10 active:bg-[#BA9B5F]/20">
                  <span className="text-[#132B23]">{c.name}</span>
                  <div className="flex items-center gap-3 text-[#5E775E]">
                    <span>{c._count.customers} customers</span>
                    <span>{c._count.calls} calls</span>
                    <span className="rounded-full bg-[#BA9B5F]/20 px-2 py-0.5 text-xs font-medium text-[#132B23]">
                      {c.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <button type="button" className="w-full rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4 text-left transition-colors hover:bg-[#BA9B5F]/15 active:bg-[#BA9B5F]/35">
      <p className="text-xs text-[#5E775E]">{label}</p>
      <p className="mt-1 text-2xl text-[#132B23]">{value}</p>
    </button>
  );
}