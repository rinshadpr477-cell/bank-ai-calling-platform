"use client";

import { useEffect, useState } from "react";
import { Bot, User, Clock, CheckCircle2 } from "lucide-react";

type Line = { speaker: "AI" | "Customer"; text: string };

const SCRIPT: Line[] = [
  { speaker: "AI", text: "Hi, this is Priya calling from the bank. Am I speaking with Rahul?" },
  { speaker: "Customer", text: "Yes, speaking." },
  { speaker: "AI", text: "You have a pre-approved personal loan at 10.5% interest — up to ₹5,00,000, disbursed the same day. Interested?" },
  { speaker: "Customer", text: "Sure, tell me more." },
  { speaker: "AI", text: "I can have our loan officer call you back tomorrow morning. Does that work?" },
  { speaker: "Customer", text: "Yes, that works." },
];

export function LiveCallDemo() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (visibleLines >= SCRIPT.length) {
      const t = setTimeout(() => setShowSummary(true), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleLines((n) => n + 1), 1400);
    return () => clearTimeout(t);
  }, [visibleLines]);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl overflow-hidden font-sans">
      {/* Top Call Status Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-[11px] font-mono tracking-wider text-slate-300 uppercase">
            LIVE CALL · Loan Outreach
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          {mm}:{ss}
        </div>
      </div>

      {/* Conversation Area */}
      <div className="space-y-3.5 p-5 min-h-[220px]">
        {SCRIPT.slice(0, visibleLines).map((line, i) => {
          const isAI = line.speaker === "AI";
          return (
            <div key={i} className="animate-fade-in flex gap-2.5 items-start">
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isAI
                    ? "bg-[#004e9f] text-white"
                    : "bg-slate-700 text-slate-200"
                }`}
              >
                {isAI ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
                  {isAI ? "Agent (Priya)" : "Customer (Rahul)"}
                </span>
                <p className="text-xs text-slate-100 leading-relaxed bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                  {line.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Extracted Verdict Summary Bar */}
      {showSummary && (
        <div className="animate-fade-in border-t border-slate-800 bg-slate-950/80 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Extracted Real-Time Verdict</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
              Verdict: Interested
            </span>
            <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-300 border border-blue-500/30">
              Callback: Tomorrow AM
            </span>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium text-slate-300 border border-slate-700">
              Sentiment: Positive
            </span>
          </div>
        </div>
      )}
    </div>
  );
}