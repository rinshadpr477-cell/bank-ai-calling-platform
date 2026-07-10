import { NextRequest, NextResponse } from "next/server";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/rbac";
import { getCampaignQueue } from "@/lib/campaignQueue";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);

    const { campaignId } = await req.json();
    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }


    const billingAccount = await prisma.billingAccount.findFirst();
    if (
      billingAccount &&
      billingAccount.subscriptionStatus === "FREE" &&
      billingAccount.freeCallsUsed >= billingAccount.freeCallsLimit
    ) {
      return NextResponse.json(
        { error: "CREDIT_LIMIT_REACHED", detail: "You've used all your free calls." },
        { status: 402 }
      );
    }

    await getCampaignQueue().add("trigger-campaign", { campaignId });

    return NextResponse.json({ triggered: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}