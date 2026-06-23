"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const authLoading = useAuthStore((s) => s.authLoading);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");

  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { label: "Weak", width: "w-1/4", color: "bg-red-500" };
    if (score === 2) return { label: "Fair", width: "w-2/4", color: "bg-yellow-500" };
    if (score === 3) return { label: "Good", width: "w-3/4", color: "bg-blue-500" };
    return { label: "Strong", width: "w-full", color: "bg-emerald-500" };
  };

  const strength = password ? getPasswordStrength(password) : null;

  async function onSubmit(values: RegisterInput) {
    const response = await register(values);
    if (response?.requiresVerification) {
      router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
    } else {
      router.push("/auth/login?registered=true");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/60 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center">
            <Image
              src="/imgs/logo.png"
              alt="logo"
              width={56}
              height={56}
              className="mx-auto mb-4"
            />
            <h1 className="text-xl font-semibold text-slate-900">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Get started in just a minute
            </p>
          </div>

          {/* Form */}
          <div className="px-6 pb-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-11 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <Image
                              src={showPassword ? "/svgs/eye-slash.svg" : "/svgs/eye.svg"}
                              alt={showPassword ? "Hide password" : "Show password"}
                              width={20}
                              height={20}                             
                            />
                          </button>
                        </div>
                      </FormControl>

                      {strength && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 w-full rounded-full bg-slate-200">
                            <div
                              className={`h-full rounded-full transition-all ${strength.width} ${strength.color}`}
                            />
                          </div>
                          <p className="text-xs text-slate-500">
                            Password strength:{" "}
                            <span className="font-medium text-slate-700">
                              {strength.label}
                            </span>
                          </p>
                        </div>
                      )}

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="h-11 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword((v) => !v)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <Image
                              src={showConfirmPassword ? "/svgs/eye-slash.svg" : "/svgs/eye.svg"}
                              alt={showConfirmPassword ? "Hide password" : "Show password"}
                              width={20}
                              height={20}                              
                            />
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-slate-900 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
