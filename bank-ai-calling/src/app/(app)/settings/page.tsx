import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        defaultAiPrompt:
          "You are a professional bank representative. Introduce yourself, explain the offering clearly, and be respectful of the customer's time.",
      },
    });
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure platform-wide voice synthesizer defaults, telephony retry policies, calling windows, and outbound webhook endpoints.
        </p>
      </div>

      <SettingsForm
        initial={{
          defaultAiPrompt: settings.defaultAiPrompt,
          defaultVoice: settings.defaultVoice,
          defaultLanguage: settings.defaultLanguage as "en" | "hi",
          defaultRetryAttempts: settings.defaultRetryAttempts,
          businessHoursStart: settings.businessHoursStart,
          businessHoursEnd: settings.businessHoursEnd,
          webhookUrl: settings.webhookUrl ?? "",
        }}
      />
    </div>
  );
}