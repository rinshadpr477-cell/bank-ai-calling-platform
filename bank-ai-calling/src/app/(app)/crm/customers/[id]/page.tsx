import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { LogManualCallModal } from "@/components/LogManualCallModal";
import { CreateFollowUpModal } from "@/components/CreateFollowUpModal";
import { FollowUpActions } from "@/components/FollowUpActions";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Calendar,
  History,
  Sparkles,
  Volume2,
} from "lucide-react";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      campaign: true,
      calls: {
        orderBy: { createdAt: "desc" },
        include: {
          summary: true,
          transcript: { include: { turns: { orderBy: { spokenAt: "asc" } } } },
        },
      },
      followUps: {
        orderBy: { dueDate: "asc" },
        include: {
          call: { select: { id: true, summary: { select: { callOutcome: true } } } },
          assignedTo: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!customer) notFound();

  const canManage = session.user.role === "ADMIN" || session.user.role === "SUPERVISOR";

  // Derive latest call summary info
  const latestCall = customer.calls[0];
  const summary = latestCall?.summary;

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
      {/* Header and Back Link */}
      <div>
        <Link
          href="/crm/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#004e9f] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Customers & Accounts
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {customer.name}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  customer.status === "CALLED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : customer.status === "PENDING"
                    ? "bg-blue-50 text-[#004e9f] border-blue-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {customer.status}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-mono text-slate-700 font-semibold">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {customer.phoneNumber}
              </span>
              {customer.email && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {customer.email}
                  </span>
                </>
              )}
              <span>·</span>
              <span className="flex items-center gap-1 uppercase">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                Language: {customer.language}
              </span>
              <span>·</span>
              <span>
                Campaign:{" "}
                <Link
                  href={`/campaigns/${customer.campaign.id}`}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  {customer.campaign.name}
                </Link>
              </span>
            </div>
          </div>

          {/* Contextual Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {canManage && (
              <LogManualCallModal customerId={customer.id} customerName={customer.name} />
            )}
            <CreateFollowUpModal customerId={customer.id} customerName={customer.name} />
          </div>
        </div>
      </div>

      {/* Extracted Financial & Outcome Briefing Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#004e9f]" />
          Collections & Account Intelligence
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Loan / Outstanding
            </span>
            <p className="mt-1 text-sm font-bold font-mono text-slate-900">
              {summary?.loanAmount ?? "Not specified"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Latest Interest
            </span>
            <p className="mt-1 text-sm font-bold">
              {summary?.interested === true ? (
                <span className="text-emerald-700">Interested</span>
              ) : summary?.interested === false ? (
                <span className="text-rose-600">Not Interested</span>
              ) : (
                <span className="text-slate-400">Unknown</span>
              )}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Callback Required
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {summary?.callbackRequired === true
                ? "Yes (Flagged)"
                : summary?.callbackRequired === false
                ? "No"
                : "None"}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Latest Call Outcome
            </span>
            <p className="mt-1 text-sm font-bold text-slate-900 capitalize truncate">
              {summary?.callOutcome ? summary.callOutcome.replace(/_/g, " ") : "No calls yet"}
            </p>
          </div>
        </div>

        {/* Next Action & Key Objection */}
        {(summary?.nextAction || summary?.keyObjection || summary?.followUpDate) && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4 text-xs space-y-2">
            {summary.nextAction && (
              <p className="text-slate-700">
                <strong className="text-slate-900">Recommended Action:</strong> {summary.nextAction}
              </p>
            )}
            {summary.followUpDate && (
              <p className="text-slate-700">
                <strong className="text-slate-900">Customer Mentioned Follow-up:</strong>{" "}
                {summary.followUpDate}
              </p>
            )}
            {summary.keyObjection && (
              <p className="text-slate-700">
                <strong className="text-slate-900">Customer Objection:</strong>{" "}
                {summary.keyObjection}
              </p>
            )}
          </div>
        )}

        {customer.notes && (
          <div className="mt-4 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <span className="font-semibold text-slate-900">Ingested Profile Notes: </span>
            {customer.notes}
          </div>
        )}
      </div>

      {/* Follow-up Tasks Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              Scheduled Follow-up Tasks ({customer.followUps.length})
            </h2>
          </div>
          <CreateFollowUpModal customerId={customer.id} customerName={customer.name} />
        </div>

        {customer.followUps.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No active follow-up tasks scheduled for this customer.
          </div>
        ) : (
          <div className="space-y-3">
            {customer.followUps.map((task) => (
              <div
                key={task.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900">{task.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${
                        task.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : task.status === "CANCELLED"
                          ? "bg-slate-100 text-slate-500 border-slate-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {task.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Priority: {task.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    Due:{" "}
                    <strong className="text-slate-800">
                      {new Date(task.dueDate).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                    {task.notes && ` — ${task.notes}`}
                  </p>
                </div>

                <div className="shrink-0">
                  <FollowUpActions
                    taskId={task.id}
                    status={task.status}
                    dueDate={task.dueDate.toISOString()}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Call History Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
          <History className="h-4 w-4 text-[#004e9f]" />
          <h2 className="text-sm font-semibold text-slate-900">
            Complete Call History ({customer.calls.length} calls)
          </h2>
        </div>

        {customer.calls.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No calls placed to this customer yet.
          </div>
        ) : (
          <div className="space-y-6">
            {customer.calls.map((call) => (
              <div
                key={call.id}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                        call.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {call.status}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                      {call.source === "MANUAL" ? "Operator Manual" : "Autonomous AI"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(call.createdAt).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <Link
                    href={`/calls/${call.id}`}
                    className="text-xs font-semibold text-[#004e9f] hover:underline"
                  >
                    View Call Details & Audio →
                  </Link>
                </div>

                {/* Call Summary */}
                {call.summary && (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                    <p className="font-semibold text-slate-900 mb-1">AI Verdict Summary:</p>
                    <p>{call.summary.summaryText}</p>
                  </div>
                )}

                {/* Audio Recording if exists */}
                {call.recordingUrl && (
                  <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <Volume2 className="h-4 w-4 text-[#004e9f]" />
                    <audio controls className="w-full h-8">
                      <source src={`/api/recordings/${call.id}`} type="audio/mpeg" />
                    </audio>
                  </div>
                )}

                {/* Conversation Turns Preview */}
                {call.transcript && call.transcript.turns.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Transcript Preview ({call.transcript.turns.length} turns)
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {call.transcript.turns.map((turn) => (
                        <div key={turn.id} className="text-xs">
                          <strong
                            className={turn.speaker === "AI" ? "text-[#004e9f]" : "text-slate-800"}
                          >
                            {turn.speaker === "AI" ? "Agent" : customer.name}:{" "}
                          </strong>
                          <span className="text-slate-600">{turn.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
