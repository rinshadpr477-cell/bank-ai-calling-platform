import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LiveCallMonitor } from "@/components/LiveCallMonitor";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { id } = await params;

  const call = await prisma.call.findUnique({
    where: { id },
    include: {
      customer: true,
      campaign: true,
      summary: true,
      transcript: { include: { turns: { orderBy: { spokenAt: "asc" } } } },
    },
  });
  if (!call) notFound();

  const durationText = call.durationSeconds
    ? `${Math.floor(call.durationSeconds / 60)}m ${Math.floor(call.durationSeconds % 60)}s`
    : call.startedAt && call.endedAt
      ? `${Math.round((call.endedAt.getTime() - call.startedAt.getTime()) / 1000)}s`
      : "—";

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full max-w-3xl">
        <Link href={`/campaigns/${call.campaign.id}`} className="text-sm text-[#5E775E] transition-colors hover:text-[#132B23]">
          ← Back to {call.campaign.name}
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#132B23]">{call.customer.name}</h1>
            <p className="mt-1 text-sm text-[#5E775E]">
              {call.customer.phoneNumber} · {durationText}
            </p>
          </div>
          <span className="rounded-full bg-[#BA9B5F]/20 px-3 py-1 text-xs font-medium text-[#132B23]">
            {call.status}
          </span>
        </div>

        {!call.summary && (
          <div className="mt-6">
            <LiveCallMonitor callId={call.id} initialStatus={call.status} />
          </div>
        )}

        {call.summary ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4">
              <h2 className="text-sm font-medium text-[#132B23]">Summary</h2>
              <p className="mt-1 text-sm text-[#5E775E]">{call.summary.summaryText}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Interested" value={call.summary.interested === true ? "Yes" : call.summary.interested === false ? "No" : "Unknown"} />
              <Stat label="Sentiment" value={call.summary.sentiment ?? "—"} />
              <Stat label="Loan Amount" value={call.summary.loanAmount ?? "—"} />
              <Stat label="Callback Needed" value={call.summary.callbackRequired === true ? "Yes" : call.summary.callbackRequired === false ? "No" : "Unknown"} />
            </div>
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4 text-sm text-[#5E775E]">
            {call.status === "COMPLETED" || call.status === "FAILED"
              ? "No summary was recorded for this call."
              : "This call hasn't completed yet — a summary will appear once it ends."}
          </p>
        )}

        {call.transcript && call.transcript.turns.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-medium text-[#132B23]">Transcript</h2>
            <div className="space-y-2 rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4">
              {call.transcript.turns.map((turn) => (
                <p key={turn.id} className="text-sm">
                  <span className="font-medium text-[#132B23]">
                    {turn.speaker === "AI" ? "Agent" : call.customer.name}:
                  </span>{" "}
                  <span className="text-[#5E775E]">{turn.text}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-3 transition-colors hover:bg-[#BA9B5F]/10">
      <p className="text-xs text-[#5E775E]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#132B23]">{value}</p>
    </div>
  );
}