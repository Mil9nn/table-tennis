"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");

  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "resend"
  >(token ? "loading" : "resend");
  const [message, setMessage] = useState("");
  const [email] = useState(emailParam || "");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) verifyEmail(token);
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
      setMessage(
        error.response?.data?.message || "Verification failed"
      );
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address not found");
      return;
    }

    setResending(true);
    try {
      const response = await axiosInstance.post(
        "auth/send-verification",
        { email }
      );
      toast.success("Verification email sent");
      setMessage(response.data.message);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send verification email"
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm border rounded-lg">
        <div className="p-6">
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

          {/* ERROR */}
          {status === "error" && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Verification failed
              </h2>
              <p className="mt-1 text-sm text-gray-600">{message}</p>
              <Button
                variant="secondary"
                onClick={() => setStatus("resend")}
                className="mt-6 w-full"
              >
                Request new link
              </Button>
            </div>
          )}

          {/* RESEND */}
          {status === "resend" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3c6e71]/10">
                <Mail className="h-7 w-7 text-[#3c6e71]" />
              </div>

              <h2 className="text-lg font-semibold text-gray-900">
                Check your email
              </h2>

              <p className="mt-2 text-sm text-gray-600">
                We’ve sent a verification link to{" "}
                <span className="font-medium text-gray-900">
                  {email}
                </span>
                .  
                Please check your inbox and spam folder.
              </p>

              {message && (
                <p className="mt-3 text-sm text-green-600">
                  {message}
                </p>
              )}

              {/* Secondary action */}
              <div className="mt-6">
                <p className="mb-2 text-xs text-gray-500">
                  Didn’t receive the email?
                </p>
                <Button
                  variant="ghost"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="text-sm"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
              </div>
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


