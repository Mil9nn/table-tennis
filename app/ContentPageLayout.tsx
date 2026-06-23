import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Syne, DM_Sans } from "next/font/google";
import { LandingFooter } from "@/components/landing/LandingChrome";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

type ContentPageLayoutProps = {
  title: string;
  description?: string;
  lastUpdated?: string;
  backHref?: string;
  children: React.ReactNode;
};

export function ContentPageLayout({
  title,
  description,
  lastUpdated,
  backHref = "/",
  children,
}: ContentPageLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-800">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>

        <header className="mt-6 border-b border-neutral-200 pb-8">
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 text-base leading-7 text-neutral-600">{description}</p>
          ) : null}
          {lastUpdated ? (
            <p className="mt-3 text-sm text-neutral-500">Last updated: {lastUpdated}</p>
          ) : null}
        </header>

        <div className="mt-10 space-y-10">{children}</div>
      </div>

      <div
        className={`landing-page min-h-0! bg-transparent! ${syne.variable} ${dmSans.variable}`}
      >
        <LandingFooter />
      </div>
    </div>
  );
}

export function ContentSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  );
}

export function ContentBlock({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {title ? <h3 className="text-base font-medium text-neutral-900">{title}</h3> : null}
      <div className={title ? "mt-2 text-[15px] leading-7 text-neutral-600" : "text-[15px] leading-7 text-neutral-600"}>
        {children}
      </div>
    </div>
  );
}

export function ContentCallout({ children }: { children: React.ReactNode }) {
  return (
    <aside className="border-l-2 border-neutral-300 pl-4 text-[15px] leading-7 text-neutral-700">
      {children}
    </aside>
  );
}

export function ContentList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-neutral-600">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ContentFooterNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t border-neutral-200 pt-8 text-sm leading-6 text-neutral-500">
      {children}
    </p>
  );
}
