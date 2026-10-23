"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { ShieldCheck, LogOut, LayoutDashboard, PhoneCall, CreditCard, Sliders } from "lucide-react";

interface LandingHeaderProps {
  isLoggedIn: boolean;
  userName: string | null;
  userInitial: string;
  isAdmin: boolean;
  image?: string | null;
}

export function LandingHeader({
  isLoggedIn,
  userName,
  userInitial,
  isAdmin,
  image,
}: LandingHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 sm:px-8 py-4 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#004e9f] text-white shadow-sm shadow-[#004e9f]/30 transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
              BankAI
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Calling Platform
            </span>
          </div>
        </Link>

        {!isLoggedIn && (
          <div className="hidden items-center gap-6 text-xs font-semibold text-slate-600 md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-[#004e9f]">
              How it works
            </a>
            <a href="#features" className="transition-colors hover:text-[#004e9f]">
              Features
            </a>
          </div>
        )}
      </div>

      {isLoggedIn ? (
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-4 text-xs font-semibold md:flex">
            <Link
              href="/dashboard"
              className="rounded-xl px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/campaigns"
              className="rounded-xl px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Campaigns
            </Link>
            {isAdmin && (
              <>
                <Link
                  href="/billing"
                  className="rounded-xl px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Billing
                </Link>
                <Link
                  href="/settings"
                  className="rounded-xl px-3 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  Settings
                </Link>
              </>
            )}
          </nav>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-semibold text-white ring-2 ring-slate-200 transition-all hover:ring-[#004e9f]"
            >
              {image ? (
                <Image
                  src={image}
                  alt={userName || "User"}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitial
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-xl animate-fade-in z-50">
                <div className="border-b border-slate-100 px-4 pb-2">
                  <p className="truncate text-xs font-semibold text-slate-900">
                    {userName || "Signed in"}
                  </p>
                </div>

                <div className="border-b border-slate-100 py-1 md:hidden">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5 text-slate-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/campaigns"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-slate-400" />
                    Campaigns
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        href="/billing"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                        Billing
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Sliders className="h-3.5 w-3.5 text-slate-400" />
                        Settings
                      </Link>
                    </>
                  )}
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[#004e9f] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-[#004e9f]/25 hover:bg-[#003d7c] transition-all active:scale-[0.98]"
          >
            Get started
          </Link>
        </div>
      )}
    </nav>
  );
}