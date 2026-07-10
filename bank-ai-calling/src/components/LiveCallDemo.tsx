"use client";

import { useEffect, useState } from "react";

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
    <div className="w-full max-w-md rounded-2xl border border-[#BA9B5F]/40 bg-[#F5F0E6] shadow-xl">
      <div className="flex items-center justify-between border-b border-[#BA9B5F]/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#5E775E]" />
          <span className="font-[family-name:var(--font-mono)] text-xs tracking-wide text-[#132B23]">
            LIVE CALL · Home Loan Outreach
          </span>
        </div>
        <span className="font-[family-name:var(--font-mono)] text-xs text-[#5E775E]">
          {mm}:{ss}
        </span>
      </div>

      <div className="space-y-3 px-5 py-5">
        {SCRIPT.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="animate-[fadeIn_0.4s_ease-out]">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[#BA9B5F]">
              {line.speaker}
            </p>
            <p className="mt-0.5 text-sm text-[#132B23]">{line.text}</p>
          </div>
        ))}
      </div>

      {showSummary && (
        <div className="animate-[fadeIn_0.5s_ease-out] border-t border-[#BA9B5F]/30 bg-[#132B23] px-5 py-4">
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[#BA9B5F]">
            Call Summary
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Tag label="Interested" />
            <Tag label="Callback: Tomorrow AM" />
            <Tag label="Sentiment: Positive" />
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#E9E0CF]/10 px-2.5 py-1 font-[family-name:var(--font-mono)] text-[11px] text-[#E9E0CF]">
      {label}
    </span>
  );
}