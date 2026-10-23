import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createFollowUpSchema } from "@/lib/validation/crmSchemas";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = customerId;
  if (status && ["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
    where.status = status;
  }
  if (priority && ["HIGH", "MEDIUM", "LOW", "NONE"].includes(priority)) {
    where.priority = priority;
  }

  const tasks = await prisma.followUpTask.findMany({
    where,
    orderBy: { dueDate: "asc" },
    include: {
      customer: { select: { id: true, name: true, phoneNumber: true, email: true } },
      call: {
        select: {
          id: true,
          status: true,
          source: true,
          summary: { select: { callOutcome: true, summaryText: true } },
        },
      },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createFollowUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { customerId, callId, title, notes, dueDate, priority } = parsed.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      return NextResponse.json({ error: "Invalid due date format" }, { status: 400 });
    }

    const task = await prisma.followUpTask.create({
      data: {
        customerId,
        callId: callId || undefined,
        assignedToId: session.user.id || undefined,
        title,
        notes: notes || undefined,
        dueDate: parsedDueDate,
        priority: priority as never,
        status: "PENDING",
      },
      include: {
        customer: { select: { id: true, name: true, phoneNumber: true } },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err) {
    console.error("Error creating follow-up:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
