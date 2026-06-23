import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { LandingThemeScript } from "@/components/landing/LandingTheme";
import { BRAND_NAME, SITE_URL } from "@/lib/landing/site";
import { OG_IMAGE, SEO_DESCRIPTION, SEO_KEYWORDS, SEO_TITLE } from "@/lib/landing/seo";

// For Vercel Dashboard
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SEO_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description: SEO_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: BRAND_NAME }],
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
  openGraph: {
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    type: "website",
    siteName: BRAND_NAME,
    images: [OG_IMAGE],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png",
  },
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" data-lp-theme="light" suppressHydrationWarning>
      <head>
        <LandingThemeScript />
      </head>
      <body className={`${inter.className} antialiased`}>
            <div className="min-h-screen">
              {children}
              <Analytics />
              <SpeedInsights />
              <Toaster position="top-right" />
            </div>
      </body>
    </html>
  );
}
