import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <AppShell
      email={session.user.email ?? ""}
      name={session.user.name ?? null}
      role={session.user.role ?? "AGENT"}
      isAdmin={session.user.role === "ADMIN"}
      image={session.user.image}
    >
      {children}
    </AppShell>
  );
}