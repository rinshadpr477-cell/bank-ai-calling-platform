"use client";

import { FileSpreadsheet } from "lucide-react";

interface Row {
  name: string;
  phone: string;
  status: string;
  callStatus: string;
  interested: string;
  sentiment: string;
  loanAmount: string;
  callbackRequired: string;
  summaryText: string;
}

export function ExportExcelButton({ rows, filename }: { rows: Row[]; filename: string }) {
  async function handleExport() {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Results");

    worksheet.columns = [
      { header: "Name", key: "name", width: 20 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Call Status", key: "callStatus", width: 14 },
      { header: "Interested", key: "interested", width: 12 },
      { header: "Sentiment", key: "sentiment", width: 12 },
      { header: "Loan Amount", key: "loanAmount", width: 16 },
      { header: "Callback Required", key: "callbackRequired", width: 16 },
      { header: "Summary", key: "summaryText", width: 50 },
    ];

    worksheet.getRow(1).font = { bold: true };

    rows.forEach((r) => {
      const row = worksheet.addRow({
        name: r.name,
        phone: r.phone,
        callStatus: r.callStatus,
        interested: r.interested,
        sentiment: r.sentiment,
        loanAmount: r.loanAmount,
        callbackRequired: r.callbackRequired,
        summaryText: r.summaryText,
      });

      if (r.interested === "Yes") {
        row.getCell("interested").font = { color: { argb: "FF15803D" }, bold: true };
      } else if (r.interested === "No") {
        row.getCell("interested").font = { color: { argb: "FFDC2626" }, bold: true };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
    >
      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
      Export Excel (.xlsx)
    </button>
  );
}