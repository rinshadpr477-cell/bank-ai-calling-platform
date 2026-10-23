"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

interface AppShellProps {
  children: React.ReactNode;
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  image?: string | null;
}

export function AppShell({
  children,
  email,
  name,
  role,
  isAdmin,
  image,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9ff] flex">
      {/* Desktop Fixed Dark Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col shadow-xl">
        <Sidebar
          email={email}
          name={name}
          role={role}
          isAdmin={isAdmin}
          image={image}
        />
      </aside>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setMobileOpen(false)}
          role="presentation"
        >
          <div
            className="w-72 max-w-[85vw] h-full shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              email={email}
              name={name}
              role={role}
              isAdmin={isAdmin}
              image={image}
              onCloseMobile={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        <Header
          email={email}
          name={name}
          role={role}
          isAdmin={isAdmin}
          image={image}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="flex-1 bg-[#f9f9ff] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
