"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { axiosInstance } from "@/lib/axiosInstance";
import { z } from "zod";
import { passwordSchema } from "@/lib/validations/auth";
import { resetPasswordWithOTPSchema } from "@/lib/validations/auth";
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
import { Loader2, ChevronLeft, Lock, CheckCircle2, Shield, Mail } from "lucide-react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

type ResetPasswordFormInput = z.infer<typeof resetPasswordWithOTPSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<"input" | "loading" | "success" | "error">("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email] = useState(emailParam || "");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordWithOTPSchema),
    defaultValues: {
      email: email || "",
      otp: "",
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
    if (!email) {
      setStatus("error");
      setErrorMessage("Email address is required");
    }
  }, [email]);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    form.setValue("otp", value);
  };

  const handleResendOTP = async () => {
    if (!email) {
      toast.error("Email address not found");
      return;
    }

    setResending(true);
    try {
      const response = await axiosInstance.post("auth/send-otp", {
        email,
        purpose: "password_reset",
      });
      toast.success("OTP sent to your email");
      form.setValue("otp", "");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send OTP"
      );
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (values: ResetPasswordFormInput) => {
    setIsLoading(true);
    setStatus("loading");
    try {
      const response = await axiosInstance.post("auth/reset-password", {
        email: values.email,
        otp: values.otp,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      setStatus("success");
      toast.success(response.data.message);
    } catch (error: any) {
      setStatus("error");
      const errorMessage = error.response?.data?.message || "Failed to reset password";
      setErrorMessage(errorMessage);
      toast.error(errorMessage);
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
              {(status === "input" || status === "error") && (
                <>
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3c6e71]/10">
                    <Shield className="h-7 w-7 text-[#3c6e71]" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
                    Reset Password
                  </h2>
                  <p className="text-sm text-gray-600 mb-6 text-center">
                    Enter the OTP sent to{" "}
                    <span className="font-medium text-gray-900">{email || "your email"}</span> and your new password.
                  </p>

                  {status === "error" && errorMessage && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {errorMessage}
                    </div>
                  )}

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input type="hidden" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">
                              Verification Code
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={field.value}
                                onChange={handleOTPChange}
                                placeholder="000000"
                                className="text-center text-2xl font-mono tracking-widest h-14 bg-[#ffffff] border-[#d9d9d9] rounded"
                                disabled={isLoading}
                              />
                            </FormControl>
                            <div className="text-center mt-2">
                              <button
                                type="button"
                                onClick={handleResendOTP}
                                disabled={resending}
                                className="text-xs text-[#3c6e71] hover:underline"
                              >
                                {resending ? (
                                  <>
                                    <Loader2 className="inline h-3 w-3 mr-1 animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Mail className="inline h-3 w-3 mr-1" />
                                    Resend OTP
                                  </>
                                )}
                              </button>
                            </div>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
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
                        className="w-full mt-6"
                        disabled={isLoading || form.watch("otp")?.length !== 6}
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

              {status === "loading" && (
                <div className="text-center py-10">
                  <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#3c6e71]" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Resetting Password
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Please wait...</p>
                </div>
              )}

              {status === "success" && (
                <div className="text-center py-10">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Password Reset Successfully
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Your password has been updated. You can now log in with your new password.
                  </p>
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="mt-6 w-full"
                  >
                    Continue to Login
                  </Button>
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="border-t p-4 text-center text-xs text-gray-500">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-[#3c6e71] hover:underline"
              >
                Log in
              </Link>
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

