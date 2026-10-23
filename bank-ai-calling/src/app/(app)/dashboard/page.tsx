import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  PhoneCall,
  Activity,
  CheckCircle2,
  XCircle,
  Megaphone,
  Calendar,
  Zap,
  CreditCard,
  ArrowRight,
  Plus,
  Users,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalCalls,
    activeCalls,
    completedCalls,
    failedCalls,
    activeCampaigns,
    monthlyUsage,
    billingAccount,
    recentCampaigns,
  ] = await Promise.all([
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

  const canCreate = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <AutoRefresh intervalMs={8000} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time telephony performance, active queues, and outreach metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/campaigns"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            All Campaigns
          </Link>
          {canCreate && (
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-[#004e9f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Calls"
          value={totalCalls}
          icon={PhoneCall}
          color="blue"
          sublabel="All-time dial volume"
        />
        <StatCard
          label="Active In Flight"
          value={activeCalls}
          icon={Activity}
          color="amber"
          sublabel="Queued or ringing"
          badge={activeCalls > 0 ? "LIVE" : undefined}
        />
        <StatCard
          label="Completed"
          value={completedCalls}
          icon={CheckCircle2}
          color="emerald"
          sublabel="Successful calls"
        />
        <StatCard
          label="Failed / Unanswered"
          value={failedCalls}
          icon={XCircle}
          color="rose"
          sublabel="No answer or error"
        />
        <StatCard
          label="Active Campaigns"
          value={activeCampaigns}
          icon={Megaphone}
          color="blue"
          sublabel="Running outreach"
        />
        <StatCard
          label="Calls This Month"
          value={monthlyUsage}
          icon={Calendar}
          color="indigo"
          sublabel="Current cycle usage"
        />
        <StatCard
          label="Remaining Credits"
          value={remainingCredits}
          icon={Zap}
          color="purple"
          sublabel={billingAccount?.subscriptionStatus === "FREE" ? "Free tier quota" : "Unlimited plan"}
        />
        <StatCard
          label="Subscription Plan"
          value={billingAccount?.subscriptionStatus ?? "FREE"}
          icon={CreditCard}
          color="slate"
          sublabel={billingAccount?.subscriptionStatus === "ACTIVE" ? "Standard Plan" : "Free Trial Account"}
        />
      </div>

      {/* Recent Campaigns Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Recent Campaigns
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest outreach initiatives and their operational status
            </p>
          </div>
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#004e9f] hover:underline"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Megaphone className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-900">No campaigns launched yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Create your first campaign and upload your customer roster to begin AI outbound calling.
            </p>
            {canCreate && (
              <div className="mt-4">
                <Link
                  href="/campaigns/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003d7c]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Campaign
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {recentCampaigns.map((c) => {
              const statusBadgeClass =
                c.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : c.status === "COMPLETED"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <Link
                  key={c.id}
                  href={`/campaigns/${c.id}`}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-2 rounded-xl transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 pr-4">
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-[#004e9f] transition-colors truncate">
                      {c.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {c._count.customers} contacts
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <PhoneCall className="h-3 w-3" />
                        {c._count.calls} calls placed
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusBadgeClass}`}
                    >
                      {c.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#004e9f] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sublabel,
  badge,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "emerald" | "amber" | "rose" | "indigo" | "purple" | "slate";
  sublabel?: string;
  badge?: string;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-[#004e9f]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="relative rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
        {badge && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
            {badge}
          </span>
        )}
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-slate-400 truncate">
          {sublabel}
        </p>
      )}
    </div>
  );
}