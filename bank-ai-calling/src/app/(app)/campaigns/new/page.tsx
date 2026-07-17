"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { newCampaignSchema, NewCampaignFormData } from "@/lib/validation/campaignSchemas";

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
  { value: "", label: "— Choose a suggestion to start from (optional) —" },
  { value: "kyc", label: "KYC Verification" },
  { value: "loanFollowUp", label: "Loan Follow-up" },
  { value: "emiReminder", label: "EMI / Payment Reminder" },
  { value: "recovery", label: "Recovery / Collection Call" },
  { value: "fdRenewal", label: "Fixed Deposit (FD) Renewal" },
  { value: "complaint", label: "Complaint & Customer Support" },
  { value: "promotional", label: "Promotional / New Scheme Offer" },
];

export default function NewCampaignPage() {
  const router = useRouter();

  const {register,handleSubmit,setValue,formState: { errors, isSubmitting },} = useForm<NewCampaignFormData>({
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
              Bank Suggestion
            </label>

            <select
              onChange={(e) => handleTemplateSelect(e.target.value)}
              defaultValue=""
              className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E]"
            >
              {TEMPLATE_LABELS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[#5E775E]">
              Picking a suggestion fills in a starting template below — edit it freely, including the {"{{customer_data}}"} section, before creating the campaign.
            </p>

            <textarea
              rows={10}
              {...register("aiPrompt")}
              placeholder="You are an SBI loan officer. Introduce yourself. Explain the loan scheme..."
              className="mt-3 max-h-72 w-full resize-y overflow-y-auto rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"
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

          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
            {isSubmitting ? "Creating..." : "Create Campaign"}
          </button>
        </form>
      </div>
    </div>
  );
}