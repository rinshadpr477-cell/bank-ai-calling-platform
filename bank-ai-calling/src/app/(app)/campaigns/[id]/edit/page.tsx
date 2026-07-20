"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { newCampaignSchema, NewCampaignFormData } from "@/lib/validation/campaignSchemas";

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [loading, setLoading] = useState(true);

  const {register,handleSubmit,reset,formState: { errors, isSubmitting },} = useForm<NewCampaignFormData>({
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
    toast.success("Campaign updated.");
    router.push(`/campaigns/${campaignId}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
        <p className="text-sm text-[#5E775E]">Loading campaign...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full">
        <h1 className="mb-6 text-2xl font-semibold text-[#132B23]">
          Edit Campaign
        </h1>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-[#132B23]">
              Campaign Name
            </label>
            <input type="text" {...register("name")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#132B23]">
              Bank Suggestion
            </label>
            <textarea
              rows={10}
              {...register("aiPrompt")}
              className="mt-1 max-h-72 w-full resize-y overflow-y-auto rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"
            />
            {errors.aiPrompt && (
              <p className="mt-1 text-xs text-red-600">{errors.aiPrompt.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#132B23]">
              Language
            </label>
            <select {...register("language")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]">
              <option value="en">English</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.push(`/campaigns/${campaignId}`)} className="rounded-md border border-[#BA9B5F]/40 px-4 py-2.5 text-sm font-medium text-[#132B23] transition-colors hover:bg-[#BA9B5F]/10">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}