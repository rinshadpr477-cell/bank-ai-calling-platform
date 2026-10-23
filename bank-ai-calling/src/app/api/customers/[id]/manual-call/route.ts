import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { extractManualCallSummary } from "@/lib/manualCallExtraction";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: customerId } = await params;
    const body = await req.json().catch(() => null);

    if (!body || !body.notes || typeof body.notes !== "string" || body.notes.trim().length === 0) {
        return NextResponse.json({ error: "Call notes are required" }, { status: 400 });
    }

    const { notes } = body;

    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { id: true, campaignId: true },
    });

    if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const extraction = await extractManualCallSummary(notes);

    const call = await prisma.call.create({
        data: {
            campaignId: customer.campaignId,
            customerId: customer.id,
            status: "COMPLETED",
            source: "MANUAL",
            startedAt: new Date(),
            endedAt: new Date(),
            summary: {
                create: {
                    summaryText: extraction?.summaryText ?? notes,
                    interested: extraction?.interested ?? undefined,
                    callOutcome: (extraction?.callOutcome as never) ?? undefined,
                    keyObjection: extraction?.keyObjection,
                    nextAction: extraction?.nextAction,
                    followUpDate: extraction?.followUpDate,
                    priority: (extraction?.priority as never) ?? undefined,
                },
            },
        },
        include: { summary: true },
    });

    return NextResponse.json({ call });
}