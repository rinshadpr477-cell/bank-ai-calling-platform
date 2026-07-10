"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { loginSchema, LoginFormData } from "@/lib/validation/authSchemas";

export default function LoginPage() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);

  const {register,handleSubmit,formState: { errors, isSubmitting },} = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    const result = await signIn("credentials", {email: data.email,password: data.password,redirect: false,});
    if (result?.error) {
      toast.error("Invalid email or password.");
      return;
    }
    toast.success("Signed in successfully.");
    router.push("/dashboard");
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9E0CF] px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8 shadow-md">
        <div>
          <h1 className="text-2xl font-semibold text-[#132B23]">Sign in</h1>
          <p className="mt-1 text-sm text-[#5E775E]">
            Bank AI Calling Platform
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Email
          </label>
          <input type="email" {...register("email")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Password
          </label>
          <input type="password" {...register("password")}className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
           {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#BA9B5F]/30" />
          <span className="text-xs text-[#5E775E]">OR</span>
          <div className="h-px flex-1 bg-[#BA9B5F]/30" />
        </div>

        <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading} className="flex w-full items-center justify-center gap-2 rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2.5 text-sm font-medium text-[#132B23] transition-colors hover:bg-[#F5F0E6] active:bg-[#E9E0CF] disabled:opacity-50">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.85 2.09-1.81 2.73v2.27h2.92c1.71-1.57 2.69-3.88 2.69-6.64z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z" />
            <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.04l3.01-2.34z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z" />
          </svg>
          {googleLoading ? "Redirecting..." : "Sign in with Google"}
        </button>

        <p className="text-center text-sm text-[#5E775E]">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-medium text-[#132B23] underline">
            Create one
          </a>
        </p>
      </form>
    </div>
  );
}