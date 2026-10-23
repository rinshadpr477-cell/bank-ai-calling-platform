import Link from "next/link";
import { prisma, Prisma, FollowUpStatus, Priority } from "@/lib/prisma";
import { ScheduleTaskModal } from "@/components/ScheduleTaskModal";
import { FollowUpActions } from "@/components/FollowUpActions";
import {
  CalendarCheck,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  ChevronRight,
  Sparkles,
  XCircle
} from "lucide-react";

interface FollowUpsPageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    q?: string;
    page?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function FollowUpsPage({ searchParams }: FollowUpsPageProps) {
  const params = await searchParams;
  const currentStatus = params.status || "PENDING";
  const currentPriority = params.priority || "ALL";
  const searchQuery = params.q?.trim() || "";
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));
  const pageSize = 15;

  const now = new Date();

  // 1. Fetch KPI counts
  const [pendingCount, overdueCount, completedCount, totalCount] = await Promise.all([
    prisma.followUpTask.count({ where: { status: "PENDING" } }),
    prisma.followUpTask.count({
      where: {
        status: "PENDING",
        dueDate: { lt: now },
      },
    }),
    prisma.followUpTask.count({ where: { status: "COMPLETED" } }),
    prisma.followUpTask.count(),
  ]);

  // 2. Fetch customers for the Schedule Task modal
  const customerOptions = await prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      phoneNumber: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // 3. Build query filter
  const where: Prisma.FollowUpTaskWhereInput = {};

  if (currentStatus === "OVERDUE") {
    where.status = "PENDING";
    where.dueDate = { lt: now };
  } else if (currentStatus !== "ALL") {
    where.status = currentStatus as FollowUpStatus;
  }

  if (currentPriority !== "ALL") {
    where.priority = currentPriority as Priority;
  }

  if (searchQuery) {
    where.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { notes: { contains: searchQuery, mode: "insensitive" } },
      { customer: { name: { contains: searchQuery, mode: "insensitive" } } },
      { customer: { phoneNumber: { contains: searchQuery } } },
    ];
  }

  const totalItems = await prisma.followUpTask.count({ where });
  const tasks = await prisma.followUpTask.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      call: {
        select: {
          id: true,
          source: true,
          summary: {
            select: {
              callOutcome: true,
            },
          },
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
    ],
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
              Follow-up Tasks
            </h1>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#004e9f] border border-blue-200">
              {pendingCount} Pending
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Track customer promises, reschedule commitments, and manage daily recovery tasks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/crm/collections"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            Work Queue
          </Link>
          <ScheduleTaskModal customers={customerOptions} />
        </div>
      </div>

      {/* KPI Cards / Status Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/crm/follow-ups?status=PENDING"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentStatus === "PENDING"
              ? "border-[#004e9f] bg-blue-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#004e9f] border border-blue-200">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pending Tasks</p>
              <p className="text-lg font-bold text-slate-900">{pendingCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/crm/follow-ups?status=OVERDUE"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentStatus === "OVERDUE"
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
              <p className="text-lg font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/crm/follow-ups?status=COMPLETED"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentStatus === "COMPLETED"
              ? "border-emerald-500 bg-emerald-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Completed Tasks</p>
              <p className="text-lg font-bold text-emerald-600">{completedCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>

        <Link
          href="/crm/follow-ups?status=ALL"
          className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
            currentStatus === "ALL"
              ? "border-[#004e9f] bg-blue-50/50 shadow-xs"
              : "border-slate-200/80 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
              <CalendarCheck className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">All Tasks</p>
              <p className="text-lg font-bold text-slate-900">{totalCount}</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </Link>
      </div>

      {/* Search and Filter Form */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <form method="GET" action="/crm/follow-ups" className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Search by task title, notes, or customer name..."
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
              <option value="PENDING">Status: Pending</option>
              <option value="OVERDUE">Status: Overdue</option>
              <option value="COMPLETED">Status: Completed</option>
              <option value="CANCELLED">Status: Cancelled</option>
            </select>

            <select
              name="priority"
              defaultValue={currentPriority}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-[#004e9f] focus:outline-none"
            >
              <option value="ALL">Priority: All</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Filter
            </button>

            {(searchQuery || currentStatus !== "PENDING" || currentPriority !== "ALL") && (
              <Link
                href="/crm/follow-ups"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Task List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#004e9f] border border-blue-200 mb-3">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No Follow-up Tasks Found</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              There are no tasks matching the selected criteria. Schedule a new task to stay organized with customer follow-ups.
            </p>
            <div className="mt-4">
              <ScheduleTaskModal customers={customerOptions} />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Task & Notes</th>
                  <th className="py-3 px-4">Customer Account</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {tasks.map((task) => {
                  const isOverdue = task.status === "PENDING" && new Date(task.dueDate) < now;

                  const priorityColors: Record<string, string> = {
                    HIGH: "bg-red-50 text-red-700 border-red-200",
                    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
                    LOW: "bg-blue-50 text-blue-700 border-blue-200",
                    NONE: "bg-slate-100 text-slate-600 border-slate-200",
                  };

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Task title & notes */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className={`font-semibold ${task.status === "COMPLETED" ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </div>
                        {task.notes && (
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                            {task.notes}
                          </p>
                        )}
                        {task.call?.summary?.callOutcome && (
                          <div className="inline-flex items-center gap-1 mt-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Sparkles className="h-2.5 w-2.5 text-blue-500" />
                            From Call Outcome: {task.call.summary.callOutcome}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/crm/customers/${task.customer.id}`}
                          className="font-semibold text-slate-900 hover:text-[#004e9f] transition-colors"
                        >
                          {task.customer.name}
                        </Link>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {task.customer.phoneNumber}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${priorityColors[task.priority] || priorityColors.MEDIUM}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <Calendar className={`h-3 w-3 ${isOverdue ? "text-red-500" : "text-slate-400"}`} />
                          <span className={isOverdue ? "text-red-600 font-semibold" : "text-slate-700"}>
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-red-500 font-medium">Overdue</span>
                        )}
                        {task.status === "COMPLETED" && task.completedAt && (
                          <span className="text-[10px] text-emerald-600 block mt-0.5">
                            Completed {new Date(task.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {task.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Completed
                          </span>
                        ) : task.status === "CANCELLED" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <FollowUpActions
                          taskId={task.id}
                          status={task.status}
                          dueDate={task.dueDate.toISOString()}
                        />
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
                  href={`/crm/follow-ups?page=${currentPage - 1}&status=${currentStatus}&priority=${currentPriority}&q=${encodeURIComponent(searchQuery)}`}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/crm/follow-ups?page=${currentPage + 1}&status=${currentStatus}&priority=${currentPriority}&q=${encodeURIComponent(searchQuery)}`}
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
