"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ callbackUrl: "/login" })}className="text-sm font-medium text-[#5E775E] hover:text-[#132B23]">
      Log out
    </button>
  );
}