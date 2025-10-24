import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import AuthProvider from "./providers/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider user={plainUser}>
          <Navbar />
          <div className="pt-14 w-full">
            {children}
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
