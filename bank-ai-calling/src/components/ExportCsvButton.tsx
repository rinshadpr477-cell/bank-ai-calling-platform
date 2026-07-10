"use client";

interface Row {name: string;phone: string;status: string;callStatus: string;interested: string;sentiment: string;loanAmount: string;callbackRequired: string;summaryText: string;}

export function ExportCsvButton({ rows, filename }: { rows: Row[]; filename: string }) {
  function handleExport() {
    const headers = ["Name","Phone","Call Status","Interested","Sentiment","Loan Amount","Callback Required","Summary",];

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.name,
          r.phone,
          r.callStatus,
          r.interested,
          r.sentiment,
          r.loanAmount,
          r.callbackRequired,
          r.summaryText,
        ]
          .map(escapeCsv)
          .join(",")
      ),
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={handleExport}className="rounded-md bg-[#132B23] px-4 py-2 text-sm font-medium text-[#E9E0CF] hover:bg-[#5E775E]">
      Export CSV
    </button>
  );
}