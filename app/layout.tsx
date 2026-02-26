import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import AuthProvider from "./providers/AuthProvider";

// For Vercel Dashboard
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from '@vercel/speed-insights/next';

export const metadata = {
  title: "Table Tennis Scorer - Live Match Scoring & Analytics",
  description: "Professional table tennis match scoring, shot tracking, and performance analytics. Track singles, doubles, and team matches with real-time statistics and leaderboards.",
  keywords: ["table tennis", "ping pong", "match scoring", "statistics", "tournament", "leaderboard"],
  authors: [{ name: "Table Tennis Scorer" }],
  openGraph: {
    title: "Table Tennis Scorer - Live Match Scoring & Analytics",
    description: "Professional table tennis match scoring, shot tracking, and performance analytics.",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192.png"
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
  
  await connectDB();

  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;
  let user = null;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded?.userId) {
      user = await User.findById(decoded.userId).select("-password");
    }
  }

  const plainUser = JSON.parse(JSON.stringify(user));

  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider user={plainUser}>
            <div className="h-screen">
              <Navbar />
              <main>
                {children}
                <Analytics />
                <SpeedInsights />
                <Toaster position="top-right" />
              </main>
            </div>
        </AuthProvider>
      </body>
    </html>
  );
}
