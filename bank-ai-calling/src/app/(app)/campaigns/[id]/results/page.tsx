import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default async function CampaignResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      customers: {
        orderBy: { createdAt: "asc" },
        include: {
          calls: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { summary: true },
          },
        },
      },
    },
  });

  if (!campaign) notFound();

  const rows = campaign.customers.map((c) => {
    const latestCall = c.calls[0];
    const summary = latestCall?.summary;
    return {
      customerId: c.id,
      name: c.name,
      phone: c.phoneNumber,
      status: c.status,
      callStatus: latestCall?.status ?? "—",
      interested: summary?.interested === true ? "Yes" : summary?.interested === false ? "No" : "—",
      sentiment: summary?.sentiment ?? "—",
      loanAmount: summary?.loanAmount ?? "—",
      callbackRequired: summary?.callbackRequired === true ? "Yes" : summary?.callbackRequired === false ? "No" : "—",
      callOutcome: summary?.callOutcome ? summary.callOutcome.replace(/_/g, " ") : "—",
      nextAction: summary?.nextAction ?? "—",
      priority: summary?.priority ?? "—",
      summaryText: summary?.summaryText ?? "—",
      callId: latestCall?.id,
      source: latestCall?.source ?? null,
    };
  });

  const totalContacts = rows.length;
  const interestedCount = rows.filter((r) => r.interested === "Yes").length;
  const notInterestedCount = rows.filter((r) => r.interested === "No").length;
  const callbacksCount = rows.filter((r) => r.callbackRequired === "Yes").length;

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <AutoRefresh intervalMs={8000} />

      {/* Header and Actions */}
      <div>
        <Link
          href={`/campaigns/${campaign.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#004e9f] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {campaign.name}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {campaign.name} — Call Verdicts
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Comprehensive AI conversation analytics, extracted customer interest, and actionable next steps.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <ExportCsvButton rows={rows} filename={`${campaign.name}-results.csv`} />
            <ExportExcelButton rows={rows} filename={`${campaign.name}-results.xlsx`} />
          </div>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Contacts</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalContacts}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interested</p>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{interestedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Not Interested</p>
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-rose-600">{notInterestedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Callbacks Needed</p>
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
          <p className="mt-1 text-2xl font-bold text-[#004e9f]">{callbacksCount}</p>
        </div>
      </div>

      {/* Results Table Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-700 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-3">Phone</th>
                <th className="py-3.5 px-3">Call Status</th>
                <th className="py-3.5 px-3">Interested</th>
                <th className="py-3.5 px-3">Sentiment</th>
                <th className="py-3.5 px-3">Loan Amount</th>
                <th className="py-3.5 px-3">Callback</th>
                <th className="py-3.5 px-3">Outcome</th>
                <th className="py-3.5 px-3">Next Action</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-4 min-w-[200px]">AI Verdict Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No customer calls found in this campaign yet.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => {
                  const isInterested = row.interested === "Yes";
                  const isNotInterested = row.interested === "No";

                  const rowHighlight = isInterested
                    ? "bg-emerald-50/30 hover:bg-emerald-50/60"
                    : isNotInterested
                    ? "bg-rose-50/20 hover:bg-rose-50/50"
                    : "hover:bg-slate-50/80";

                  return (
                    <tr key={i} className={`transition-colors ${rowHighlight}`}>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          {row.callId ? (
                            <Link
                              href={`/calls/${row.callId}`}
                              className="text-[#004e9f] hover:underline"
                            >
                              {row.name}
                            </Link>
                          ) : (
                            <span>{row.name}</span>
                          )}
                          <Link
                            href={`/crm/customers/${row.customerId}`}
                            className="text-[10px] text-slate-400 hover:text-[#004e9f] border border-slate-200 rounded px-1 py-0.5"
                            title="View CRM profile"
                          >
                            CRM
                          </Link>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {row.source === "MANUAL" ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                            Manual
                          </span>
                        ) : row.source === "AI" ? (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-[#004e9f] border border-blue-200">
                            AI
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{row.phone}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            row.callStatus === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : row.callStatus === "FAILED" || row.callStatus === "NO_ANSWER"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {row.callStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {isInterested ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Yes
                          </span>
                        ) : isNotInterested ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                            <XCircle className="h-3.5 w-3.5" />
                            No
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{row.sentiment}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{row.loanAmount}</td>
                      <td className="py-3 px-3">
                        {row.callbackRequired === "Yes" ? (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                            Callback Required
                          </span>
                        ) : (
                          <span className="text-slate-400">{row.callbackRequired}</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-700 font-medium capitalize">{row.callOutcome}</td>
                      <td className="py-3 px-3 text-slate-600">{row.nextAction}</td>
                      <td className="py-3 px-3 text-slate-600">{row.priority}</td>
                      <td
                        className="py-3 px-4 max-w-xs truncate text-slate-600"
                        title={row.summaryText}
                      >
                        {row.summaryText}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}