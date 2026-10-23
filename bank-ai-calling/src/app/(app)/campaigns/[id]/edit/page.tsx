"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { newCampaignSchema, NewCampaignFormData } from "@/lib/validation/campaignSchemas";
import {
  ArrowLeft,
  Bot,
  HelpCircle,
  Loader2,
  Save,
} from "lucide-react";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewCampaignFormData>({
    resolver: zodResolver(newCampaignSchema),
  });

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
        const campaign = data.campaigns?.find((c: { id: string }) => c.id === campaignId);
        if (campaign) {
          reset({ name: campaign.name, aiPrompt: campaign.aiPrompt, language: campaign.language });
        }
      })
      .finally(() => setLoading(false));
  }, [campaignId, reset]);

  async function onSubmit(data: NewCampaignFormData) {
    const res = await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const responseData = await res.json().catch(() => ({}));
      toast.error(responseData.error ?? "Something went wrong.");
      return;
    }
    toast.success("Campaign updated successfully.");
    router.push(`/campaigns/${campaignId}`);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#004e9f]" />
        <p className="mt-3 text-sm font-medium text-slate-600">Loading campaign configuration...</p>
      </div>
    );
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
          Back to Campaign Details
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Edit Campaign
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Update campaign title, conversational agent prompts, and language configuration.
        </p>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Campaign Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            {...register("name")}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Bot className="h-4 w-4 text-[#004e9f]" />
              AI Agent Prompt & Compliance Guidelines <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {"{{customer_data}}"} injected automatically
            </span>
          </div>
          <textarea
            rows={10}
            {...register("aiPrompt")}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20 leading-relaxed"
          />
          {errors.aiPrompt && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.aiPrompt.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1.5">
            Default Language
          </label>
          <select
            {...register("language")}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          >
            <option value="en">English (India / Global)</option>
            <option value="hi">Hindi (हिंदी)</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => router.push(`/campaigns/${campaignId}`)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}