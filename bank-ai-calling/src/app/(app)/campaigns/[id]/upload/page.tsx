"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
} from "lucide-react";

interface UploadResult {
  totalRows: number;
  inserted: number;
  rejected: { row: number; reason: string }[];
}

export default function UploadCsvPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    toast.loading("Uploading and validating customer records...", { id: "upload-toast" });

    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/upload`, { method: "POST", body: formData });
      setLoading(false);

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed.", { id: "upload-toast" });
        return;
      }
      setResult(data);
      if (data.rejected.length > 0) {
        toast.warning(`Imported ${data.inserted} of ${data.totalRows} contacts — ${data.rejected.length} records rejected.`, { id: "upload-toast" });
      } else {
        toast.success(`Imported all ${data.inserted} contacts successfully.`, { id: "upload-toast" });
      }
    } catch {
      setLoading(false);
      toast.error("Network error during file upload.", { id: "upload-toast" });
    }
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/campaigns/${campaignId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#004e9f] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Campaign
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Upload Customer Records
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Import contacts via CSV. Numbers and formats are automatically validated prior to ingestion.
        </p>
      </div>

      {/* Schema Requirement Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Expected Column Schema
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Name", "Phone Number", "Email", "Language", "Notes"].map((col) => (
                <span
                  key={col}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700 border border-slate-200"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          <a
            href="/sample-customers.csv"
            download
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors shrink-0"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Download Sample CSV
          </a>
        </div>
      </div>

      {/* Upload Form Box */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition-all hover:bg-slate-50 hover:border-[#004e9f]/50">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#004e9f] mb-3">
              <UploadCloud className="h-6 w-6" />
            </div>

            <p className="text-sm font-semibold text-slate-900">
              Select CSV file to import
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Standard UTF-8 comma-separated file (.csv) up to 10MB
            </p>

            <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all">
              <span>Browse File</span>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            {file && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50/80 border border-blue-200 px-3.5 py-2 text-xs font-medium text-[#004e9f]">
                <FileSpreadsheet className="h-4 w-4" />
                <span className="font-semibold">{file.name}</span>
                <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#004e9f] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing and Ingesting Contacts...
              </>
            ) : (
              <>
                <FileCheck className="h-4 w-4" />
                Upload & Ingest Contacts
              </>
            )}
          </button>
        </form>

        {/* Validation Result Feedback */}
        {result && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 animate-fade-in">
            <div className="flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold">
                Import Complete: <span className="text-emerald-700">{result.inserted}</span> of{" "}
                {result.totalRows} contacts successfully ingested.
              </p>
            </div>

            {result.rejected.length > 0 && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                  <AlertCircle className="h-4 w-4" />
                  {result.rejected.length} row(s) failed validation and were excluded:
                </div>
                <ul className="mt-2 space-y-1 text-xs text-rose-700 max-h-48 overflow-y-auto divide-y divide-rose-100/80">
                  {result.rejected.map((r, i) => (
                    <li key={i} className="py-1">
                      <span className="font-mono font-semibold">Row {r.row > 0 ? r.row : "?"}:</span> {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={() => router.push(`/campaigns/${campaignId}`)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#004e9f] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#003d7c]"
              >
                Return to Campaign
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}