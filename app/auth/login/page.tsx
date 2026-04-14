"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

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
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const login = useAuthStore((s: any) => s.login);
  const authLoading = useAuthStore((s) => s.authLoading);

  const [showPassword, setShowPassword] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowRegistrationSuccess(true);
      setTimeout(() => setShowRegistrationSuccess(false), 5000);
    }
  }, [searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    const response = await login(values);
    if (response?.user) {
      router.push("/");
    }
  }

  return (
    <div className="min-h-[calc(100vh-70px)] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="">
          {/* Header */}
          <div className="px-6 pt-8 pb-6 text-center">
            <Image
              src="/imgs/logo.png"
              alt="logo"
              width={56}
              height={56}
              className="mx-auto"
            />
            <h1 className="text-xl font-semibold text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Login to your account
            </p>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {showRegistrationSuccess && (
              <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">
                Account created successfully. Please log in.
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your email address"
                          type="email"
                          className="h-11 bg-white border-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500/40"
                          {...field}
                        />
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
                            className="h-11 pr-10 bg-white border-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500/40"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-medium"
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                       Logging in…
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500">
            Don’t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-slate-900 hover:underline"
            >
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

