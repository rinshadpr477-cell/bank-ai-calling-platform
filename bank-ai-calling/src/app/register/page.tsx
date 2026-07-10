"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerSchema, RegisterFormData } from "@/lib/validation/authSchemas";

export default function RegisterPage() {
  const router = useRouter();

  const {register,handleSubmit,formState: { errors, isSubmitting },} = useForm<RegisterFormData>({
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
    toast.success("Account created — please sign in.");
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#E9E0CF] px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5 rounded-2xl border border-[#BA9B5F]/30 bg-[#F5F0E6] p-8 shadow-md">
        <div>
          <h1 className="text-2xl font-semibold text-[#132B23]">
            Create account
          </h1>
          <p className="mt-1 text-sm text-[#5E775E]">
            Bank AI Calling Platform
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#132B23]">
            Name
          </label>
          <input type="text" {...register("name")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
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
          <input type="password" {...register("password")} className="mt-1 w-full rounded-md border border-[#BA9B5F]/40 bg-white px-3 py-2 text-sm text-[#132B23] outline-none focus:border-[#5E775E] focus:ring-2 focus:ring-[#5E775E]/30"/>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
          <p className="mt-1 text-xs text-[#5E775E]">
            At least 8 characters, with one uppercase letter and one number.
          </p>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-[#132B23] px-3 py-2.5 text-sm font-medium text-[#E9E0CF] transition-colors hover:bg-[#5E775E] active:bg-[#0d1f18] disabled:opacity-50">
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-[#5E775E]">
          Already have an account?{" "}
          <a href="/login" className="font-medium text-[#132B23] underline">
            Sign in
          </a>
        </p>
      </form>
    </div>
  );
}