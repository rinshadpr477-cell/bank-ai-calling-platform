import { NextRequest, NextResponse } from "next/server";

export function verifyInternalRequest(req: NextRequest): NextResponse | null {
  const secret = req.headers.get("x-internal-secret");
  const expected = process.env.INTERNAL_API_SECRET;

  if (!expected) {
    console.error("INTERNAL_API_SECRET is not set — refusing all internal requests");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; 
}