"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, SettingsFormInput, SettingsFormOutput } from "@/lib/validation/campaignSchemas";

export function SettingsForm({ initial }: { initial: SettingsFormInput }) {
  const {register,handleSubmit,formState: { errors, isSubmitting },} = useForm<SettingsFormInput, unknown, SettingsFormOutput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: SettingsFormOutput) {
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) {
      const responseData = await res.json().catch(() => ({}));
      toast.error(responseData.error ?? "Failed to save");
      return;
    }
    toast.success("Settings saved.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8 shadow-sm">
      <div>
        <label className="block text-sm font-medium text-[#132B23]">
          Default AI Prompt
        </label>
        <textarea rows={5} {...register("defaultAiPrompt")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]"/>
        {errors.defaultAiPrompt && (
          <p className="mt-1 text-xs text-red-600">{errors.defaultAiPrompt.message}</p>
        )}
        <p className="mt-1 text-xs text-[#5E775E]">
          Used as a starting point for new campaigns — individual campaigns can override this.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Default Voice
          </label>
          <select {...register("defaultVoice")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]">
            <option value="default">Default (Aoede)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Default Language
          </label>
          <select {...register("defaultLanguage")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]">
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#132B23]">
          Default Retry Attempts
        </label>
        <input type="number" min={0} max={5} {...register("defaultRetryAttempts")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]"/>
        {errors.defaultRetryAttempts && (
          <p className="mt-1 text-xs text-red-600">{errors.defaultRetryAttempts.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Business Hours Start
          </label>
          <input type="time" {...register("businessHoursStart")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]"/>
          {errors.businessHoursStart && (
            <p className="mt-1 text-xs text-red-600">{errors.businessHoursStart.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Business Hours End
          </label>
          <input type="time" {...register("businessHoursEnd")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]"/>
          {errors.businessHoursEnd && (
            <p className="mt-1 text-xs text-red-600">{errors.businessHoursEnd.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#132B23]">
          Webhook URL (optional)
        </label>
        <input type="url" placeholder="https://your-system.example.com/webhook" {...register("webhookUrl")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]"/>
        {errors.webhookUrl && (
          <p className="mt-1 text-xs text-red-600">{errors.webhookUrl.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
        {isSubmitting ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}