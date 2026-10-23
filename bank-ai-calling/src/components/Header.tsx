"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  ChevronRight,
  LogOut,
  CreditCard,
  Sliders,
  PhoneCall,
  LayoutDashboard,
} from "lucide-react";

interface HeaderProps {
  email: string;
  name?: string | null;
  role: string;
  isAdmin: boolean;
  image?: string | null;
  onOpenMobile?: () => void;
}

export function Header({
  email,
  name,
  role,
  isAdmin,
  image,
  onOpenMobile,
}: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userInitial = (name || email || "U").charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute clean breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return [{ label: "Home", href: "/" }];

    const breadcrumbs: { label: string; href: string }[] = [];
    let currentPath = "";

    parts.forEach((part) => {
      currentPath += `/${part}`;
      let label = part.charAt(0).toUpperCase() + part.slice(1);
      if (part === "crm") label = "Collections CRM";
      else if (part === "customers") label = "Customers & Accounts";
      else if (part === "collections") label = "Collection Queue";
      else if (part === "follow-ups") label = "Follow-up Tasks";
      else if (part === "campaigns") label = "Campaigns";
      else if (part === "dashboard") label = "Operations";
      else if (part === "billing") label = "Billing";
      else if (part === "settings") label = "Settings";
      else if (part === "monitoring") label = "System Observability";
      else if (part === "calls") label = "Call History";
      else if (part === "new") label = "New Campaign";
      else if (part === "upload") label = "Upload Contacts";
      else if (part === "results") label = "Results";
      else if (part === "edit") label = "Edit";
      else if (part.length > 15) label = "Profile";

      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur-md">
      {/* Left: Mobile trigger & Breadcrumb */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open mobile navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <nav aria-label="Breadcrumb" className="flex items-center text-xs sm:text-sm">
          <Link
            href="/dashboard"
            className="font-medium text-slate-500 hover:text-[#004e9f] transition-colors"
          >
            BankAI
          </Link>
          {breadcrumbs.map((crumb, idx) => (
            <div key={crumb.href} className="flex items-center">
              <ChevronRight className="h-3.5 w-3.5 mx-1.5 text-slate-400 shrink-0" />
              {idx === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-slate-900 truncate max-w-[160px] sm:max-w-xs">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-slate-500 hover:text-[#004e9f] transition-colors truncate max-w-[120px]"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Quick actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Role badge */}
        <span className="hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#004e9f] border border-blue-200/60">
          {role}
        </span>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="User menu"
            className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white ring-2 ring-slate-200 transition-all hover:ring-[#004e9f]"
          >
            {image ? (
              <Image
                src={image}
                alt={email}
                width={36}
                height={36}
                className="h-full w-full object-cover"
              />
            ) : (
              userInitial
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl animate-fade-in z-50">
              <div className="border-b border-slate-100 px-4 pb-3 pt-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {name || email}
                </p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
                <div className="mt-1.5">
                  <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    Role: {role}
                  </span>
                </div>
              </div>

              {/* Quick Navigation in dropdown */}
              <div className="py-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-400" />
                  Dashboard
                </Link>
                <Link
                  href="/campaigns"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <PhoneCall className="h-4 w-4 text-slate-400" />
                  Campaigns
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      href="/billing"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <CreditCard className="h-4 w-4 text-slate-400" />
                      Billing
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Sliders className="h-4 w-4 text-slate-400" />
                      Settings
                    </Link>
                  </>
                )}
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 text-rose-500" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}