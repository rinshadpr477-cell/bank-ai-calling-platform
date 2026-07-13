import { prisma } from "@/lib/prisma";
import { checkBusinessHours } from "@/lib/businessHoursLogic";

export { checkBusinessHours };

export async function isWithinBusinessHours(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const settings = await prisma.settings.findFirst();
  if (!settings) return { allowed: true };

  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));

  return checkBusinessHours(settings.businessHoursStart, settings.businessHoursEnd, istNow);
}