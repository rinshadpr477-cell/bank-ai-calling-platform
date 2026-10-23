"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { settingsSchema, SettingsFormInput, SettingsFormOutput } from "@/lib/validation/campaignSchemas";
import {
  Bot,
  Clock,
  RotateCcw,
  Webhook,
  Save,
  Loader2,
} from "lucide-react";

export function SettingsForm({ initial }: { initial: SettingsFormInput }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormInput, unknown, SettingsFormOutput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: initial,
  });

  async function onSubmit(data: SettingsFormOutput) {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const responseData = await res.json().catch(() => ({}));
      toast.error(responseData.error ?? "Failed to save settings");
      return;
    }
    toast.success("Platform settings saved successfully.");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* AI Persona Defaults Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#004e9f]" />
            <h2 className="text-base font-semibold text-slate-900">
              AI Persona & Language Defaults
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Baseline instructions applied when creating new outreach campaigns.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Default AI Prompt
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Base persona for all agents. Can be overridden in individual campaign configurations.
          </p>
          <textarea
            rows={5}
            {...register("defaultAiPrompt")}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20 leading-relaxed"
          />
          {errors.defaultAiPrompt && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.defaultAiPrompt.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Default Voice Model
            </label>
            <select
              {...register("defaultVoice")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
            >
              <option value="default">Default (Aoede — Warm Professional)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Default Platform Language
            </label>
            <select
              {...register("defaultLanguage")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
            >
              <option value="en">English (India / Global)</option>
              <option value="hi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Telephony & Calling Window Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#004e9f]" />
            <h2 className="text-base font-semibold text-slate-900">
              Telephony Compliance & Calling Windows
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict operating boundaries to comply with telecom regulations and Do-Not-Disturb norms.
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-1">
            <RotateCcw className="h-4 w-4 text-slate-400" />
            Max Automatic Retry Attempts
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Maximum number of redials when a call is unanswered or disconnected (0 - 5).
          </p>
          <input
            type="number"
            min={0}
            max={5}
            {...register("defaultRetryAttempts")}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          />
          {errors.defaultRetryAttempts && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.defaultRetryAttempts.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Business Hours Window Start
            </label>
            <input
              type="time"
              {...register("businessHoursStart")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
            />
            {errors.businessHoursStart && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.businessHoursStart.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-1.5">
              Business Hours Window End
            </label>
            <input
              type="time"
              {...register("businessHoursEnd")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
            />
            {errors.businessHoursEnd && (
              <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.businessHoursEnd.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Integration & Webhooks Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-[#004e9f]" />
            <h2 className="text-base font-semibold text-slate-900">
              Downstream Core Banking Webhook
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliver completed call summaries, verdicts, and callbacks to your CRM or core banking system in real time.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Outbound Webhook URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://api.yourbank.com/v1/telephony-events"
            {...register("webhookUrl")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          />
          {errors.webhookUrl && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.webhookUrl.message}</p>
          )}
        </div>
      </div>

      {/* Submit Action */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.98] disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Settings...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Platform Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}