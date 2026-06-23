import type { ReactNode } from "react";

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="marketing min-h-screen bg-background">
      {children}
    </main>
  );
}
