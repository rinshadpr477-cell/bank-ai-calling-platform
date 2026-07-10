import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getOrCreateSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        defaultAiPrompt: "You are a professional bank representative. Introduce yourself, explain the offering clearly, and be respectful of the customer's time.",
      },
    });
  }
  return settings;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getOrCreateSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — Admin access required" }, { status: 403 });
  }

  const body = await req.json();
  const { defaultAiPrompt,defaultVoice,defaultLanguage,defaultRetryAttempts,businessHoursStart,businessHoursEnd,webhookUrl,} = body;

  if (!defaultAiPrompt || typeof defaultAiPrompt !== "string") {
    return NextResponse.json({ error: "defaultAiPrompt is required" }, { status: 400 });
  }

  const current = await getOrCreateSettings();

  const settings = await prisma.settings.update({
    where: { id: current.id },
    data: {
      defaultAiPrompt,
      defaultVoice: defaultVoice || "default",
      defaultLanguage: defaultLanguage || "en",
      defaultRetryAttempts:
        typeof defaultRetryAttempts === "number" ? defaultRetryAttempts : current.defaultRetryAttempts,
      businessHoursStart: businessHoursStart || current.businessHoursStart,
      businessHoursEnd: businessHoursEnd || current.businessHoursEnd,
      webhookUrl: webhookUrl || null,
    },
  });

  return NextResponse.json({ settings });
}