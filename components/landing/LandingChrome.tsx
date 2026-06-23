"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { SocialLinks } from "@/components/landing/SocialLinks";
import {
  BRAND_NAME,
  CTA_LINKS,
  LEGAL_LINKS,
  LOGO_SRC,
  NAV_LINKS,
  SUPPORT_EMAIL,
  TAGLINE,
} from "@/lib/landing/site";
import { Button } from "@/components/ui/button";
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
        <a href="#" className="group flex items-center gap-3" aria-label={`${BRAND_NAME} home`}>
          <Image
            src={LOGO_SRC}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-105"
            priority
          />
          <div className="hidden sm:block">
            <p className="font-[family-name:var(--font-syne)] text-lg font-bold tracking-tight text-[var(--lp-text)]">
              {BRAND_NAME}
            </p>
            <p className="max-w-[12rem] truncate text-[11px] leading-tight text-[var(--lp-text-muted)]">
              Competition OS
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
          <div className="hidden items-center gap-3 lg:flex">
            <Button
              variant="ghost"
              asChild
              className="text-[var(--lp-text-muted)] hover:bg-[var(--lp-hover)] hover:text-[var(--lp-text)]"
            >
              <Link href={CTA_LINKS.runTournament}>Run a Tournament</Link>
            </Button>
            <Button
              asChild
              className="rounded-full bg-[var(--lp-accent)] px-5 font-semibold text-[var(--lp-on-accent)] hover:bg-[var(--lp-accent-hover)]"
            >
              <Link href={CTA_LINKS.startScoring}>Start Scoring</Link>
            </Button>
          </div>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg border border-[var(--lp-border)] text-[var(--lp-text)] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="border-t border-[var(--lp-border)] bg-[var(--lp-bg)]/95 px-5 py-6 backdrop-blur-xl lg:hidden"
          aria-label="Mobile navigation"
        >
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block rounded-lg px-3 py-3 text-sm text-[var(--lp-text-muted)] transition hover:bg-[var(--lp-hover)] hover:text-[var(--lp-text)]"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="outline"
              asChild
              className="w-full rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-text)]"
            >
              <Link href={CTA_LINKS.runTournament} onClick={() => setOpen(false)}>
                Run a Tournament
              </Link>
            </Button>
            <Button
              asChild
              className="w-full rounded-full bg-[var(--lp-accent)] font-semibold text-[var(--lp-on-accent)]"
            >
              <Link href={CTA_LINKS.startScoring} onClick={() => setOpen(false)}>
                Start Scoring
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--lp-border)] bg-[var(--lp-surface)]">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
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
            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--lp-text-muted)]">
              The table tennis tournament manager, live scoring app, and team match
              platform built for players, coaches, clubs, and organizers who demand
              more than a basic ping pong score tracker.
            </p>
            <SocialLinks className="mt-5" />
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
              Product
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {NAV_LINKS.slice(0, 4).map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[var(--lp-text-muted)] transition hover:text-[var(--lp-text)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--lp-text-muted)]">
              Legal
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[var(--lp-text-muted)] transition hover:text-[var(--lp-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-5 inline-block text-sm text-[var(--lp-text-muted)] transition hover:text-[var(--lp-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)]"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
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
