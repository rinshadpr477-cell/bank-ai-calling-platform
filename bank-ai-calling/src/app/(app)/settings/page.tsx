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
    <div className="min-h-screen w-full bg-[#E9E0CF] p-8">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[#132B23]">Settings</h1>
        <p className="mt-1 text-sm text-[#5E775E]">
          Platform-wide defaults. Individual campaigns can override the prompt, voice, and language.
        </p>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <SettingsForm initial={{defaultAiPrompt: settings.defaultAiPrompt,defaultVoice: settings.defaultVoice,defaultLanguage: settings.defaultLanguage as "en" | "hi",defaultRetryAttempts: settings.defaultRetryAttempts,businessHoursStart: settings.businessHoursStart,businessHoursEnd: settings.businessHoursEnd,webhookUrl: settings.webhookUrl ?? "",}}/>
      </div>
    </div>
  );
}