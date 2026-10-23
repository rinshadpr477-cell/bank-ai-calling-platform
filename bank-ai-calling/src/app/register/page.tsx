"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { registerSchema, RegisterFormData } from "@/lib/validation/authSchemas";
import { ShieldCheck, User, Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const responseData = await res.json().catch(() => ({}));
      toast.error(responseData.error ?? "Something went wrong. Please try again.");
      return;
    }
    toast.success("Account created successfully. Please sign in.");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f9ff] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#004e9f] text-white shadow-lg shadow-[#004e9f]/30 mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Get started with autonomous AI voice campaigns
          </p>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  {...register("name")}
                  placeholder="Rahul Sharma"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="officer@bank.example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[#004e9f] focus:ring-2 focus:ring-[#004e9f]/20"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password.message}</p>
              )}
              <p className="mt-1.5 text-xs text-slate-500">
                Minimum 8 characters with at least one uppercase letter and one number.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#004e9f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#004e9f]/25 transition-all hover:bg-[#003d7c] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#004e9f] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}