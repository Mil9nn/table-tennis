"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const APP_SCHEME = "tabletennisscorer";
const BRAND_NAME = "TTPro";

function normalizeJoinCode(raw: string | null): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}

function JoinTournamentContent() {
  const searchParams = useSearchParams();
  const code = useMemo(
    () => normalizeJoinCode(searchParams.get("code")),
    [searchParams],
  );

  const appDeepLink = code
    ? `${APP_SCHEME}://tournaments/join?code=${encodeURIComponent(code)}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-center text-2xl font-bold text-slate-900">Join tournament</h1>

      {code ? (
        <>
          <p className="text-center text-slate-600">
            You&apos;ve been invited to join a tournament. Open {BRAND_NAME} to register
            instantly.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Join code
            </p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-indigo-600">
              {code}
            </p>
          </div>
          {appDeepLink && (
            <a
              href={appDeepLink}
              className="block rounded-lg bg-indigo-600 px-4 py-3 text-center font-semibold text-white hover:bg-indigo-700"
            >
              Open in {BRAND_NAME} app
            </a>
          )}
          <p className="text-center text-sm text-slate-500">
            Don&apos;t have the app? Install TTPro, then open this page again or enter the code
            on Join Tournament.
          </p>
        </>
      ) : (
        <p className="text-center text-slate-600">
          This invite link is missing a valid join code. Ask the organizer to share their invite
          link again.
        </p>
      )}

      <Link href="/" className="text-center text-sm text-indigo-600 hover:underline">
        Back to home
      </Link>
    </main>
  );
}

export default function JoinTournamentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-slate-600">
          Loading…
        </main>
      }
    >
      <JoinTournamentContent />
    </Suspense>
  );
}
