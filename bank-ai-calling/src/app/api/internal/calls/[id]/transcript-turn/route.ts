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

  const { speaker, text } = body;
  if (!speaker || !text) {
    return NextResponse.json({ error: "speaker and text are required" }, { status: 400 });
  }

  const existingCall = await prisma.call.findUnique({ where: { id: callId } });
  if (!existingCall) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  try {
    const transcript = await prisma.transcript.upsert({
      where: { callId },
      update: {},
      create: { callId },
    });

    const turn = await prisma.transcriptTurn.create({
      data: {
        transcriptId: transcript.id,
        speaker,
        text,
      },
    });

    return NextResponse.json({ turn });
  } catch (err) {
    console.error("Error creating transcript turn:", err);
    return NextResponse.json({ error: "Failed to save transcript turn" }, { status: 500 });
  }
}