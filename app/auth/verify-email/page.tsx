"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Mail, Shield } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<"input" | "loading" | "success" | "error">("input");
  const [message, setMessage] = useState("");
  const [email] = useState(emailParam || "");
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleVerifyOTP = async () => {
    if (!email) {
      toast.error("Email address not found");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setVerifying(true);
    setStatus("loading");
    try {
      const response = await axiosInstance.post("auth/verify-otp", {
        email,
        otp,
        purpose: "email_verification",
      });
      setStatus("success");
      setMessage(response.data.message);
      toast.success("Email verified successfully!");
    } catch (error: any) {
      setStatus("error");
      const errorMessage = error.response?.data?.message || "Verification failed";
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
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
        purpose: "email_verification",
      });
      toast.success("OTP sent to your email");
      setMessage(response.data.message);
      setOtp("");
      setStatus("input");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send OTP"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border rounded-lg">
        <div className="p-6">
          {/* OTP INPUT */}
          {(status === "input" || status === "error") && (
            <div className="py-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3c6e71]/10">
                <Shield className="h-7 w-7 text-[#3c6e71]" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Enter verification code
              </h2>

              <p className="text-sm text-gray-600 text-center mb-6">
                We've sent a 6-digit code to{" "}
                <span className="font-medium text-gray-900">{email}</span>
              </p>

              {status === "error" && message && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {message}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={handleOTPChange}
                    placeholder="000000"
                    className="text-center text-2xl font-mono tracking-widest h-14"
                    disabled={verifying}
                  />
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={otp.length !== 6 || verifying}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Email"
                  )}
                </Button>

                <div className="text-center">
                  <p className="mb-2 text-xs text-gray-500">
                    Didn't receive the code?
                  </p>
                  <Button
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={resending}
                    className="text-sm"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend OTP
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* LOADING */}
          {status === "loading" && (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#3c6e71]" />
              <h2 className="text-lg font-semibold text-gray-900">
                Verifying your email
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                This will only take a moment.
              </p>
            </div>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Email verified
              </h2>
              <p className="mt-1 text-sm text-gray-600">{message}</p>
              <Button
                onClick={() => router.push("/auth/login")}
                className="mt-6 w-full"
              >
                Continue to login
              </Button>
            </div>
          )}
        </div>

        <div className="border-t p-4 text-center text-xs text-gray-500">
          Already verified?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-[#3c6e71] hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3c6e71]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}


