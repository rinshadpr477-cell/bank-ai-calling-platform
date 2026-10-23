"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  PhoneCall,
  CreditCard,
  Sliders,
  LogOut,
  ShieldCheck,
  X,
  Radio,
  BarChart3,
  Users,
  CalendarCheck,
  History,
  Flame,
  Activity,
} from "lucide-react";

interface SidebarProps {
  email: string;
  name: string | null;
  role: string;
  isAdmin: boolean;
  image?: string | null;
  onCloseMobile?: () => void;
}

export function Sidebar({
  email,
  name,
  role,
  isAdmin,
  image,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();
  const userInitial = (name || email || "U").charAt(0).toUpperCase();

  const crmNavItems = [
    {
      name: "Collections Dashboard",
      href: "/crm",
      icon: BarChart3,
      active: pathname === "/crm",
    },
    {
      name: "Collection Queue",
      href: "/crm/collections",
      icon: Flame,
      active: pathname === "/crm/collections",
    },
    {
      name: "Customers & Accounts",
      href: "/crm/customers",
      icon: Users,
      active: pathname.startsWith("/crm/customers"),
    },
    {
      name: "Follow-up Tasks",
      href: "/crm/follow-ups",
      icon: CalendarCheck,
      active: pathname.startsWith("/crm/follow-ups"),
    },
    {
      name: "Call History & Logs",
      href: "/crm/calls",
      icon: History,
      active: pathname === "/crm/calls",
    },
  ];

  const telephonyItems = [
    {
      name: "Operations Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Voice Campaigns",
      href: "/campaigns",
      icon: PhoneCall,
      active: pathname.startsWith("/campaigns") || pathname.startsWith("/calls"),
    },
  ];

  const adminItems = [
    {
      name: "Billing & Plans",
      href: "/billing",
      icon: CreditCard,
      active: pathname.startsWith("/billing"),
    },
    {
      name: "Platform Settings",
      href: "/settings",
      icon: Sliders,
      active: pathname.startsWith("/settings"),
    },
    {
      name: "System Observability",
      href: "/monitoring",
      icon: Activity,
      active: pathname.startsWith("/monitoring"),
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-300">
      {/* Top Brand Bar */}
      <div>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <Link
            href="/crm"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#004e9f] text-white shadow-md shadow-[#004e9f]/30 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-white block leading-tight">
                BankAI
              </span>
              <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase block">
                Collections CRM
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Live Service Indicator Banner */}
        <div className="mx-4 mt-4 mb-2 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-2 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">AI Telephony</span>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
            ONLINE
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-5 px-3 py-3 overflow-y-auto max-h-[calc(100vh-220px)]">
          {/* CRM Navigation */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Collections CRM
            </p>
            <div className="mt-1.5 space-y-1">
              {crmNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      item.active
                        ? "bg-[#004e9f] text-white shadow-sm shadow-[#004e9f]/30"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${item.active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Telephony Operations */}
          <div>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Voice Automation
            </p>
            <div className="mt-1.5 space-y-1">
              {telephonyItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                      item.active
                        ? "bg-[#004e9f] text-white shadow-sm shadow-[#004e9f]/30"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${item.active ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {isAdmin && (
            <div>
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Administration
              </p>
              <div className="mt-1.5 space-y-1">
                {adminItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        item.active
                          ? "bg-[#004e9f] text-white shadow-sm shadow-[#004e9f]/30"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${item.active ? "text-white" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* User Footer Panel */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-800/60 p-3 border border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-sm font-semibold text-white border border-slate-600">
              {image ? (
                <Image
                  src={image}
                  alt={name || email}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {name || email}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block rounded bg-[#004e9f]/30 px-1.5 py-0.2 text-[10px] font-medium text-blue-300 border border-[#004e9f]/40">
                  {role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            title="Sign out"
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-rose-400"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
