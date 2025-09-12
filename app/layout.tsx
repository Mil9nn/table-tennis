"use client"

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ModernNavbar from "@/components/ui/Navbar";
import { connectDB } from "@/lib/mongodb";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { axiosInstance } from "@/lib/axiosInstance";

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
        <ModernNavbar />
        <div className="pt-16 max-sm:pb-10">{children}</div>
        <Toaster
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toasterId="default"
          toastOptions={{
            // Define default options
            className: "",
            duration: 5000,
            removeDelay: 1000,
            style: {
              background: "#363636",
              color: "#fff",
            },

            // Default options for specific types
            success: {
              duration: 3000,
              iconTheme: {
                primary: "green",
                secondary: "black",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
