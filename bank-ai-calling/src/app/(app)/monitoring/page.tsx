import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getSystemObservabilitySnapshot } from "@/lib/observability";
import { MonitoringDashboard } from "@/components/MonitoringDashboard";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";

export default async function MonitoringPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Restrict monitoring to ADMIN and SUPERVISOR roles
  let userRole = session.user.role;
  if (session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role) userRole = dbUser.role;
  }
  const isAuthorized = userRole === "ADMIN" || userRole === "SUPERVISOR";

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Privileged Telemetry Access</h2>
        <p className="mt-1 text-xs text-slate-500 max-w-md">
          Infrastructure health and system observability dashboards are restricted to Administrators and Supervisors. Please contact your platform administrator if you require access.
        </p>
        <div className="mt-5">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#004e9f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003d7c] transition-colors"
          >
            Back to Operations Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const initialData = await getSystemObservabilitySnapshot();

  return (
    <div className="space-y-6">
      <MonitoringDashboard initialData={initialData} />
    </div>
  );
}
