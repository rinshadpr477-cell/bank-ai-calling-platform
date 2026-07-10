import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <>
      <Header email={session.user.email ?? ""} role={session.user.role} isAdmin={session.user.role === "ADMIN"} image={session.user.image}/>
      {children}
    </>
  );
}