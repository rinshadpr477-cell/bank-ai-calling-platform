import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }


  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.warn("[Webhook] Signature mismatch — rejecting request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string = event.event;
  const subscriptionEntity = event.payload?.subscription?.entity;

  if (!subscriptionEntity) {
    return NextResponse.json({ received: true });
  }

  const razorpaySubscriptionId: string = subscriptionEntity.id;

  const billingAccount = await prisma.billingAccount.findFirst({
    where: { razorpaySubscriptionId },
  });

  if (!billingAccount) {
    console.warn(`[Webhook] No BillingAccount found for subscription ${razorpaySubscriptionId}`);
    return NextResponse.json({ received: true });
  }
  console.log(`[Webhook] Event: ${eventType} for subscription ${razorpaySubscriptionId}`);

  const currentPeriodEnd = subscriptionEntity.current_end
    ? new Date(subscriptionEntity.current_end * 1000) // Razorpay sends Unix seconds
    : undefined;
  switch (eventType) {
    case "subscription.activated":
    case "subscription.charged":
      await prisma.billingAccount.update({
        where: { id: billingAccount.id },
        data: {
          subscriptionStatus: "ACTIVE",
          currentPeriodEnd,
        },
      });
      break;
    case "subscription.pending":
    case "subscription.halted":
      await prisma.billingAccount.update({
        where: { id: billingAccount.id },
        data: { subscriptionStatus: "PAST_DUE" },
      });
      break;
    case "subscription.cancelled":
    case "subscription.completed":
      await prisma.billingAccount.update({
        where: { id: billingAccount.id },
        data: { subscriptionStatus: "CANCELED" },
      });
      break;

    default:
      console.log(`[Webhook] Unhandled event type: ${eventType} — ignoring`);
  }

  return NextResponse.json({ received: true });
}