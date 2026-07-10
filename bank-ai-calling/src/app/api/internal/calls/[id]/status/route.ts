import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyInternalRequest } from "@/lib/internalAuth";
import { CallStatus } from "@/generated/prisma/client";

const VALID_STATUSES: CallStatus[] = ["RINGING", "IN_PROGRESS", "COMPLETED", "FAILED", "NO_ANSWER"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyInternalRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const { status, twilioCallSid } = body;

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const updateData: {status: CallStatus;twilioCallSid?: string; startedAt?: Date;endedAt?: Date;} = { status };

  if (twilioCallSid) updateData.twilioCallSid = twilioCallSid;
  if (status === "IN_PROGRESS") updateData.startedAt = new Date();
  if (status === "COMPLETED" || status === "FAILED" || status === "NO_ANSWER") {
    updateData.endedAt = new Date();
  }

  const call = await prisma.$transaction(async (tx) => {
    const updated = await tx.call.update({
      where: { id },
      data: updateData,
      include: { campaign: true, customer: true },
    });
    if (status === "IN_PROGRESS") {
      const existingLog = await tx.creditUsageLog.findFirst({ where: { callId: id } });
      if (!existingLog) {
        let billingAccount = await tx.billingAccount.findFirst();
        if (!billingAccount) {
          billingAccount = await tx.billingAccount.create({ data: {} });
        }
        await tx.billingAccount.update({
          where: { id: billingAccount.id },
          data: { freeCallsUsed: { increment: 1 } },
        });
        await tx.creditUsageLog.create({
          data: { billingAccountId: billingAccount.id, callId: id, creditsUsed: 1 },
        });
      }
    }
    if (status === "NO_ANSWER") {
      const attemptCount = await tx.call.count({
        where: { customerId: updated.customerId, campaignId: updated.campaignId },
      });

      const retryLimit = updated.campaign.retryCount;

      if (attemptCount < retryLimit) {
        await tx.customer.update({
          where: { id: updated.customerId },
          data: { status: "PENDING" },
        });
        console.log(`[Retry] Customer ${updated.customerId} requeued (attempt ${attemptCount}/${retryLimit})`);
      } else {
        await tx.customer.update({
          where: { id: updated.customerId },
          data: { status: "FAILED" },
        });
        console.log(`[Retry] Customer ${updated.customerId} exhausted retries (${attemptCount}/${retryLimit}) — marked FAILED`);
      }
    }
    return updated;
  }, {
    maxWait: 10000,
    timeout: 10000,
  });
  return NextResponse.json({ call });
}