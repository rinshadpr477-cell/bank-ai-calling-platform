"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";

interface HeaderProps {email: string;role: string;isAdmin: boolean;image?: string | null;}

export function Header({ email, role, isAdmin, image }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userInitial = email.charAt(0).toUpperCase();

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
    <header className="sticky top-0 z-50 border-b border-[#BA9B5F]/20 bg-[#F5F0E6]/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-8 py-4">
        <Link href="/" className="text-lg font-medium text-[#132B23]">
          Bank AI Calling
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/dashboard" className="text-[#132B23]/70 transition-colors hover:text-[#132B23]">
              Dashboard
            </Link>
            <Link href="/campaigns" className="text-[#132B23]/70 transition-colors hover:text-[#132B23]">
              Campaigns
            </Link>
            {isAdmin && (
              <>
                <Link href="/billing" className="text-[#132B23]/70 transition-colors hover:text-[#132B23]">
                  Billing
                </Link>
                <Link href="/settings" className="text-[#132B23]/70 transition-colors hover:text-[#132B23]">
                  Settings
                </Link>
              </>
            )}
          </nav>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#132B23] text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E]">
              {image ? (
                <Image src={image} alt="" width={40} height={40} className="h-full w-full object-cover" />
              ) : (
                userInitial
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#BA9B5F]/30 bg-[#F5F0E6]/95 py-2 shadow-lg backdrop-blur-sm">
                <div className="border-b border-[#BA9B5F]/20 px-4 pb-2">
                  <p className="truncate text-sm text-[#132B23]">{email}</p>
                  <p className="text-xs text-[#5E775E]">{role}</p>
                </div>

                <div className="border-b border-[#BA9B5F]/20 py-1 md:hidden">
                  <Link href="/dashboard" className="block px-4 py-2 text-sm text-[#132B23] hover:bg-[#BA9B5F]/10">
                    Dashboard
                  </Link>
                  <Link href="/campaigns" className="block px-4 py-2 text-sm text-[#132B23] hover:bg-[#BA9B5F]/10">
                    Campaigns
                  </Link>
                  {isAdmin && (
                    <>
                      <Link href="/billing" className="block px-4 py-2 text-sm text-[#132B23] hover:bg-[#BA9B5F]/10">
                        Billing
                      </Link>
                      <Link href="/settings" className="block px-4 py-2 text-sm text-[#132B23] hover:bg-[#BA9B5F]/10">
                        Settings
                      </Link>
                    </>
                  )}
                </div>

                <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}