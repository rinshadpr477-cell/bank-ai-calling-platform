export function checkBusinessHours(
  businessHoursStart: string,
  businessHoursEnd: string,
  nowIST: Date
): { allowed: boolean; reason?: string } {
  const nowMinutes = nowIST.getHours() * 60 + nowIST.getMinutes();
  const [startH, startM] = businessHoursStart.split(":").map(Number);
  const [endH, endM] = businessHoursEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (nowMinutes < startMinutes || nowMinutes >= endMinutes) {
    return {
      allowed: false,
      reason: `Outside business hours (${businessHoursStart}–${businessHoursEnd} IST)`,
    };
  }
  return { allowed: true };
}