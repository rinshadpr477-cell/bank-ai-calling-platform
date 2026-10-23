import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/rbac";

interface CsvRow { Name?: string; "Phone Number"?: string; Email?: string; Language?: string; Notes?: string;}


const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);
    const { id: campaignId } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Protection against OOM and oversized payload attacks
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds the 5MB limit" }, { status: 400 });
    }

    const text = await file.text();
    const parsed = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing failed", details: parsed.errors },
        { status: 400 }
      );
    }

    const rows = parsed.data;
    const MAX_ROWS = 5000;
    if (rows.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `CSV exceeds maximum limit of ${MAX_ROWS} contacts per upload.` },
        { status: 400 }
      );
    }

    const seenPhones = new Set<string>();
    const validRows: { name: string; phoneNumber: string; email: string | null; language: string; notes: string | null }[] = [];
    const rejected: { row: number; reason: string }[] = [];

    rows.forEach((row, index) => {
      const name = row.Name?.trim();
      const phone = row["Phone Number"]?.trim();
      const email = row.Email?.trim() || null;
      const language = row.Language?.trim().toLowerCase() || "en";
      const notes = row.Notes?.trim() || null;

      if (!name || !phone) {
        rejected.push({ row: index + 2, reason: "Missing name or phone number" });
        return;
      }

      if (!PHONE_REGEX.test(phone)) {
        rejected.push({ row: index + 2, reason: `Invalid phone number: ${phone}` });
        return;
      }

      if (seenPhones.has(phone)) {
        rejected.push({ row: index + 2, reason: `Duplicate phone number in file: ${phone}` });
        return;
      }

      seenPhones.add(phone);
      validRows.push({ name, phoneNumber: phone, email, language, notes });
    });

    // Chunk lookups to avoid exceeding database query parameter limits
    const allPhones = Array.from(seenPhones);
    const existingPhones = new Set<string>();
    const CHUNK_SIZE = 500;

    for (let i = 0; i < allPhones.length; i += CHUNK_SIZE) {
      const slice = allPhones.slice(i, i + CHUNK_SIZE);
      const existing = await prisma.customer.findMany({
        where: { campaignId, phoneNumber: { in: slice } },
        select: { phoneNumber: true },
      });
      existing.forEach((e) => existingPhones.add(e.phoneNumber));
    }

    const toInsert = validRows.filter((r) => {
      if (existingPhones.has(r.phoneNumber)) {
        rejected.push({
          row: -1,
          reason: `Already exists in this campaign: ${r.phoneNumber}`,
        });
        return false;
      }
      return true;
    });

    let insertedCount = 0;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const slice = toInsert.slice(i, i + CHUNK_SIZE);
      const created = await prisma.customer.createMany({
        data: slice.map((r) => ({ ...r, campaignId })),
      });
      insertedCount += created.count;
    }

    return NextResponse.json({
      totalRows: rows.length,
      inserted: insertedCount,
      rejected,
    });
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