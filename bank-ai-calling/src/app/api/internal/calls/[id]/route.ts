import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalRequest } from "@/lib/internalAuth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalRequest(req);
  if (authError) return authError;

  const { id } = await params;

  const call = await prisma.call.findUnique({
    where: { id },
    include: { customer: true, campaign: true },
  });

  if (!call) {
    return NextResponse.json({ error: "Call not found" }, { status: 404 });
  }

  return NextResponse.json({
    call: { id: call.id, status: call.status },
    customer: {
      id: call.customer.id,
      name: call.customer.name,
      phoneNumber: call.customer.phoneNumber,
      language: call.customer.language,
      notes: call.customer.notes,
    },
    campaign: {
      id: call.campaign.id,
      name: call.campaign.name,
      aiPrompt: call.campaign.aiPrompt,
      voice: call.campaign.voice,
    },
  });
}