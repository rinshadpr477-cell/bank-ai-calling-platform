import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: callId } = await params;

  const call = await prisma.call.findUnique({
    where: { id: callId },
    select: {
      recordingUrl: true,
      campaign: {
        select: { createdById: true },
      },
    },
  });

  if (!call?.recordingUrl) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  // Authorization: Only ADMIN, SUPERVISOR, or the user who created the campaign can access recordings
  const userRole = session.user.role;
  const isPrivileged = userRole === "ADMIN" || userRole === "SUPERVISOR";
  const isOwner = call.campaign?.createdById === session.user.id;

  if (!isPrivileged && !isOwner) {
    return NextResponse.json({ error: "Forbidden — You do not have permission to access this recording" }, { status: 403 });
  }

  // SSRF guard: Ensure recordingUrl originates strictly from Twilio
  try {
    const parsedRecordingUrl = new URL(call.recordingUrl);
    if (parsedRecordingUrl.hostname !== "api.twilio.com") {
      return NextResponse.json({ error: "Invalid recording source" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid recording URL" }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID_PROXY || "";
  const authToken = process.env.TWILIO_AUTH_TOKEN_PROXY || "";
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const twilioResponse = await fetch(call.recordingUrl, {
    headers: { Authorization: `Basic ${credentials}` },
  });

  if (!twilioResponse.ok || !twilioResponse.body) {
    const errorText = await twilioResponse.text().catch(() => "");
    console.error(`[Recordings] Twilio fetch failed: status=${twilioResponse.status} body=${errorText}`);
    return NextResponse.json({ error: "Failed to fetch recording from Twilio" }, { status: 502 });
  }

  return new NextResponse(twilioResponse.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}