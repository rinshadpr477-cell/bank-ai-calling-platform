"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { newCampaignSchema, NewCampaignFormData } from "@/lib/validation/campaignSchemas";
import {
  ArrowLeft,
  Sparkles,
  Bot,
  HelpCircle,
  Loader2,
  FileText,
} from "lucide-react";

const BANK_SUGGESTION_TEMPLATES: Record<string, string> = {
  kyc: `You are an AI Voice Agent for a Cooperative Bank.
Conduct a professional KYC verification call.

Customer Data:
{{customer_data}}

Instructions:
- Greet the customer.
- Verify you are speaking to the correct person.
- Inform them that their KYC needs to be updated.
- Explain why KYC is mandatory.
- Tell them the required documents (if provided).
- Ask when they can visit the branch.
- Answer only using the provided data.
- Never ask for OTP, PIN, CVV, or password.
- End politely.`,

  loanFollowUp: `You are an AI Voice Agent for a Cooperative Bank.
Conduct a loan follow-up call.

Customer Data:
{{customer_data}}

Instructions:
- Greet the customer.
- Verify identity.
- Explain the purpose of the call.
- Discuss loan status, pending documents, or next steps using only the provided data.
- Answer customer questions naturally.
- Offer branch assistance if needed.
- End professionally.`,

  emiReminder: `You are an AI Voice Agent for a Cooperative Bank.
Conduct an EMI reminder call.

Customer Data:
{{customer_data}}

Instructions:
- Greet the customer.
- Inform them about the EMI amount and due date.
- Politely remind them to make the payment.
- If they already paid, thank them and say records will update after verification.
- Never pressure or threaten the customer.
- End politely.`,

  recovery: `You are an AI Voice Agent for a Cooperative Bank.
Conduct a respectful recovery call.

Customer Data:
{{customer_data}}

Instructions:
- Be calm and empathetic.
- Explain the outstanding amount.
- Ask if there is any difficulty in making payment.
- Offer to connect them with the branch for repayment options.
- Never argue, threaten, or use rude language.
- End respectfully.`,

  fdRenewal: `You are an AI Voice Agent for a Cooperative Bank.
Conduct an FD renewal reminder call.

Customer Data:
{{customer_data}}

Instructions:
- Inform the customer that their FD is maturing or has matured.
- Mention the maturity date and amount.
- Explain renewal benefits if provided.
- Invite them to visit the branch.
- Answer questions only from available data.
- End politely.`,

  complaint: `You are an AI Voice Agent for a Cooperative Bank.
Conduct a complaint follow-up call.

Customer Data:
{{customer_data}}

Instructions:
- Greet the customer.
- Apologize for the inconvenience.
- Inform them about the complaint status.
- Explain the next steps if available.
- Be patient and empathetic.
- Offer further assistance.
- End politely.`,

  promotional: `You are an AI Voice Agent for a Cooperative Bank.
Conduct a promotional call.

Customer Data:
{{customer_data}}

Instructions:
- Greet the customer.
- Introduce the bank's new scheme or offer.
- Explain the key benefits in simple language.
- Answer questions using only the provided information.
- Ask if they are interested in knowing more or visiting the branch.
- Never make false promises or guarantee approval.
- Thank the customer before ending the call.`,
};

const TEMPLATE_LABELS: { value: string; label: string }[] = [
  { value: "", label: "— Choose a suggestion template (optional) —" },
  { value: "kyc", label: "KYC Verification & Document Update" },
  { value: "loanFollowUp", label: "Loan Follow-up & Pending Documents" },
  { value: "emiReminder", label: "EMI / Payment Reminder" },
  { value: "recovery", label: "Recovery & Debt Rehabilitation" },
  { value: "fdRenewal", label: "Fixed Deposit (FD) Renewal Reminder" },
  { value: "complaint", label: "Complaint & Grievance Follow-up" },
  { value: "promotional", label: "Promotional / Special Deposit Scheme" },
];

export default function NewCampaignPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewCampaignFormData>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: { language: "en" },
  });

  function handleTemplateSelect(key: string) {
    if (!key) return;
    const template = BANK_SUGGESTION_TEMPLATES[key];
    if (template) {
      setValue("aiPrompt", template, { shouldValidate: true, shouldDirty: true });
    }
  }

  async function onSubmit(data: NewCampaignFormData) {
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const responseData = await res.json().catch(() => ({}));
      toast.error(responseData.error ?? "Something went wrong.");
      return;
    }
    const { campaign } = await res.json();
    toast.success("Campaign created successfully.");
    router.push(`/campaigns/${campaign.id}`);
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#004e9f] transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Create New Campaign
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure autonomous agent instructions, prompt personality, and target language.
        </p>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm space-y-6"
      >
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-900">
            Campaign Name <span className="text-rose-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">
            A clear internal identifier for this outreach cohort.
          </p>
          <input
            type="text"
            {...register("name")}
            placeholder="e.g. Home Loan Rate Reduction Cohort — Q4"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          />
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>
          )}
        </div>

        {/* Suggestion Template Quick-Select */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-[#004e9f]" />
            <label className="text-xs font-semibold uppercase tracking-wider text-[#004e9f]">
              Banking Template Suggestions
            </label>
          </div>
          <p className="text-xs text-slate-600 mb-2.5">
            Select an enterprise template to populate standard compliance instructions, or author your own from scratch.
          </p>
          <select
            onChange={(e) => handleTemplateSelect(e.target.value)}
            defaultValue=""
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          >
            {TEMPLATE_LABELS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* AI Prompt / Instructions */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Bot className="h-4 w-4 text-[#004e9f]" />
              AI Agent Prompt & Compliance Instructions <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              Use {"{{customer_data}}"} for dynamic injection
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-2">
            The AI representative will strictly follow these conversational guidelines during live voice interaction.
          </p>
          <textarea
            rows={10}
            {...register("aiPrompt")}
            placeholder="You are an AI representative calling from Cooperative Bank..."
            className="w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20 leading-relaxed"
          />
          {errors.aiPrompt && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.aiPrompt.message}</p>
          )}
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-1">
            Primary Language
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Customer-specific language in uploaded CSV files will override this default.
          </p>
          <select
            {...register("language")}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
          >
            <option value="en">English (India / Global)</option>
            <option value="hi">Hindi (हिंदी)</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/campaigns"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-[#004e9f] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Campaign...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Create Campaign
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}