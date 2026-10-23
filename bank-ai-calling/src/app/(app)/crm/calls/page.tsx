import Link from "next/link";
import { prisma, Prisma, CallStatus, CallSource } from "@/lib/prisma";
import { ExportCallsButton } from "@/components/ExportCallsButton";
import {
  PhoneCall,
  Search,
  Clock,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface CallsPageProps {
  searchParams: Promise<{
    status?: string;
    source?: string;
    q?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CrmCallsPage({ searchParams }: CallsPageProps) {
  const params = await searchParams;
  const currentStatus = params.status || "ALL";
  const currentSource = params.source || "ALL";
  const searchQuery = params.q?.trim() || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 15;

  // 1. Metrics calculations
  const [
    totalCalls,
    completedCalls,
    aiCalls,
    manualCalls,
    durationAgg,
  ] = await Promise.all([
    prisma.call.count(),
    prisma.call.count({ where: { status: "COMPLETED" } }),
    prisma.call.count({ where: { source: "AI" } }),
    prisma.call.count({ where: { source: "MANUAL" } }),
    prisma.call.aggregate({
      _sum: { durationSeconds: true },
    }),
  ]);

  const totalDurationMin = Math.round((durationAgg._sum.durationSeconds || 0) / 60);

  // 2. Query filter
  const where: Prisma.CallWhereInput = {};

  if (currentStatus !== "ALL") {
    where.status = currentStatus as CallStatus;
  }

  if (currentSource !== "ALL") {
    where.source = currentSource as CallSource;
  }

  if (searchQuery) {
    where.OR = [
      { customer: { name: { contains: searchQuery, mode: "insensitive" } } },
      { customer: { phoneNumber: { contains: searchQuery } } },
      { twilioCallSid: { contains: searchQuery } },
      { summary: { summaryText: { contains: searchQuery, mode: "insensitive" } } },
      { summary: { nextAction: { contains: searchQuery, mode: "insensitive" } } },
    ];
  }

  const totalItems = await prisma.call.count({ where });
  const calls = await prisma.call.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      campaign: {
        select: {
          id: true,
          name: true,
        },
      },
      summary: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Format data for CSV Export
  const exportData = calls.map((c) => ({
    id: c.id,
    createdAt: c.createdAt.toISOString(),
    customerName: c.customer.name,
    customerPhone: c.customer.phoneNumber,
    campaignName: c.campaign.name,
    source: c.source,
    status: c.status,
    durationSeconds: c.durationSeconds || 0,
    callOutcome: c.summary?.callOutcome,
    sentiment: c.summary?.sentiment,
    callbackRequired: c.summary?.callbackRequired,
  }));

  const statusBadges: Record<string, { bg: string; text: string }> = {
    COMPLETED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    NO_ANSWER: { bg: "bg-slate-100 border-slate-200", text: "text-slate-700" },
    FAILED: { bg: "bg-red-50 border-red-200", text: "text-red-700" },
    IN_PROGRESS: { bg: "bg-blue-50 border-blue-200", text: "text-[#004e9f]" },
    RINGING: { bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
    QUEUED: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Call History & Outcomes
            </h1>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#004e9f] border border-blue-200">
              {totalItems} calls recorded
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Audit comprehensive call logs, AI extracted verdicts, audio recordings, and customer sentiment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/crm/collections"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            Collections Queue
          </Link>
          <ExportCallsButton calls={exportData} />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Calling Records</span>
            <PhoneCall className="h-4 w-4 text-[#004e9f]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalCalls}</div>
          <div className="mt-1 text-[11px] text-slate-400">All campaigns combined</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Connected & Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{completedCalls}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {totalCalls > 0 ? `${Math.round((completedCalls / totalCalls) * 100)}% contact rate` : "No calls"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Autonomous AI vs Manual</span>
            <Sparkles className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {aiCalls} <span className="text-sm font-normal text-slate-400">/ {manualCalls}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">AI calls vs agent notes</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Talk Time</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalDurationMin}m</div>
          <div className="mt-1 text-[11px] text-slate-400">Aggregate telephony duration</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <form method="GET" action="/crm/calls" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by customer name, phone, SID, or verdict summary..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#004e9f] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              name="status"
              defaultValue={currentStatus}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#004e9f] focus:outline-none"
            >
              <option value="ALL">Status: All</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_ANSWER">No Answer</option>
              <option value="FAILED">Failed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RINGING">Ringing</option>
              <option value="QUEUED">Queued</option>
            </select>

            <select
              name="source"
              defaultValue={currentSource}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#004e9f] focus:outline-none"
            >
              <option value="ALL">Source: All</option>
              <option value="AI">Autonomous AI</option>
              <option value="MANUAL">Manual Call</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>

            {(searchQuery || currentStatus !== "ALL" || currentSource !== "ALL") && (
              <Link
                href="/crm/calls"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Calls Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {calls.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#004e9f] border border-blue-200 mb-3">
              <PhoneCall className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No Call Records Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              There are no call records matching the active filters. Check back after running campaign batches or logging manual calls.
            </p>
            <div className="mt-4">
              <Link
                href="/crm/calls"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear Filters
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Source & Status</th>
                  <th className="py-3 px-4">Outcome Verdict</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {calls.map((call) => {
                  const badge = statusBadges[call.status] || {
                    bg: "bg-slate-100 border-slate-200",
                    text: "text-slate-700",
                  };
                  const durationM = Math.floor((call.durationSeconds || 0) / 60);
                  const durationS = (call.durationSeconds || 0) % 60;

                  return (
                    <tr key={call.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {new Date(call.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {new Date(call.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/crm/customers/${call.customer.id}`}
                          className="font-semibold text-slate-900 hover:text-[#004e9f] transition-colors"
                        >
                          {call.customer.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {call.customer.phoneNumber}
                        </div>
                      </td>

                      {/* Campaign */}
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium text-slate-800">{call.campaign.name}</span>
                      </td>

                      {/* Source & Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.text}`}
                          >
                            {call.status}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {call.source === "MANUAL" ? "Manual" : "AI"}
                          </span>
                        </div>
                      </td>

                      {/* Outcome Verdict */}
                      <td className="py-3 px-4 max-w-xs">
                        {call.summary?.callOutcome ? (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {call.summary.callOutcome}
                            </span>
                            {call.summary.summaryText && (
                              <p className="text-[11px] text-slate-500 truncate mt-0.5" title={call.summary.summaryText}>
                                {call.summary.summaryText}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No verdict generated</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {call.durationSeconds && call.durationSeconds > 0 ? (
                          `${durationM}m ${durationS}s`
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Link to Call details / Audio */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/calls/${call.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#004e9f] hover:bg-blue-50/50 hover:border-blue-300 transition-colors"
                        >
                          Details
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Showing page {currentPage} of {totalPages} ({totalItems} total)
            </span>
            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <Link
                  href={`/crm/calls?page=${currentPage - 1}&status=${currentStatus}&source=${currentSource}&q=${encodeURIComponent(searchQuery)}`}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/crm/calls?page=${currentPage + 1}&status=${currentStatus}&source=${currentSource}&q=${encodeURIComponent(searchQuery)}`}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
