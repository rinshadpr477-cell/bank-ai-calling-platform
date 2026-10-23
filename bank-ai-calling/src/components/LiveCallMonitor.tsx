"use client";

import { useEffect, useState } from "react";
import { Bot, User, Clock, Loader2 } from "lucide-react";

interface Turn {
  id: string;
  speaker: "AI" | "CUSTOMER";
  text: string;
  spokenAt: string;
}

interface LiveData {
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  turns: Turn[];
}

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "NO_ANSWER"];

export function LiveCallMonitor({
  callId,
  initialStatus,
}: {
  callId: string;
  initialStatus: string;
}) {
  const [data, setData] = useState<LiveData | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (TERMINAL_STATUSES.includes(initialStatus)) return;

    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/calls/${callId}/live`, { cache: "no-store" });
        if (!res.ok) return;
        const json: LiveData = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // network polling errors ignored
      }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [callId, initialStatus]);

  useEffect(() => {
    if (data?.status && TERMINAL_STATUSES.includes(data.status)) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [data?.status]);

  if (!data) return null;
  if (TERMINAL_STATUSES.includes(data.status)) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-xs animate-fade-in">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Live Stream — {data.status}
          </span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-blue-100">
          <Clock className="h-3 w-3 text-slate-400" />
          {mm}:{ss}
        </div>
      </div>

      {data.turns.length === 0 ? (
        <div className="py-6 text-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#004e9f] mb-2" />
          <p className="text-xs">Connecting audio stream — awaiting customer conversation turn...</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
          {data.turns.map((turn) => {
            const isAI = turn.speaker === "AI";
            return (
              <div
                key={turn.id}
                className={`flex items-start gap-2.5 text-xs ${isAI ? "justify-start" : "justify-end"}`}
              >
                {isAI && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#004e9f]">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`rounded-xl px-3.5 py-2 max-w-md ${
                    isAI
                      ? "bg-white text-slate-900 border border-slate-200/80 shadow-xs"
                      : "bg-[#004e9f] text-white"
                  }`}
                >
                  <p className={`font-semibold mb-0.5 text-[10px] ${isAI ? "text-[#004e9f]" : "text-blue-100"}`}>
                    {isAI ? "Agent" : "Customer"}
                  </p>
                  <p>{turn.text}</p>
                </div>
                {!isAI && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}