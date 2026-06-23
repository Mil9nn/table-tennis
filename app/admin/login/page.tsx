"use client";

import Image from "next/image";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { BRAND_NAME, LOGO_SRC } from "@/lib/landing/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("auth/login", { email, password });
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--lp-border)] bg-[var(--lp-surface)] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.45)] sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,77,41,0.1),transparent)]"
        aria-hidden="true"
      />

      <div className="relative mb-8 flex items-center gap-3">
        <Image
          src={LOGO_SRC}
          alt=""
          width={40}
          height={40}
          className="size-10 object-contain"
        />
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-xl font-bold text-[var(--lp-text)]">
            {BRAND_NAME} Admin
          </h1>
          <p className="text-sm text-[var(--lp-text-muted)]">Platform console</p>
        </div>
      </div>

      <p className="relative mb-6 text-sm leading-relaxed text-[var(--lp-text-muted)]">
        Sign in with an account listed in{" "}
        <code className="rounded bg-[var(--lp-bg)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-xs text-[var(--lp-accent)]">
          ADMIN_EMAILS
        </code>
        .
      </p>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[var(--lp-text-muted)]">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com…"
            className="border-[var(--lp-border)] bg-[var(--lp-bg)] text-[var(--lp-text)] placeholder:text-[var(--lp-text-muted)]/60 focus-visible:ring-[var(--lp-accent)]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[var(--lp-text-muted)]">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-[var(--lp-border)] bg-[var(--lp-bg)] text-[var(--lp-text)] focus-visible:ring-[var(--lp-accent)]"
          />
        </div>

        <Button
          type="submit"
          className="w-full rounded-full bg-[var(--lp-accent)] font-semibold text-[var(--lp-bg)] hover:bg-[var(--lp-accent-hover)]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <p className="relative mt-6 text-center text-sm text-[var(--lp-text-muted)]">
        <Link
          href="/"
          className="font-medium text-[var(--lp-accent)] transition-colors hover:text-[var(--lp-accent-hover)] hover:underline"
        >
          Back to home
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-5 py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />
      <Suspense
        fallback={
          <div className="flex justify-center p-8">
            <Loader2
              className="size-8 animate-spin text-[var(--lp-accent)]"
              aria-label="Loading login…"
            />
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
