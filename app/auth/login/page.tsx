"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/lib/validations/auth";
import type { LoginInput } from "@/lib/validations/auth";

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
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegistrationSuccess, setShowRegistrationSuccess] = useState(false);

  const login = useAuthStore((state: any) => state.login);
  const authLoading = useAuthStore((state) => state.authLoading);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setShowRegistrationSuccess(true);
      // Hide the message after 5 seconds
      setTimeout(() => setShowRegistrationSuccess(false), 5000);
    }
  }, [searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    try {
      const response = await login(values);

      // Only redirect if login was successful and we have a user
      if (response?.user) {
        // Check if profile is complete
        if (!response.user.isProfileComplete) {
          router.push("/complete-profile");
        } else {
          router.push("/");
        }
      }
      // If no user in response, login failed - don't redirect
      // Error toast is already shown by the login function
    } catch (error: any) {
      // Check if email verification is required
      if (error?.response?.status === 403 && error?.response?.data?.requiresVerification) {
        const email = error.response.data.email;
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      // Login failed - error toast is already shown by the login function
      // Don't redirect, stay on login page
      console.error("Login submission error:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="bg-[#ffffff] border border-[#d9d9d9]">
            {/* Header Section */}
            <div className="p-6 border-b border-[#d9d9d9] flex items-center gap-4">
              <Image src="/imgs/logo.png" alt="logo" width={50} height={50} className="shrink-0" />
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] leading-none">
                  Welcome Back
                </h2>
                <p className="text-xs text-[#353535]/60 mt-1">Login to continue</p>
              </div>
            </div>

            {/* Form Section */}
            <div className="p-6 space-y-5">
              {/* Registration Success Message */}
              {showRegistrationSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                  ✓ Registration successful! You can now log in with your credentials.
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              placeholder="••••••••"
                              type={showPassword ? "text" : "password"}
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
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs text-[#3c6e71] font-medium hover:text-[#3c6e71]/80 transition"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider transition-colors mt-6"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-[#d9d9d9] text-center">
              <p className="text-xs text-[#353535]/60">
                Don't have an account?{" "}
                <Link
                  href="/auth/register"
                  className="text-[#3c6e71] font-semibold hover:text-[#3c6e71]/80 transition"
                >
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
