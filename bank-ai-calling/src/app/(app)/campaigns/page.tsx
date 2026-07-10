import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CampaignsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { customers: true, calls: true } } },
  });

  const canCreate = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#132B23]">Campaigns</h1>
          {canCreate && (
            <Link href="/campaigns/new" className="rounded-md bg-[#132B23] px-4 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18]">
              + New Campaign
            </Link>
          )}
        </div>

        {campaigns.length === 0 ? (
          <p className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-6 text-sm text-[#5E775E]">
            No campaigns yet. {canCreate ? "Create your first one to get started." : ""}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="group flex flex-col rounded-xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-5 transition-colors hover:border-[#5E775E] hover:bg-[#BA9B5F]/10 active:bg-[#BA9B5F]/20">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium text-[#132B23]">{c.name}</h2>
                  <span className="shrink-0 rounded-full bg-[#BA9B5F]/20 px-2.5 py-0.5 text-xs font-medium text-[#132B23]">
                    {c.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#5E775E]">
                  {c._count.customers} customers · {c._count.calls} calls
                </p>
                <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#5E775E] px-3 py-1.5 text-sm font-medium text-[#E9E0CF] transition-colors group-hover:bg-[#132B23]">
                  View campaign
                  <span aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}