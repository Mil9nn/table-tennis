"use client";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { useEffect } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    async function initDB() {
      try {
        await axiosInstance.get("/connect");
      } catch (error) {
        console.error("Error connecting to MongoDB:", error);
      }
    }
    initDB();
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        <div className="pt-16 max-sm:pb-10">
          {children}
          <Toaster position="top-right" />
        </div>
      </body>
    </html>
  );
}
