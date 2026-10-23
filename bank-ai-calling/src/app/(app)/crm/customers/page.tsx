import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogManualCallModal } from "@/components/LogManualCallModal";
import { CreateFollowUpModal } from "@/components/CreateFollowUpModal";
import {
  Users,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface CustomersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    campaignId?: string;
    page?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const resolvedParams = await searchParams;
  const search = resolvedParams.search ?? "";
  const status = resolvedParams.status ?? "";
  const campaignId = resolvedParams.campaignId ?? "";
  const page = Math.max(parseInt(resolvedParams.page ?? "1", 10), 1);
  const pageSize = 15;

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phoneNumber: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && ["PENDING", "CALLED", "FAILED", "DO_NOT_CALL"].includes(status)) {
    where.status = status;
  }

  if (campaignId) {
    where.campaignId = campaignId;
  }

  const [totalCount, customers, campaigns] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        campaign: { select: { id: true, name: true } },
        calls: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { summary: true },
        },
        _count: { select: { calls: true, followUps: true } },
      },
    }),
    prisma.campaign.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const canManage = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Customers & Accounts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage customer collection records, track outstanding loan amounts, and schedule agent callbacks.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <span className="font-semibold text-slate-900">{customers.length}</span> of{" "}
          <span className="font-semibold text-slate-900">{totalCount}</span> total customer accounts
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form
        method="GET"
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
      >
        <div className="relative sm:col-span-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by customer name, phone, or email..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#004e9f] focus:bg-white focus:ring-2 focus:ring-[#004e9f]/20"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#004e9f] focus:bg-white focus:ring-2 focus:ring-[#004e9f]/20"
          >
            <option value="">All Call Statuses</option>
            <option value="PENDING">Pending First Contact</option>
            <option value="CALLED">Called</option>
            <option value="FAILED">Failed / No Answer</option>
            <option value="DO_NOT_CALL">Do Not Call (Suppressed)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            name="campaignId"
            defaultValue={campaignId}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#004e9f] focus:bg-white focus:ring-2 focus:ring-[#004e9f]/20"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-1 flex items-center justify-end">
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center rounded-xl bg-[#004e9f] px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#003d7c] transition-colors"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Customer Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {customers.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-900">No customer accounts found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || status || campaignId
                ? "Try clearing your filters to see all customer records."
                : "Upload customer contacts via Voice Campaigns to populate the CRM database."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-3">Phone Number</th>
                  <th className="py-3.5 px-3">Campaign</th>
                  <th className="py-3.5 px-3">Call Status</th>
                  <th className="py-3.5 px-3">Loan Amount</th>
                  <th className="py-3.5 px-3">Latest Verdict</th>
                  <th className="py-3.5 px-3">Follow-ups</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
                  const latestCall = c.calls[0];
                  const summary = latestCall?.summary;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <Link
                          href={`/crm/customers/${c.id}`}
                          className="hover:text-[#004e9f] hover:underline"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {c.phoneNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-xs">
                        {c.campaign.name}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            c.status === "CALLED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : c.status === "PENDING"
                              ? "bg-blue-50 text-[#004e9f] border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {summary?.loanAmount ?? "—"}
                      </td>
                      <td className="py-3 px-3">
                        {summary?.callOutcome ? (
                          <span className="capitalize font-medium text-slate-800">
                            {summary.callOutcome.replace(/_/g, " ")}
                          </span>
                        ) : summary?.interested === true ? (
                          <span className="font-semibold text-emerald-700">Interested</span>
                        ) : summary?.interested === false ? (
                          <span className="font-semibold text-rose-600">Not Interested</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {c._count.followUps > 0 ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            {c._count.followUps} tasks
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManage && (
                            <LogManualCallModal customerId={c.id} customerName={c.name} />
                          )}
                          <CreateFollowUpModal customerId={c.id} customerName={c.name} />
                          <Link
                            href={`/crm/customers/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-[#004e9f] hover:text-white transition-all"
                          >
                            Profile
                            <ArrowRight className="h-3 w-3" />
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <div>
              Page <strong className="text-slate-900">{page}</strong> of{" "}
              <strong className="text-slate-900">{totalPages}</strong>
            </div>

            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/crm/customers?page=${page - 1}&search=${encodeURIComponent(
                    search
                  )}&status=${status}&campaignId=${campaignId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/crm/customers?page=${page + 1}&search=${encodeURIComponent(
                    search
                  )}&status=${status}&campaignId=${campaignId}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
