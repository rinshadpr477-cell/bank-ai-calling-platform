import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalRequest } from "@/lib/internalAuth";
import { isWithinBusinessHours } from "@/lib/businessHours";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalRequest(req);
  if (authError) return authError;

  const { id: campaignId } = await params;
  const hoursCheck = await isWithinBusinessHours();

  if (!hoursCheck.allowed) {
    return NextResponse.json(
      { error: "OUTSIDE_BUSINESS_HOURS", detail: hoursCheck.reason },
      { status: 423 }
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return { error: "Campaign not found" as const };
    let billingAccount = await tx.billingAccount.findFirst();
    if (!billingAccount) {
      billingAccount = await tx.billingAccount.create({ data: {} });
    }
    const overFreeLimit =
      billingAccount.subscriptionStatus === "FREE" &&
      billingAccount.freeCallsUsed >= billingAccount.freeCallsLimit;
    if (overFreeLimit) {
      return { error: "CREDIT_LIMIT_REACHED" as const };
    }
    const customer = await tx.customer.findFirst({
      where: { campaignId, status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!customer) return { done: true as const };

    await tx.customer.update({
      where: { id: customer.id },
      data: { status: "CALLED" },
    });
    const call = await tx.call.create({
      data: { campaignId, customerId: customer.id, status: "QUEUED" },
    });

    if (campaign.status === "DRAFT") {
      await tx.campaign.update({ where: { id: campaignId }, data: { status: "ACTIVE" } });
    }

    return {
      call: { id: call.id },
      customer: {
        id: customer.id,
        name: customer.name,
        phoneNumber: customer.phoneNumber,
        language: customer.language,
      },
      campaign: {
        name: campaign.name,
        aiPrompt: campaign.aiPrompt,
        voice: campaign.voice,
      },
    };
  }, {
    maxWait: 10000,
    timeout: 10000,
  });

  if ("error" in result) {
    const status =
      result.error === "CREDIT_LIMIT_REACHED" ? 423 : 404;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}