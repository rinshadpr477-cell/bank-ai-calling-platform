import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient } from "@/lib/razorpay";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — Admin access required" }, { status: 403 });
  }

  const planId = process.env.RAZORPAY_PLAN_ID;
  if (!planId) {
    return NextResponse.json({ error: "RAZORPAY_PLAN_ID is not configured" }, { status: 500 });
  }

  try {
    const razorpay = getRazorpayClient();
    const subscription = await razorpay.subscriptions.create({plan_id: planId,customer_notify: 1,total_count: 120,});
    let billingAccount = await prisma.billingAccount.findFirst();
    if (!billingAccount) {
      billingAccount = await prisma.billingAccount.create({ data: {} });
    }
    await prisma.billingAccount.update({
      where: { id: billingAccount.id },
      data: { razorpaySubscriptionId: subscription.id },
    });
    return NextResponse.json({
      subscriptionId: subscription.id,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("[Billing] Failed to create subscription:", err);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}