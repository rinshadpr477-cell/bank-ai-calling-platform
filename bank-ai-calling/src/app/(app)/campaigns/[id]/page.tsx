import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StartCampaignButton } from "@/components/StartCampaignButton";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CreditLimitChecker } from "@/components/CreditLimitChecker";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      customers: { orderBy: { createdAt: "desc" }, take: 10 },
      calls: { orderBy: { createdAt: "desc" }, take: 10, include: { customer: true, summary: true } },
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

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <AutoRefresh intervalMs={4000} />
      {canManage && <CreditLimitChecker exhausted={creditsExhausted} />}
      <div className="w-full">
        <Link href="/campaigns" className="text-sm text-[#5E775E] transition-colors hover:text-[#132B23]">
          ← Back to campaigns
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#132B23]">{campaign.name}</h1>
            <p className="mt-1 text-sm text-[#5E775E]">
              {campaign._count.customers} customers · {campaign._count.calls} calls · {campaign.language.toUpperCase()}
            </p>
          </div>
          <span className="rounded-full bg-[#BA9B5F]/20 px-3 py-1 text-xs font-medium text-[#132B23]">
            {campaign.status}
          </span>
        </div>

        <div className="mt-6 rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4">
          <h2 className="text-sm font-medium text-[#132B23]">AI Prompt</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#5E775E]">
            {campaign.aiPrompt}
          </p>
        </div>

        {/* View Results is visible to everyone logged in — only the
            management actions below (upload, trigger calls) are
            restricted to Admin/Supervisor. */}
        <div className="mt-6">
          <Link href={`/campaigns/${campaign.id}/results`} className="inline-block rounded-md bg-[#5E775E] px-4 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#132B23] active:bg-[#0d1f18]">
            View Results
          </Link>
        </div>

        {canManage && (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-3">
              <Link href={`/campaigns/${campaign.id}/upload`} className="inline-block rounded-md bg-[#132B23] px-4 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18]">
                Upload Customer CSV
              </Link>
            </div>
            <div>
              <StartCampaignButton campaignId={campaign.id} />
            </div>
          </div>
        )}

        <div className="mt-6 w-full">
          <h2 className="mb-2 text-sm font-medium text-[#132B23]">
            Recent Customers ({campaign._count.customers} total)
          </h2>
          {campaign.customers.length === 0 ? (
            <p className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4 text-sm text-[#5E775E]">
              No customers uploaded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {campaign.customers.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-3 text-sm transition-colors hover:bg-[#BA9B5F]/10">
                  <span className="text-[#132B23]">{c.name}</span>
                  <span className="text-[#5E775E]">{c.phoneNumber}</span>
                  <span className="rounded-full bg-[#BA9B5F]/20 px-2 py-0.5 text-xs text-[#132B23]">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 w-full">
          <h2 className="mb-2 text-sm font-medium text-[#132B23]">
            Recent Calls ({campaign._count.calls} total)
          </h2>
          {campaign.calls.length === 0 ? (
            <p className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4 text-sm text-[#5E775E]">
              No calls placed yet.
            </p>
          ) : (
            <div className="space-y-2">
              {campaign.calls.map((call) => (
                <Link key={call.id} href={`/calls/${call.id}`} className="block rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-3 text-sm transition-colors hover:bg-[#BA9B5F]/10 active:bg-[#BA9B5F]/20">
                  <div className="flex items-center justify-between">
                    <span className="text-[#132B23]">{call.customer.name}</span>
                    <div className="flex items-center gap-2">
                      {call.summary?.interested && (
                        <span className="rounded-full bg-[#5E775E]/20 px-2 py-0.5 text-xs font-medium text-[#132B23]">
                          Interested
                        </span>
                      )}
                      <span className="rounded-full bg-[#BA9B5F]/20 px-2 py-0.5 text-xs text-[#132B23]">
                        {call.status}
                      </span>
                    </div>
                  </div>
                  {call.summary && (
                    <p className="mt-1 truncate text-xs text-[#5E775E]">{call.summary.summaryText}</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}