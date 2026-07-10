"use client";

import { useEffect, useState } from "react";

interface Turn { id: string; speaker: "AI" | "CUSTOMER";text: string;spokenAt: string;}

interface LiveData {status: string;startedAt: string | null;endedAt: string | null; turns: Turn[];}

const TERMINAL_STATUSES = ["COMPLETED", "FAILED", "NO_ANSWER"];

export function LiveCallMonitor({ callId, initialStatus }: { callId: string; initialStatus: string }) {
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
  if (TERMINAL_STATUSES.includes(data.status)) return null; // page's own summary section handles the finished view

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="rounded-lg border border-[#5E775E] bg-[#5E775E]/10 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#5E775E]" />
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wide text-[#132B23]">
            Live — {data.status}
          </span>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-xs text-[#5E775E]">
          {mm}:{ss}
        </span>
      </div>

      {data.turns.length === 0 ? (
        <p className="mt-3 text-sm text-[#5E775E]">
          Waiting for conversation to begin...
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {data.turns.map((turn) => (
            <p key={turn.id} className="text-sm">
              <span className="font-medium text-[#132B23]">
                {turn.speaker === "AI" ? "Agent" : "Customer"}:
              </span>{" "}
              <span className="text-[#132B23]/80">{turn.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}