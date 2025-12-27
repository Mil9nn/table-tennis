"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, XCircle, Mail, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "resend">(
    token ? "loading" : "resend"
  );
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(emailParam || "");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await axiosInstance.post("auth/verify-email", {
        token: verificationToken,
      });
      setStatus("success");
      setMessage(response.data.message);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Verification failed");
    }
  };

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setResending(true);
    try {
      const response = await axiosInstance.post("auth/send-verification", { email });
      toast.success(response.data.message);
      setMessage(response.data.message);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send verification email");
    } finally {
      setResending(false);
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
              Verify Email
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
                <span className="font-semibold text-sm italic bg-gradient-to-r from-[#284b63] to-[#353535] bg-clip-text text-transparent">
                  TTPro
                </span>
              </Link>
            </div>

            {/* Content Section */}
            <div className="p-6">
              {status === "loading" && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-[#3c6e71] mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-[#353535] mb-2">
                    Verifying your email...
                  </h2>
                  <p className="text-sm text-[#353535]/60">Please wait while we verify your email address.</p>
                </div>
              )}

              {status === "success" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#353535] mb-2">
                    Email Verified!
                  </h2>
                  <p className="text-sm text-[#353535]/60 mb-6">{message}</p>
                  <Button
                    onClick={() => router.push("/auth/login")}
                    className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider"
                  >
                    Continue to Login
                  </Button>
                </div>
              )}

              {status === "error" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#353535] mb-2">
                    Verification Failed
                  </h2>
                  <p className="text-sm text-[#353535]/60 mb-6">{message}</p>
                  <Button
                    onClick={() => setStatus("resend")}
                    className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider"
                  >
                    Request New Verification Link
                  </Button>
                </div>
              )}

              {status === "resend" && (
                <div className="py-4">
                  <div className="w-16 h-16 rounded-full bg-[#3c6e71]/10 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-[#3c6e71]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#353535] mb-2 text-center">
                    Verify Your Email
                  </h2>
                  <p className="text-sm text-[#353535]/60 mb-6 text-center">
                    {emailParam
                      ? "We've sent a verification link to your email. Check your inbox and spam folder."
                      : "Enter your email address to receive a verification link."}
                  </p>
                  
                  <form onSubmit={handleResendVerification} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[#353535] uppercase tracking-wide block mb-2">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-[#ffffff] border-[#d9d9d9] rounded h-10 text-sm placeholder:text-[#353535]/40 focus:border-[#3c6e71]"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full py-6 rounded bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] font-semibold text-sm uppercase tracking-wider"
                      disabled={resending}
                    >
                      {resending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Verification Email"
                      )}
                    </Button>
                  </form>

                  {message && (
                    <p className="text-sm text-green-600 text-center mt-4">{message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t border-[#d9d9d9] text-center">
              <p className="text-xs text-[#353535]/60">
                Already verified?{" "}
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3c6e71]" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

