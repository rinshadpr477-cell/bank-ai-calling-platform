"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { newCampaignSchema, NewCampaignFormData } from "@/lib/validation/campaignSchemas";

export default function NewCampaignPage() {
  const router = useRouter();

  const {register,handleSubmit,formState: { errors, isSubmitting },} = useForm<NewCampaignFormData>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: { language: "en" },
  });

  async function onSubmit(data: NewCampaignFormData) {
    const res = await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const responseData = await res.json().catch(() => ({}));
      toast.error(responseData.error ?? "Something went wrong.");
      return;
    }
    const { campaign } = await res.json();
    toast.success("Campaign created.");
    router.push(`/campaigns/${campaign.id}`);
  }

  return (
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full">
        <h1 className="mb-6 text-2xl font-semibold text-[#132B23]">
          New Campaign
        </h1>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-[#132B23]">
              Campaign Name
            </label>
            <input type="text" {...register("name")} placeholder="e.g. Home Loan Outreach — July" className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#132B23]">
              AI Prompt
            </label>
            <textarea rows={5} {...register("aiPrompt")} placeholder="You are an SBI loan officer. Introduce yourself. Explain the loan scheme..." className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
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

          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
            {isSubmitting ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}