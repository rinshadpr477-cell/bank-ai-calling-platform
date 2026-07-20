"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

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

    toast.loading("Uploading and validating your CSV...", { id: "upload-toast" });

    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/campaigns/${campaignId}/upload`, { method: "POST", body: formData });
    setLoading(false);

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Upload failed.", { id: "upload-toast" });
      return;
    }
    setResult(data);
    if (data.rejected.length > 0) {
      toast.warning(`Imported ${data.inserted} of ${data.totalRows} rows — ${data.rejected.length} rejected.`, { id: "upload-toast" });
    } else {
      toast.success(`Imported all ${data.inserted} rows successfully.`, { id: "upload-toast" });
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full">
        <h1 className="mb-1 text-2xl font-semibold text-[#132B23]">
          Upload Customer CSV
        </h1>
        <p className="mb-2 text-sm text-[#5E775E]">
          Required columns: <code>Name</code>, <code>Phone Number</code>, <code>Email</code>, <code>Language</code>, <code>Notes</code>
        </p>
        
        <a href="/sample-customers.csv" download className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#132B23] underline transition-colors hover:text-[#5E775E]">⬇ Download sample CSV</a>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8 shadow-sm">
          <input type="file" accept=".csv" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-[#132B23] file:mr-4 file:rounded-md file:border-0 file:bg-[#132B23] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#E9E0CF] file:transition-colors hover:file:bg-[#5E775E]"/>

          <button type="submit" disabled={loading || !file} className="w-full rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
            {loading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-4">
            <p className="text-sm text-[#132B23]">
              <strong>{result.inserted}</strong> of <strong>{result.totalRows}</strong> rows imported successfully.
            </p>

            {result.rejected.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-700">
                  {result.rejected.length} row(s) rejected:
                </p>
                <ul className="mt-1 space-y-1 text-sm text-red-600">
                  {result.rejected.map((r, i) => (
                    <li key={i}>
                      Row {r.row > 0 ? r.row : "?"}: {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => router.push(`/campaigns/${campaignId}`)} className="mt-4 text-sm font-medium text-[#132B23] underline transition-colors hover:text-[#5E775E]">
              Back to campaign
            </button>
          </div>
        )}
      </div>
    </div>
  );
}