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
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    summaryText,
    sentiment,
    interested,
    loanAmount,
    callbackRequired,
    callOutcome,
    keyObjection,
    nextAction,
    followUpDate,
    priority,
  } = body;

  if (!summaryText) {
    return NextResponse.json({ error: "summaryText is required" }, { status: 400 });
  }

  const existingCall = await prisma.call.findUnique({ where: { id: callId } });
  if (!existingCall) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  const data = {
    summaryText,
    sentiment,
    interested,
    loanAmount,
    callbackRequired,
    callOutcome,
    keyObjection,
    nextAction,
    followUpDate,
    priority,
  };

  try {
    const summary = await prisma.callSummary.upsert({
      where: { callId },
      update: data,
      create: { callId, ...data },
    });

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Error saving call summary:", err);
    return NextResponse.json({ error: "Failed to save call summary" }, { status: 500 });
  }
}