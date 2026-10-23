import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LiveCallMonitor } from "@/components/LiveCallMonitor";
import {
  ArrowLeft,
  Phone,
  Clock,
  User,
  Bot,
  Volume2,
  MessageSquare,
} from "lucide-react";

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

  const outcomeLabel = call.summary?.callOutcome
    ? call.summary.callOutcome.replace(/_/g, " ")
    : null;

  const statusBadgeClass =
    call.status === "COMPLETED"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : call.status === "FAILED" || call.status === "NO_ANSWER"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Header and Back navigation */}
      <div>
        <Link
          href={`/campaigns/${call.campaign.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#004e9f] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {call.campaign.name}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {call.customer.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${statusBadgeClass}`}
              >
                {call.status}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {call.customer.phoneNumber}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                Duration: {durationText}
              </span>
              <span>·</span>
              <span className="text-slate-600">
                Campaign: <strong className="text-slate-900">{call.campaign.name}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/crm/customers/${call.customer.id}`}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:border-[#004e9f] hover:text-[#004e9f] transition-colors"
            >
              CRM Profile →
            </Link>
            {call.source === "MANUAL" && (
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                Manual Operator Call
              </span>
            )}
            {call.source === "AI" && (
              <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-[#004e9f] border border-blue-200">
                Autonomous AI Call
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live Monitor when call is active */}
      {!call.summary && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <LiveCallMonitor callId={call.id} initialStatus={call.status} />
        </div>
      )}

      {/* Audio Recording */}
      {call.recordingUrl && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900 mb-3">
            <Volume2 className="h-4 w-4 text-[#004e9f]" />
            <h2 className="text-sm font-semibold">Audio Recording</h2>
          </div>
          <audio controls className="w-full h-10 accent-[#004e9f]">
            <source src={`/api/recordings/${call.id}`} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Summary and Next Steps */}
      {call.summary ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">
              Call Summary & Verdict
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {call.summary.summaryText}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Interested"
                value={
                  call.summary.interested === true
                    ? "Yes"
                    : call.summary.interested === false
                    ? "No"
                    : "Unknown"
                }
                highlight={
                  call.summary.interested === true
                    ? "emerald"
                    : call.summary.interested === false
                    ? "rose"
                    : "slate"
                }
              />
              <StatCard label="Customer Sentiment" value={call.summary.sentiment ?? "—"} />
              <StatCard label="Loan / Quoted Amount" value={call.summary.loanAmount ?? "—"} />
              <StatCard
                label="Callback Required"
                value={
                  call.summary.callbackRequired === true
                    ? "Yes"
                    : call.summary.callbackRequired === false
                    ? "No"
                    : "Unknown"
                }
                highlight={call.summary.callbackRequired ? "amber" : "slate"}
              />
            </div>
          </div>

          {/* Actionable Next Steps */}
          {(outcomeLabel ||
            call.summary.nextAction ||
            call.summary.priority ||
            call.summary.followUpDate ||
            call.summary.keyObjection) && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Operational Next Steps
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {outcomeLabel && <StatCard label="Call Outcome" value={outcomeLabel} />}
                {call.summary.priority && (
                  <StatCard label="Action Priority" value={call.summary.priority} />
                )}
                {call.summary.followUpDate && (
                  <StatCard label="Scheduled Follow-up" value={call.summary.followUpDate} />
                )}
                {call.summary.nextAction && (
                  <StatCard label="Recommended Action" value={call.summary.nextAction} />
                )}
              </div>

              {call.summary.keyObjection && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-xs text-amber-800">
                  <span className="font-semibold">Key Objection Recorded: </span>
                  {call.summary.keyObjection}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-500 shadow-sm text-sm">
          {call.status === "COMPLETED" || call.status === "FAILED"
            ? "No summary was recorded for this call."
            : "Call in progress — AI verdict and extracted details will populate immediately upon termination."}
        </div>
      )}

      {/* Transcript Chat Log */}
      {call.transcript && call.transcript.turns.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
            <MessageSquare className="h-4 w-4 text-[#004e9f]" />
            <h2 className="text-sm font-semibold text-slate-900">
              Verbatim Call Transcript ({call.transcript.turns.length} turns)
            </h2>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {call.transcript.turns.map((turn) => {
              const isAI = turn.speaker === "AI";
              return (
                <div
                  key={turn.id}
                  className={`flex gap-3 ${isAI ? "justify-start" : "justify-end"}`}
                >
                  {isAI && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#004e9f] border border-blue-200">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 text-xs leading-relaxed ${
                      isAI
                        ? "bg-slate-50 text-slate-900 border border-slate-200/80"
                        : "bg-[#004e9f] text-white shadow-sm"
                    }`}
                  >
                    <p
                      className={`font-semibold mb-1 text-[11px] ${
                        isAI ? "text-[#004e9f]" : "text-blue-100"
                      }`}
                    >
                      {isAI ? "AI Voice Agent" : call.customer.name}
                    </p>
                    <p className="whitespace-pre-wrap">{turn.text}</p>
                  </div>

                  {!isAI && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "emerald" | "rose" | "amber" | "slate";
}) {
  const highlightStyles = {
    emerald: "text-emerald-700 bg-emerald-50/50 border-emerald-200",
    rose: "text-rose-700 bg-rose-50/50 border-rose-200",
    amber: "text-amber-700 bg-amber-50/50 border-amber-200",
    slate: "text-slate-900 bg-slate-50 border-slate-100",
  };

  const styleClass = highlight ? highlightStyles[highlight] : highlightStyles.slate;

  return (
    <div className={`rounded-xl border p-3.5 ${styleClass}`}>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm font-bold truncate">{value}</p>
    </div>
  );
}