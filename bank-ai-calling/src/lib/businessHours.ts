import { prisma } from "@/lib/prisma";

export async function isWithinBusinessHours(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const settings = await prisma.settings.findFirst();

  if (!settings) return { allowed: true };

  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const nowMinutes = istNow.getHours() * 60 + istNow.getMinutes();

  const [startH, startM] = settings.businessHoursStart.split(":").map(Number);
  const [endH, endM] = settings.businessHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (nowMinutes < startMinutes || nowMinutes >= endMinutes) {
    return {
      allowed: false,
      reason: `Outside business hours (${settings.businessHoursStart}–${settings.businessHoursEnd} IST)`,
    };
  }

  return { allowed: true };
}