"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  _count: { customers: number; calls: number };
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => setCampaigns(data.campaigns ?? []))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERVISOR";

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#132B23]">Campaigns</h1>
          {canCreate && (
            <Link href="/campaigns/new" className="rounded-md bg-[#132B23] px-4 py-2 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18]">
              + New Campaign
            </Link>
          )}
        </div>

        <div className="mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by name..."
            className="w-full max-w-md rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"
          />
        </div>

        {loading ? (
          <p className="text-sm text-[#5E775E]">Loading campaigns...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6] p-6 text-sm text-[#5E775E]">
            {search ? `No campaigns matching "${search}".` : "No campaigns yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="group flex flex-col rounded-xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-5 transition-colors hover:border-[#5E775E] hover:bg-[#BA9B5F]/10 active:bg-[#BA9B5F]/20">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-medium text-[#132B23]">{c.name}</h2>
                  <span className="shrink-0 rounded-full bg-[#BA9B5F]/20 px-2.5 py-0.5 text-xs font-medium text-[#132B23]">
                    {c.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[#5E775E]">
                  {c._count.customers} customers · {c._count.calls} calls
                </p>
                <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#5E775E] px-3 py-1.5 text-sm font-medium text-[#E9E0CF] transition-colors group-hover:bg-[#132B23]">
                  View campaign
                  <span aria-hidden="true">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}