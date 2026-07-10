import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/rbac";


const CAN_MANAGE_CAMPAIGNS = ["ADMIN", "SUPERVISOR"];

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPERVISOR", "AGENT"]);

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { customers: true, calls: true } },
        createdBy: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(CAN_MANAGE_CAMPAIGNS);
    const body = await req.json();
    const { name, aiPrompt, language, voice } = body;

    if (!name || !aiPrompt) {
      return NextResponse.json(
        { error: "Campaign name and AI prompt are required" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({ data: {name, aiPrompt,language: language || "en",voice: voice || "default",createdById: session.user.id,},});

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}