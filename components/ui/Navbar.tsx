"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Trophy, User, Clock, LogOut } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { Button } from "./button";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export default function ModernNavbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const navItems: NavItem[] = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Recent", href: "/recent", icon: Clock },
    { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  function isActive(href: string) {
    return pathname === href || (href !== "/" && pathname?.startsWith(href));
  }

  return (
    <>
      <header className="w-full fixed bg-white backdrop-blur-md border-b border-gray-200 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 p-2 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                <div className="bg-white w-3 h-3 rounded-full animate-bounce shadow-black shadow-md"></div>
              </div>
              <span className="font-semibold text-gray-800">TennisPro</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden sm:flex items-center gap-6">
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "text-indigo-600 bg-indigo-50 shadow-sm"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon
                      className={`w-4 h-4 ${
                        active ? "text-indigo-600" : "text-gray-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {user ? (
                <Button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </Button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium border transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 ${
                  active ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${active ? "text-indigo-600" : "text-gray-400"}`}
                />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
