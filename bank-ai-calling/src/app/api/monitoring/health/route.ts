import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = performance.now();
  let dbStatus = "healthy";

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
  } catch {
    dbStatus = "down";
  }

  const latencyMs = Math.round(performance.now() - start);
  const overallHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: overallHealthy ? "healthy" : "degraded",
      service: "bank-ai-calling-platform",
      uptimeSeconds: Math.round(process.uptime()),
      database: dbStatus,
      latencyMs,
      timestamp: new Date().toISOString(),
    },
    { status: overallHealthy ? 200 : 503 }
  );
}
