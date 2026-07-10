import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ExportCsvButton } from "@/components/ExportCsvButton";
import { ExportExcelButton } from "@/components/ExportExcelButton";
import { AutoRefresh } from "@/components/AutoRefresh";

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
      name: c.name,
      phone: c.phoneNumber,
      status: c.status,
      callStatus: latestCall?.status ?? "—",
      interested: summary?.interested === true ? "Yes" : summary?.interested === false ? "No" : "—",
      sentiment: summary?.sentiment ?? "—",
      loanAmount: summary?.loanAmount ?? "—",
      callbackRequired: summary?.callbackRequired === true ? "Yes" : summary?.callbackRequired === false ? "No" : "—",
      summaryText: summary?.summaryText ?? "—",
      callId: latestCall?.id,
    };
  });

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <AutoRefresh intervalMs={8000} />
      <div className="w-full">
        <Link href={`/campaigns/${campaign.id}`}className="text-sm text-[#5E775E] transition-colors hover:text-[#132B23]">← Back to campaign</Link>

        <div className="mt-3 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#132B23]">
            {campaign.name} — Results
          </h1>
          <div className="flex gap-3">
            <ExportCsvButton rows={rows} filename={`${campaign.name}-results.csv`} />
            <ExportExcelButton rows={rows} filename={`${campaign.name}-results.xlsx`} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-[#132B23]/60">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" /> Interested
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" /> Not interested
          </span>
        </div>

        <div className="mt-4 w-full overflow-x-auto rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#BA9B5F]/30 text-[#132B23]">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Call Status</th>
                <th className="p-3 font-medium">Interested</th>
                <th className="p-3 font-medium">Sentiment</th>
                <th className="p-3 font-medium">Loan Amount</th>
                <th className="p-3 font-medium">Callback</th>
                <th className="p-3 font-medium">Summary</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const rowClass =
                  row.interested === "Yes"
                    ? "bg-green-50/70 border-green-200"
                    : row.interested === "No"
                      ? "bg-red-50/70 border-red-200"
                      : "border-[#BA9B5F]/15";

                return (
                  <tr key={i} className={`border-b transition-colors last:border-0 hover:brightness-95 ${rowClass}`}>
                    <td className="p-3 text-[#132B23]">
                      {row.callId ? (
                        <Link href={`/calls/${row.callId}`}className="transition-colors hover:text-[#5E775E] hover:underline">
                          {row.name}
                        </Link>
                      ) : (
                        row.name
                      )}
                    </td>
                    <td className="p-3 text-[#5E775E]">{row.phone}</td>
                    <td className="p-3 text-[#5E775E]">{row.callStatus}</td>
                    <td className="p-3">
                      <span
                        className={
                          row.interested === "Yes"
                            ? "font-medium text-green-700"
                            : row.interested === "No"
                              ? "font-medium text-red-600"
                              : "text-[#5E775E]"
                        }>
                        {row.interested}
                      </span>
                    </td>
                    <td className="p-3 text-[#5E775E]">{row.sentiment}</td>
                    <td className="p-3 text-[#5E775E]">{row.loanAmount}</td>
                    <td className="p-3 text-[#5E775E]">{row.callbackRequired}</td>
                    <td className="max-w-xs truncate p-3 text-[#5E775E]" title={row.summaryText}>
                      {row.summaryText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}