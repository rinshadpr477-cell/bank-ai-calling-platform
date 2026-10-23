import { NextResponse } from "next/server";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/rbac";
import { getSystemObservabilitySnapshot } from "@/lib/observability";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);

    const snapshot = await getSystemObservabilitySnapshot();
    return NextResponse.json(snapshot);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden — Admin or Supervisor privilege required" }, { status: 403 });
    }

    console.error("[Observability] Failed to collect metrics snapshot:", err);
    return NextResponse.json({ error: "Internal telemetry collection failure" }, { status: 500 });
  }
}
