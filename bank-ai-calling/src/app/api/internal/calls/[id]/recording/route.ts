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

  const { recordingUrl } = body;
  if (!recordingUrl) {
    return NextResponse.json({ error: "recordingUrl is required" }, { status: 400 });
  }

  const existingCall = await prisma.call.findUnique({ where: { id: callId } });
  if (!existingCall) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  try {
    const call = await prisma.call.update({
      where: { id: callId },
      data: { recordingUrl },
    });

    return NextResponse.json({ call });
  } catch (err) {
    console.error("Error updating recording URL:", err);
    return NextResponse.json({ error: "Failed to update recording" }, { status: 500 });
  }
}