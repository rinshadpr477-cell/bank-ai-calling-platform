import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let role = session.user.role ?? "AGENT";
  if (session.user.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (dbUser?.role) role = dbUser.role;
  }

  return (
    <AppShell
      email={session.user.email ?? ""}
      name={session.user.name ?? null}
      role={role}
      isAdmin={role === "ADMIN"}
      image={session.user.image}
    >
      {children}
    </AppShell>
  );
}