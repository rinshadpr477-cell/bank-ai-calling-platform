import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  Users,
  PhoneCall,
  CheckCircle2,
  CalendarCheck,
  Flame,
  ArrowRight,
  BarChart2,
  TrendingUp,
  History,
  Layers,
} from "lucide-react";

export default async function CrmDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch real counts from verified database records
  const [
    totalCustomers,
    totalCalls,
    completedCalls,
    failedCalls,
    pendingFollowUps,
    completedFollowUps,
    urgentFollowUps,
    recentCalls,
    callSummaries,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.call.count(),
    prisma.call.count({ where: { status: "COMPLETED" } }),
    prisma.call.count({ where: { status: { in: ["FAILED", "NO_ANSWER"] } } }),
    prisma.followUpTask.count({ where: { status: "PENDING" } }),
    prisma.followUpTask.count({ where: { status: "COMPLETED" } }),
    prisma.followUpTask.findMany({
      where: { status: "PENDING" },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: {
        customer: { select: { id: true, name: true, phoneNumber: true } },
        call: {
          select: {
            id: true,
            summary: { select: { callOutcome: true, priority: true } },
          },
        },
      },
    }),
    prisma.call.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        customer: { select: { id: true, name: true, phoneNumber: true } },
        campaign: { select: { id: true, name: true } },
        summary: { select: { callOutcome: true, loanAmount: true, sentiment: true } },
      },
    }),
    prisma.callSummary.findMany({
      select: {
        callOutcome: true,
        callbackRequired: true,
        interested: true,
      },
    }),
  ]);

  // Derived real metrics
  const answerRate =
    totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const callbackRequestsCount = callSummaries.filter(
    (s) => s.callbackRequired === true
  ).length;

  // Aggregate real call outcome distribution
  const outcomeCounts: Record<string, number> = {};
  callSummaries.forEach((s) => {
    if (s.callOutcome) {
      outcomeCounts[s.callOutcome] = (outcomeCounts[s.callOutcome] || 0) + 1;
    }
  });

  const outcomeList = Object.entries(outcomeCounts)
    .map(([outcome, count]) => ({
      outcome,
      count,
      label: outcome.replace(/_/g, " "),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <AutoRefresh intervalMs={10000} />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Collections Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor collection activity, customer follow-ups, and AI-assisted calling operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/crm/collections"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#004e9f]/25 hover:bg-[#003d7c] transition-all"
          >
            <Flame className="h-4 w-4" />
            Collection Queue
          </Link>
          <Link
            href="/crm/customers"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Users className="h-4 w-4 text-slate-500" />
            Manage Customers
          </Link>
          <Link
            href="/crm/calls"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <History className="h-4 w-4 text-slate-500" />
            Call History
          </Link>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Managed Accounts"
          value={totalCustomers}
          icon={Users}
          subtext="Total customer records"
          color="blue"
        />
        <MetricCard
          label="Pending Follow-ups"
          value={pendingFollowUps}
          icon={CalendarCheck}
          subtext={`${callbackRequestsCount} automated callbacks flagged`}
          color="amber"
          badge={pendingFollowUps > 0 ? "ACTION NEEDED" : undefined}
        />
        <MetricCard
          label="Calls Attempted"
          value={totalCalls}
          icon={PhoneCall}
          subtext={`${completedCalls} connected successfully`}
          color="indigo"
        />
        <MetricCard
          label="Connection Rate"
          value={`${answerRate}%`}
          icon={TrendingUp}
          subtext={`${failedCalls} unreached / failed`}
          color="emerald"
        />
      </div>

      {/* Middle Grid: Outcomes Distribution & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outcome Breakdown Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#004e9f]" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Call Outcome Distribution
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {callSummaries.length} classified
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Verified call outcomes extracted from AI agent & operator conversations.
            </p>

            {outcomeList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Layers className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                No call outcomes classified yet.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {outcomeList.slice(0, 6).map((item) => {
                  const percent = Math.round(
                    (item.count / (callSummaries.length || 1)) * 100
                  );
                  return (
                    <div key={item.outcome} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-700 mb-1">
                        <span className="capitalize">{item.label}</span>
                        <span className="font-mono text-slate-900">
                          {item.count} ({percent}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#004e9f]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Derived from persisted CallSummary records</span>
            <Link href="/crm/calls" className="font-semibold text-[#004e9f] hover:underline">
              Inspect logs →
            </Link>
          </div>
        </div>

        {/* Urgent Follow-up Queue Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between lg:col-span-2">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Urgent Follow-up Queue
                </h2>
              </div>
              <Link
                href="/crm/follow-ups"
                className="text-xs font-semibold text-[#004e9f] hover:underline flex items-center gap-1"
              >
                View all ({pendingFollowUps})
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Pending collector tasks and customer callbacks ordered by schedule urgency.
            </p>

            {urgentFollowUps.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                No overdue follow-up tasks! All pending items are up to date.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {urgentFollowUps.map((task) => (
                  <div
                    key={task.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <Link
                        href={`/crm/customers/${task.customer.id}`}
                        className="text-xs font-semibold text-slate-900 hover:text-[#004e9f] transition-colors"
                      >
                        {task.customer.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {task.title} ·{" "}
                        <span className="font-mono">{task.customer.phoneNumber}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                        Due: {new Date(task.dueDate).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Link
                        href={`/crm/customers/${task.customer.id}`}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#004e9f] hover:text-white transition-all"
                      >
                        Action
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Completed follow-ups: <strong className="text-slate-900">{completedFollowUps}</strong>
            </span>
            <Link
              href="/crm/collections"
              className="font-semibold text-[#004e9f] hover:underline"
            >
              Open Collection Queue →
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Calls Log Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#004e9f]" />
            <h2 className="text-sm font-semibold text-slate-900">
              Recent Collection Dialing Activity
            </h2>
          </div>
          <Link
            href="/crm/calls"
            className="text-xs font-semibold text-[#004e9f] hover:underline flex items-center gap-1"
          >
            Full Call History
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentCalls.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No calls placed yet. Ingest contacts and trigger a campaign to begin dialing.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Campaign</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3">Outcome</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentCalls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <Link
                        href={`/crm/customers/${call.customer.id}`}
                        className="hover:text-[#004e9f] hover:underline"
                      >
                        {call.customer.name}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {call.customer.phoneNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                      {call.campaign.name}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          call.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : call.status === "FAILED" || call.status === "NO_ANSWER"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {call.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                        {call.source}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {call.summary?.callOutcome ? (
                        <span className="capitalize font-medium text-slate-800">
                          {call.summary.callOutcome.replace(/_/g, " ")}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {call.summary?.loanAmount ?? "—"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/calls/${call.id}`}
                        className="text-xs font-semibold text-[#004e9f] hover:underline"
                      >
                        View Call
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  subtext,
  color,
  badge,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtext: string;
  color: "blue" | "emerald" | "amber" | "indigo";
  badge?: string;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-[#004e9f]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorMap[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {badge && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-pulse">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-400 truncate">{subtext}</p>
    </div>
  );
}
