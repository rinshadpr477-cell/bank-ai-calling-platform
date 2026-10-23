import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateFollowUpSchema } from "@/lib/validation/crmSchemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateFollowUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const existing = await prisma.followUpTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Follow-up task not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.status) {
      updateData.status = parsed.data.status;
      if (parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
        updateData.completedAt = new Date();
      } else if (parsed.data.status !== "COMPLETED") {
        updateData.completedAt = null;
      }
    }

    if (parsed.data.dueDate) {
      const parsedDate = new Date(parsed.data.dueDate);
      if (!isNaN(parsedDate.getTime())) {
        updateData.dueDate = parsedDate;
      }
    }

    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    if (parsed.data.priority) {
      updateData.priority = parsed.data.priority;
    }

    const updated = await prisma.followUpTask.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phoneNumber: true } },
      },
    });

    return NextResponse.json({ task: updated });
  } catch (err) {
    console.error("Error updating follow-up:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.followUpTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Follow-up task not found" }, { status: 404 });
    }

    await prisma.followUpTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting follow-up:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
