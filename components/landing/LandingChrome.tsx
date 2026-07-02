"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SocialLinks } from "@/components/landing/SocialLinks";
import {
  BRAND_NAME,
  LEGAL_LINKS,
  LOGO_SRC,
  NAV_LINKS,
  SUPPORT_EMAIL,
  TAGLINE,
} from "@/lib/landing/site";
import { DownloadButton } from "./DownloadButton";
import { LandingThemeToggle } from "./LandingTheme";

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--lp-border)] bg-[var(--lp-bg)]/85 backdrop-blur-xl shadow-[var(--lp-header-shadow)]"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">
        <a href="#" className="group flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label={`${BRAND_NAME} home`}>
          <Image
            src={LOGO_SRC}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-syne)] text-base font-bold tracking-tight text-[var(--lp-text)] sm:text-lg">
              {BRAND_NAME}
            </p>
            <p className="hidden max-w-[12rem] truncate text-[11px] leading-tight text-[var(--lp-text-muted)] sm:block">
              {TAGLINE}
            </p>
          </div>
        </a>

        <nav
          className="hidden items-center gap-7 lg:flex"
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[var(--lp-text-muted)] transition-colors hover:text-[var(--lp-text)]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LandingThemeToggle />
          <div className="hidden lg:flex">
            <DownloadButton />
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--lp-border)] text-[var(--lp-text)] transition-colors duration-200 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <X className="size-5 transition-transform duration-200 motion-reduce:transition-none" />
            ) : (
              <Menu className="size-5 transition-transform duration-200 motion-reduce:transition-none" />
            )}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none lg:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <nav
          id="mobile-nav"
          inert={!open}
          aria-hidden={!open}
          className={cn(
            "min-h-0 overflow-hidden border-t border-[var(--lp-border)] bg-[var(--lp-bg)]/95 px-5 backdrop-blur-xl transition-[opacity,padding] duration-300 ease-in-out motion-reduce:transition-none",
            open ? "py-6 opacity-100" : "py-0 opacity-0"
          )}
          aria-label="Mobile navigation"
        >
          <ul
            className={cn(
              "space-y-1 transition-opacity duration-300 ease-in-out motion-reduce:transition-none",
              !open && "pointer-events-none"
            )}
          >
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  tabIndex={open ? undefined : -1}
                  className="block rounded-lg px-3 py-3 text-sm text-[var(--lp-text-muted)] transition-colors hover:bg-[var(--lp-hover)] hover:text-[var(--lp-text)]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-3 lg:hidden">
              <DownloadButton className="w-full" />
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--lp-border)] bg-[var(--lp-surface)]">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <Image
              src={LOGO_SRC}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
              loading="lazy"
            />
            <div>
              <p className="font-[family-name:var(--font-syne)] font-bold text-[var(--lp-text)]">
                {BRAND_NAME}
              </p>
              <p className="text-xs text-[var(--lp-text-muted)]">{TAGLINE}</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--lp-text-muted)]">
            Live scoring, tournaments, and team matches for table tennis clubs and
            organizers.
          </p>
          <SocialLinks className="mt-5" />
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 inline-block text-sm text-[var(--lp-text-muted)] transition hover:text-[var(--lp-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)]"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--lp-border)] pt-8 text-sm text-[var(--lp-text-muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.</p>
          <nav aria-label="Legal links" className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-[var(--lp-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
