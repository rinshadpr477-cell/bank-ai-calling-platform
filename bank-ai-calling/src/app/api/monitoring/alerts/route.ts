import { NextRequest, NextResponse } from "next/server";
import { requireRole, UnauthorizedError, ForbiddenError } from "@/lib/rbac";
import { acknowledgeAlert, clearAcknowledgedAlert } from "@/lib/observability";

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "SUPERVISOR"]);

    const body = await req.json().catch(() => null);
    if (!body || !body.alertId) {
      return NextResponse.json({ error: "alertId is required" }, { status: 400 });
    }

    const { alertId, action } = body;

    if (action === "resolve") {
      clearAcknowledgedAlert(alertId);
    } else {
      acknowledgeAlert(alertId);
    }

    return NextResponse.json({ success: true, alertId, action: action || "acknowledged" });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.error("[Observability] Error acknowledging alert:", err);
    return NextResponse.json({ error: "Failed to update alert" }, { status: 500 });
  }
}
