import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`landing-page admin-page ${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </div>
  );
}
