"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { BRAND_NAME, LOGO_SRC } from "@/lib/landing/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import type { AdminMeResponse } from "@/types/admin";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [admin, setAdmin] = useState<AdminMeResponse | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    axiosInstance
      .get<AdminMeResponse>("admin/me")
      .then((res) => setAdmin(res.data))
      .catch(() => setAdmin(null))
      .finally(() => setLoading(false));
  }, [isLoginPage, pathname]);

  useEffect(() => {
    if (isLoginPage) return;
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLoginPage]);

  const handleLogout = async () => {
    try {
      await axiosInstance.post("auth/logout");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("Logout failed");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2
          className="size-8 animate-spin text-[var(--lp-accent)]"
          aria-label="Loading admin console…"
        />
      </div>
    );
  }

  return (
    <>
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--lp-accent)] focus:px-4 focus:py-2 focus:text-[var(--lp-bg)] focus:outline-none"
      >
        Skip to dashboard
      </a>

      <header
        className={cn(
          "sticky top-0 z-30 transition-[border-color,background-color,box-shadow] duration-300",
          scrolled
            ? "border-b border-[var(--lp-border)] bg-[var(--lp-bg)]/85 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 sm:h-16 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="group flex min-w-0 items-center gap-3"
            aria-label={`${BRAND_NAME} admin dashboard`}
          >
            <Image
              src={LOGO_SRC}
              alt=""
              width={36}
              height={36}
              className="size-9 object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="min-w-0">
              <p className="font-[family-name:var(--font-syne)] text-base font-bold tracking-tight text-[var(--lp-text)] sm:text-lg">
                {BRAND_NAME}{" "}
                <span className="text-[var(--lp-accent)]">Admin</span>
              </p>
              {admin ? (
                <p className="truncate text-[11px] text-[var(--lp-text-muted)] max-w-[10rem] sm:max-w-xs">
                  {admin.email}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--lp-text-muted)]">Platform console</p>
              )}
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-[var(--lp-text-muted)] hover:bg-white/5 hover:text-[var(--lp-text)]"
            >
              <Link href="/">Home</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-text)] hover:bg-white/5"
            >
              <LogOut className="mr-1.5 size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
              <span className="sr-only sm:hidden">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main id="admin-main" className="mx-auto max-w-7xl px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </>
  );
}
