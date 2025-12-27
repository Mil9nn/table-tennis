"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { registerSchema } from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const RegisterPage = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const register = useAuthStore((state) => state.register);
  const authLoading = useAuthStore((state) => state.authLoading);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
    },
  });

  const password = form.watch("password");

  // Password strength evaluator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-[#d9d9d9]" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score === 3) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score === 4) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  async function onSubmit(values: RegisterInput) {
    try {
      const response = await register(values);
      // Redirect to email verification page with email param
      if (response?.requiresVerification) {
        router.push(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
      }
    } catch {
      // Error is handled by the store
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#d9d9d9] bg-[#ffffff]/95 backdrop-blur-sm">
        <div className="mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded border border-[#d9d9d9] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] leading-none">
              Register
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-[#ffffff] border border-[#d9d9d9]">
            {/* Header Section */}
            <div className="p-6 border-b border-[#d9d9d9] text-center">
              <Link href="/" className="flex items-center justify-center shrink-0 gap-2 mb-4">
                <Image src="/imgs/logo.png" alt="logo" width={40} height={40} />
                <span className="font-semibold text-sm italic bg-gradient-to-r from-[#284b63] to-[#353535] bg-clip-text text-transparent">
                  TTPro
                </span>
              </Link>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] leading-none">
                Create Account
              </h2>
              <p className="text-xs text-[#353535]/60 mt-1">Join our community</p>
            </div>

            {/* Form Section */}
            <div className="p-6 space-y-5">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Username */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                          Username
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="username"
                            className="bg-[#ffffff] border-[#d9d9d9] rounded h-10 text-sm placeholder:text-[#353535]/40 focus:border-[#3c6e71]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Full Name */}
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="John Doe"
                            className="bg-[#ffffff] border-[#d9d9d9] rounded h-10 text-sm placeholder:text-[#353535]/40 focus:border-[#3c6e71]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your@email.com"
                            type="email"
                            className="bg-[#ffffff] border-[#d9d9d9] rounded h-10 text-sm placeholder:text-[#353535]/40 focus:border-[#3c6e71]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                          Password
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              placeholder="••••••••"
                              className="bg-[#ffffff] border-[#d9d9d9] rounded h-10 text-sm placeholder:text-[#353535]/40 focus:border-[#3c6e71] pr-12"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((p) => !p)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#353535]/60 hover:text-[#3c6e71] transition"
                            >
                              {showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </button>
                          </div>
                        </FormControl>

                        {/* Strength meter */}
                        {password && (
                          <div className="space-y-1.5 mt-2">
                            <div className="flex gap-1 h-1.5">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`flex-1 rounded-full ${
                                    level <= passwordStrength.score
                                      ? passwordStrength.color
                                      : "bg-[#d9d9d9]"
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-[#353535]/60">
                                Strength:{" "}
                                <span className="font-semibold text-[#353535]">
                                  {passwordStrength.label}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Helper text */}
                        <p className="text-xs text-[#353535]/60 mt-2">
                          Use 8+ characters with letters, numbers & symbols
                        </p>

                        {/* Rules when weak */}
                        {password && passwordStrength.label === "Weak" && (
                          <ul className="text-xs text-[#353535]/60 mt-2 space-y-0.5 list-disc list-inside">
                            <li>At least 8 characters</li>
                            <li>One uppercase letter</li>
                            <li>One number or symbol</li>
                          </ul>
                        )}

                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider transition-colors mt-6"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-[#d9d9d9] text-center">
              <p className="text-xs text-[#353535]/60">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#3c6e71] font-semibold hover:text-[#3c6e71]/80 transition"
                >
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
