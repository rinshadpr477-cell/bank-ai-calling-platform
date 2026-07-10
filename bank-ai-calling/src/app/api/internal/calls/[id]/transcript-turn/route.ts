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
  const { speaker, text } = await req.json();

  if (!speaker || !text) {
    return NextResponse.json({ error: "speaker and text are required" }, { status: 400 });
  }

  const transcript = await prisma.transcript.upsert({
    where: { callId },
    update: {},
    create: { callId },
  });

  const turn = await prisma.transcriptTurn.create({data: {transcriptId: transcript.id,speaker,text,},});

  return NextResponse.json({ turn });
}