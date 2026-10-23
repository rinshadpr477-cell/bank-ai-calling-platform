import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StartCampaignButton } from "@/components/StartCampaignButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CreditLimitChecker } from "@/components/CreditLimitChecker";
import { DeleteCampaignButton } from "@/components/DeleteCampaignButton";
import { LogManualCallModal } from "@/components/LogManualCallModal";
import {
  ArrowLeft,
  Users,
  PhoneCall,
  Globe,
  Upload,
  Edit3,
  BarChart2,
  Bot,
  ArrowRight,
} from "lucide-react";

export default async function CampaignDetailPage({
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
      customers: { orderBy: { createdAt: "desc" }, take: 10 },
      calls: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { customer: true, summary: true },
      },
      _count: { select: { customers: true, calls: true } },
    },
  });

  if (!campaign) notFound();

  const billingAccount = await prisma.billingAccount.findFirst();
  const creditsExhausted = Boolean(
    billingAccount &&
      billingAccount.subscriptionStatus === "FREE" &&
      billingAccount.freeCallsUsed >= billingAccount.freeCallsLimit
  );

  const canManage = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  const statusBadgeClass =
    campaign.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : campaign.status === "COMPLETED"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <AutoRefresh intervalMs={4000} />
      {canManage && <CreditLimitChecker exhausted={creditsExhausted} />}

      {/* Top Navigation & Status */}
      <div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#004e9f] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Campaigns
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {campaign.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusBadgeClass}`}
              >
                {campaign.status}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <strong className="text-slate-900">{campaign._count.customers}</strong> contacts uploaded
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                <strong className="text-slate-900">{campaign._count.calls}</strong> total calls
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 uppercase">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                {campaign.language}
              </span>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/campaigns/${campaign.id}/results`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
            >
              <BarChart2 className="h-4 w-4 text-[#004e9f]" />
              View Results & Verdicts
            </Link>

            {canManage && (
              <>
                <Link
                  href={`/campaigns/${campaign.id}/upload`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Upload className="h-4 w-4 text-slate-500" />
                  Upload CSV
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-slate-500" />
                  Edit
                </Link>
                <StartCampaignButton campaignId={campaign.id} />
              </>
            )}

            {session.user.role === "ADMIN" && (
              <DeleteCampaignButton campaignId={campaign.id} campaignName={campaign.name} />
            )}
          </div>
        </div>
      </div>

      {/* AI Prompt Summary Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-[#004e9f]" />
            <h2 className="text-sm font-semibold text-slate-900">
              Active AI Conversational Prompt
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Variable: {"{{customer_data}}"}
          </span>
        </div>
        <div className="mt-3 rounded-xl bg-slate-50/80 p-4 border border-slate-100">
          <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 leading-relaxed max-h-48 overflow-y-auto">
            {campaign.aiPrompt}
          </pre>
        </div>
      </div>

      {/* Two Column Layout: Recent Customers & Recent Calls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Roster Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Customer Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing latest 10 of {campaign._count.customers} contacts
              </p>
            </div>
            {canManage && (
              <Link
                href={`/campaigns/${campaign.id}/upload`}
                className="text-xs font-semibold text-[#004e9f] hover:underline"
              >
                + Add Contacts
              </Link>
            )}
          </div>

          {campaign.customers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No customer records uploaded yet. Click &quot;Upload CSV&quot; above to import contacts.
            </div>
          ) : (
            <div className="space-y-2">
              {campaign.customers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {c.name}
                    </p>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">
                      {c.phoneNumber}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {c.status}
                    </span>
                    {canManage && (
                      <LogManualCallModal customerId={c.id} customerName={c.name} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Calls & Outcomes Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Calls & History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing latest 10 of {campaign._count.calls} calls
              </p>
            </div>
            <Link
              href={`/campaigns/${campaign.id}/results`}
              className="text-xs font-semibold text-[#004e9f] hover:underline flex items-center gap-1"
            >
              Full Analysis
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {campaign.calls.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <PhoneCall className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              No calls initiated yet. Click &quot;Start Next Call&quot; to begin dialing.
            </div>
          ) : (
            <div className="space-y-2">
              {campaign.calls.map((call) => {
                const callStatusClass =
                  call.status === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : call.status === "FAILED" || call.status === "NO_ANSWER"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-blue-50 text-blue-700 border-blue-200";

                return (
                  <Link
                    key={call.id}
                    href={`/calls/${call.id}`}
                    className="block p-3 rounded-xl border border-slate-100 bg-white hover:border-[#004e9f]/40 hover:bg-slate-50/50 shadow-xs transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 group-hover:text-[#004e9f] transition-colors truncate">
                        {call.customer.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {call.source === "MANUAL" && (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                            Manual
                          </span>
                        )}
                        {call.summary?.interested && (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            Interested
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${callStatusClass}`}
                        >
                          {call.status}
                        </span>
                      </div>
                    </div>

                    {call.summary && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {call.summary.summaryText}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}