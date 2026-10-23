import Link from "next/link";
import { prisma, Prisma } from "@/lib/prisma";
import { LogManualCallModal } from "@/components/LogManualCallModal";
import { CreateFollowUpModal } from "@/components/CreateFollowUpModal";
import {
  Search,
  PhoneCall,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  Building2,
  DollarSign,
  ChevronRight,
} from "lucide-react";

interface CollectionsPageProps {
  searchParams: Promise<{
    queue?: string;
    q?: string;
    priority?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CollectionsQueuePage({ searchParams }: CollectionsPageProps) {
  const params = await searchParams;
  const currentQueue = params.queue || "all";
  const searchQuery = params.q?.trim() || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 15;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Fetch counts for quick stats pills
  const [
    callbackCount,
    overdueFollowUpsCount,
    todayFollowUpsCount,
    pendingContactCount,
  ] = await Promise.all([
    // Customers with last call having callbackRequired = true
    prisma.customer.count({
      where: {
        calls: {
          some: {
            summary: {
              callbackRequired: true,
            },
          },
        },
      },
    }),
    // Overdue pending tasks
    prisma.followUpTask.count({
      where: {
        status: "PENDING",
        dueDate: { lt: now },
      },
    }),
    // Due today pending tasks
    prisma.followUpTask.count({
      where: {
        status: "PENDING",
        dueDate: { gte: startOfToday, lte: endOfToday },
      },
    }),
    // Customers pending initial call
    prisma.customer.count({
      where: {
        status: "PENDING",
      },
    }),
  ]);

  // 2. Build where filter based on queue filter
  const customerWhere: Prisma.CustomerWhereInput = {};

  if (searchQuery) {
    customerWhere.OR = [
      { name: { contains: searchQuery, mode: "insensitive" } },
      { phoneNumber: { contains: searchQuery } },
    ];
  }

  if (currentQueue === "callbacks") {
    customerWhere.calls = {
      some: {
        summary: {
          callbackRequired: true,
        },
      },
    };
  } else if (currentQueue === "overdue") {
    customerWhere.followUps = {
      some: {
        status: "PENDING",
        dueDate: { lt: now },
      },
    };
  } else if (currentQueue === "today") {
    customerWhere.followUps = {
      some: {
        status: "PENDING",
        dueDate: { gte: startOfToday, lte: endOfToday },
      },
    };
  } else if (currentQueue === "uncontacted") {
    customerWhere.status = "PENDING";
  } else {
    // "all" urgent queue: either has pending tasks, callback required, or pending/failed status
    customerWhere.OR = [
      {
        followUps: {
          some: {
            status: "PENDING",
          },
        },
      },
      {
        calls: {
          some: {
            summary: {
              callbackRequired: true,
            },
          },
        },
      },
      {
        status: {
          in: ["PENDING", "FAILED"],
        },
      },
    ];
  }

  // Fetch customers matching filter
  const totalItems = await prisma.customer.count({ where: customerWhere });
  const customers = await prisma.customer.findMany({
    where: customerWhere,
    include: {
      campaign: {
        select: { id: true, name: true },
      },
      calls: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          summary: true,
        },
      },
      followUps: {
        where: { status: "PENDING" },
        orderBy: { dueDate: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Collections Work Queue
            </h1>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#004e9f] border border-blue-200">
              {totalItems} accounts
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Actionable recovery worklist prioritized by AI callback triggers, overdue promises, and unreached debtors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/crm/follow-ups"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            Manage Follow-ups
          </Link>
          <Link
            href="/crm/customers"
            className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#003d7d] transition-colors"
          >
            <Building2 className="h-3.5 w-3.5" />
            Customer Directory
          </Link>
        </div>
      </div>

      {/* Queue Stat Pill Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/crm/collections?queue=callbacks"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentQueue === "callbacks"
              ? "border-[#004e9f] bg-blue-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <PhoneCall className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Callbacks Requested</p>
              <p className="text-lg font-bold text-slate-900">{callbackCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/crm/collections?queue=overdue"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentQueue === "overdue"
              ? "border-red-500 bg-red-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Overdue Tasks</p>
              <p className="text-lg font-bold text-red-600">{overdueFollowUpsCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/crm/collections?queue=today"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentQueue === "today"
              ? "border-[#004e9f] bg-blue-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#004e9f] border border-blue-200">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Due Today</p>
              <p className="text-lg font-bold text-slate-900">{todayFollowUpsCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/crm/collections?queue=uncontacted"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentQueue === "uncontacted"
              ? "border-[#004e9f] bg-blue-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Uncontacted</p>
              <p className="text-lg font-bold text-slate-900">{pendingContactCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <form method="GET" action="/crm/collections" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by customer name, phone number..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#004e9f] focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              name="queue"
              defaultValue={currentQueue}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#004e9f] focus:outline-none"
            >
              <option value="all">Queue: All Urgent (Prioritized)</option>
              <option value="callbacks">Queue: Callbacks Requested</option>
              <option value="overdue">Queue: Overdue Follow-ups</option>
              <option value="today">Queue: Due Today</option>
              <option value="uncontacted">Queue: Unreached / Pending</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>

            {(searchQuery || currentQueue !== "all") && (
              <Link
                href="/crm/collections"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Queue Items Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Work Queue is Clear</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              There are no customer accounts currently requiring attention under this filter. Great job keeping collection queues updated!
            </p>
            <div className="mt-4">
              <Link
                href="/crm/customers"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#003d7d] transition-colors"
              >
                Browse All Customers
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer / Loan Reference</th>
                  <th className="py-3 px-4">Queue Urgency & Status</th>
                  <th className="py-3 px-4">Last Outcome & Next Action</th>
                  <th className="py-3 px-4">Next Target Date</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {customers.map((customer) => {
                  const lastCall = customer.calls[0];
                  const summary = lastCall?.summary;
                  const activeTask = customer.followUps[0];

                  // Determine priority badge & urgency reason
                  let urgencyBadge = {
                    label: "Regular Follow-up",
                    bg: "bg-slate-100 text-slate-700 border-slate-200",
                    reason: "Standard recovery queue",
                  };

                  if (summary?.callbackRequired) {
                    urgencyBadge = {
                      label: "Callback Requested",
                      bg: "bg-amber-50 text-amber-700 border-amber-200",
                      reason: summary.nextAction || "Customer requested agent follow-up call",
                    };
                  } else if (activeTask && new Date(activeTask.dueDate) < now) {
                    urgencyBadge = {
                      label: "Task Overdue",
                      bg: "bg-red-50 text-red-700 border-red-200",
                      reason: activeTask.title,
                    };
                  } else if (customer.status === "PENDING") {
                    urgencyBadge = {
                      label: "Pending Contact",
                      bg: "bg-blue-50 text-[#004e9f] border-blue-200",
                      reason: "No AI call connected yet",
                    };
                  } else if (customer.status === "FAILED") {
                    urgencyBadge = {
                      label: "Call Failed",
                      bg: "bg-red-50 text-red-700 border-red-200",
                      reason: "Previous call attempt failed/dropped",
                    };
                  }

                  const displayAmount = summary?.loanAmount;

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Customer info */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Link
                            href={`/crm/customers/${customer.id}`}
                            className="hover:text-[#004e9f] transition-colors"
                          >
                            {customer.name}
                          </Link>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {customer.phoneNumber}
                        </div>
                        {displayAmount && (
                          <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            <DollarSign className="h-2.5 w-2.5 text-slate-500" />
                            {displayAmount}
                          </div>
                        )}
                      </td>

                      {/* Urgency & Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${urgencyBadge.bg}`}>
                          {urgencyBadge.label}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-xs truncate" title={urgencyBadge.reason}>
                          {urgencyBadge.reason}
                        </p>
                      </td>

                      {/* Last Outcome & Next Action */}
                      <td className="py-3 px-4">
                        {summary ? (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {summary.callOutcome || "Call Connected"}
                            </span>
                            {summary.keyObjection && (
                              <p className="text-[11px] text-slate-500 italic mt-0.5 truncate max-w-xs">
                                &ldquo;{summary.keyObjection}&rdquo;
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No call outcome recorded</span>
                        )}
                      </td>

                      {/* Target Date */}
                      <td className="py-3 px-4 text-slate-600">
                        {activeTask ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className={new Date(activeTask.dueDate) < now ? "text-red-600 font-semibold" : ""}>
                              {new Date(activeTask.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        ) : summary?.followUpDate ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{summary.followUpDate}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <LogManualCallModal
                            customerId={customer.id}
                            customerName={customer.name}
                          />
                          <CreateFollowUpModal
                            customerId={customer.id}
                            customerName={customer.name}
                            callId={lastCall?.id}
                            buttonLabel="Task"
                            buttonClass="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-xs hover:border-[#004e9f] hover:text-[#004e9f] transition-all"
                          />
                          <Link
                            href={`/crm/customers/${customer.id}`}
                            className="inline-flex items-center justify-center h-6 w-6 rounded-lg text-slate-400 hover:text-[#004e9f] hover:bg-slate-100 transition-colors"
                            title="View Full Profile"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Showing page {currentPage} of {totalPages} ({totalItems} total)
            </span>
            <div className="flex items-center gap-1">
              {currentPage > 1 && (
                <Link
                  href={`/crm/collections?page=${currentPage - 1}&queue=${currentQueue}&q=${encodeURIComponent(searchQuery)}`}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/crm/collections?page=${currentPage + 1}&queue=${currentQueue}&q=${encodeURIComponent(searchQuery)}`}
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
