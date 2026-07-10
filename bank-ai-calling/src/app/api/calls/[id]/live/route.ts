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

  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERVISOR") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const call = await prisma.call.findUnique({
    where: { id },
    select: {
      status: true,
      startedAt: true,
      endedAt: true,
      transcript: {
        select: {
          turns: {
            orderBy: { spokenAt: "asc" },
            select: { id: true, speaker: true, text: true, spokenAt: true },
          },
        },
      },
    },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json({
    status: call.status,
    startedAt: call.startedAt,
    endedAt: call.endedAt,
    turns: call.transcript?.turns ?? [],
  });
}