import { LandingPage } from "@/components/landing/LandingPage";
import { LandingThemeProvider } from "@/components/landing/LandingTheme";
import { createLandingMetadata } from "@/lib/landing/seo";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";

export const metadata = createLandingMetadata();

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

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export default function HomePage() {
  return (
    <LandingThemeProvider
      className={`landing-page ${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <LandingPage />
    </LandingThemeProvider>
  );
}
