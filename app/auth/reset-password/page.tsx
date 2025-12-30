"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { axiosInstance } from "@/lib/axiosInstance";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";
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
import { Loader2, ChevronLeft, Lock, CheckCircle2, XCircle } from "lucide-react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

const resetPasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"validating" | "valid" | "invalid" | "success">("validating");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
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

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setErrorMessage("No reset token provided");
      return;
    }

    validateToken(token);
  }, [token]);

  const validateToken = async (resetToken: string) => {
    try {
      await axiosInstance.get(`auth/reset-password?token=${resetToken}`);
      setStatus("valid");
    } catch (error: any) {
      setStatus("invalid");
      setErrorMessage(error.response?.data?.message || "Invalid or expired reset link");
    }
  };

  const onSubmit = async (values: ResetPasswordFormInput) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await axiosInstance.post("auth/reset-password", {
        token,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      setStatus("success");
      toast.success(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#d9d9d9] bg-[#ffffff]/95 backdrop-blur-sm">
        <div className="mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => router.push("/auth/login")}
            className="p-1.5 rounded border border-[#d9d9d9] hover:bg-[#3c6e71] hover:text-[#ffffff] hover:border-[#3c6e71] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535] leading-none">
              Reset Password
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm">
          <div className="bg-[#ffffff] border border-[#d9d9d9]">
            {/* Header Section */}
            <div className="p-6 border-b border-[#d9d9d9] text-center">
              <Link href="/" className="flex items-center justify-center shrink-0 gap-2 mb-4">
                <Image src="/imgs/logo.png" alt="logo" width={40} height={40} />
                <span className="font-semibold text-sm bg-gradient-to-r from-[#2fa4d9] to-[#4ac7f6] bg-clip-text text-transparent">
                  TTPro
                </span>
              </Link>
            </div>

            {/* Content Section */}
            <div className="p-6">
              {status === "validating" && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-[#3c6e71] mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-[#353535] mb-2">
                    Validating Reset Link...
                  </h2>
                  <p className="text-sm text-[#353535]/60">Please wait while we verify your reset link.</p>
                </div>
              )}

              {status === "invalid" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#353535] mb-2">
                    Invalid Reset Link
                  </h2>
                  <p className="text-sm text-[#353535]/60 mb-6">{errorMessage}</p>
                  <Button
                    onClick={() => router.push("/auth/forgot-password")}
                    className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider"
                  >
                    Request New Reset Link
                  </Button>
                </div>
              )}

              {status === "valid" && (
                <>
                  <div className="w-16 h-16 rounded-full bg-[#3c6e71]/10 flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-[#3c6e71]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#353535] mb-2 text-center">
                    Create New Password
                  </h2>
                  <p className="text-sm text-[#353535]/60 mb-6 text-center">
                    Enter your new password below.
                  </p>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                              New Password
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

                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                              Confirm Password
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="••••••••"
                                  className="bg-[#ffffff] border-[#d9d9d9] rounded h-10 text-sm placeholder:text-[#353535]/40 focus:border-[#3c6e71] pr-12"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword((p) => !p)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#353535]/60 hover:text-[#3c6e71] transition"
                                >
                                  {showConfirmPassword ? (
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

                      <Button
                        type="submit"
                        className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Resetting Password...
                          </>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                    </form>
                  </Form>
                </>
              )}

              {status === "success" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#353535] mb-2">
                    Password Reset Successfully!
                  </h2>
                  <p className="text-sm text-[#353535]/60 mb-6">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider"
                  >
                    Continue to Login
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-[#d9d9d9] text-center">
              <p className="text-xs text-[#353535]/60">
                Remember your password?{" "}
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
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3c6e71]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

