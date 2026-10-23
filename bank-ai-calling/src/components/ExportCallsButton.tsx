"use client";

import { Download } from "lucide-react";

interface CallExportRow {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  campaignName: string;
  source: string;
  status: string;
  durationSeconds: number;
  callOutcome?: string | null;
  sentiment?: string | null;
  callbackRequired?: boolean | null;
}

export function ExportCallsButton({ calls }: { calls: CallExportRow[] }) {
  function handleExport() {
    if (calls.length === 0) return;

    const headers = [
      "Call ID",
      "Date & Time",
      "Customer Name",
      "Customer Phone",
      "Campaign",
      "Call Source",
      "Call Status",
      "Duration (s)",
      "Outcome Verdict",
      "Sentiment",
      "Callback Required",
    ];

    const rows = calls.map((c) => [
      `"${c.id}"`,
      `"${new Date(c.createdAt).toLocaleString("en-US")}"`,
      `"${c.customerName.replace(/"/g, '""')}"`,
      `"${c.customerPhone}"`,
      `"${c.campaignName.replace(/"/g, '""')}"`,
      `"${c.source}"`,
      `"${c.status}"`,
      c.durationSeconds,
      `"${(c.callOutcome || "").replace(/"/g, '""')}"`,
      `"${c.sentiment || ""}"`,
      c.callbackRequired ? "Yes" : "No",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `bank_calling_crm_calls_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <button
      onClick={handleExport}
      disabled={calls.length === 0}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
      title="Export currently loaded calls to CSV"
    >
      <Download className="h-3.5 w-3.5 text-slate-500" />
      Export to CSV
    </button>
  );
}
