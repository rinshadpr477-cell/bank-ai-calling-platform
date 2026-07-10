import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalRequest } from "@/lib/internalAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalRequest(req);
  if (authError) return authError;

  const { id: callId } = await params;
  const { summaryText, sentiment, interested, loanAmount, callbackRequired } = await req.json();

  if (!summaryText) {
    return NextResponse.json({ error: "summaryText is required" }, { status: 400 });
  }

  const summary = await prisma.callSummary.upsert({
    where: { callId },
    update: { summaryText, sentiment, interested, loanAmount, callbackRequired },
    create: { callId, summaryText, sentiment, interested, loanAmount, callbackRequired },
  });

  return NextResponse.json({ summary });
}