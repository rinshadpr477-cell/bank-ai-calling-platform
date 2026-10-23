import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export function verifyInternalRequest(req: NextRequest): NextResponse | null {
  const secret = req.headers.get("x-internal-secret");
  const expected = process.env.INTERNAL_API_SECRET;

  if (!expected) {
    console.error("INTERNAL_API_SECRET is not set — refusing all internal requests");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secretBuf = Buffer.from(secret);
  const expectedBuf = Buffer.from(expected);

  if (secretBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(secretBuf, expectedBuf)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}