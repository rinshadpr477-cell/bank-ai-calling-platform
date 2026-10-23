"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Search,
  PhoneCall,
  Users,
  ArrowRight,
  Megaphone,
  Loader2,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  language?: string;
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
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Voice Campaigns
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage automated customer outreach, KYC verification, recovery, and loan follow-ups.
          </p>
        </div>

        {canCreate && (
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-[#004e9f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns by name..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:bg-white focus:ring-2 focus:ring-[#004e9f]/20"
          />
        </div>

        <div className="text-xs font-medium text-slate-500">
          Showing <span className="font-semibold text-slate-900">{filtered.length}</span> of{" "}
          <span className="font-semibold text-slate-900">{campaigns.length}</span> campaigns
        </div>
      </div>

      {/* Content State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#004e9f]" />
          <p className="mt-3 text-sm font-medium text-slate-600">Loading voice campaigns...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#004e9f]">
            <Megaphone className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            {search ? `No campaigns matching "${search}"` : "No campaigns created yet"}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {search
              ? "Try adjusting your search criteria or clear the query to see all campaigns."
              : "Set up a new voice campaign with custom instructions to begin placing autonomous outbound calls."}
          </p>
          {canCreate && !search && (
            <div className="mt-6">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#003d7c]"
              >
                <Plus className="h-4 w-4" />
                Create First Campaign
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const statusBadgeClass =
              c.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : c.status === "COMPLETED"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <Link
                key={c.id}
                href={`/campaigns/${c.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:border-[#004e9f]/50 hover:shadow-md active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-base text-slate-900 group-hover:text-[#004e9f] transition-colors line-clamp-1">
                      {c.name}
                    </h2>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${statusBadgeClass}`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        <strong className="font-semibold text-slate-900">{c._count.customers}</strong>{" "}
                        Contacts
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        <strong className="font-semibold text-slate-900">{c._count.calls}</strong>{" "}
                        Calls Placed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between pt-2">
                  <span className="text-xs font-medium text-slate-400 group-hover:text-slate-600">
                    Open campaign & reports
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all group-hover:bg-[#004e9f] group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}