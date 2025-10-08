"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Sidebar,
  SidebarClose,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useProfileStore } from "@/hooks/useProfileStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const previewUrl = useProfileStore((state) => state.previewUrl);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Matches", href: "/matches" },
    { label: "Teams", href: "/teams" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  }

  const fallbackInitial = user?.fullName?.charAt(0).toUpperCase() || "?";

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Left: Brand */}
        <Link href="/" className="items-center hidden sm:flex">
          <img src="/imgs/logo.png" alt="logo" className="w-12 h-12" />
          <span className="font-semibold text-gray-800 text-lg italic">
            TTPro
          </span>
        </Link>

        <div className="flex items-center max-sm:justify-between max-sm:w-full gap-6">
          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition ${
                  isActive(item.href)
                    ? "text-indigo-600 font-semibold"
                    : "text-gray-700 hover:text-indigo-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Hamburger Menu (Mobile) */}
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 text-gray-700 hover:text-indigo-600"
          >
            {open ? (
              <X className="w-6 h-6" />
            ) : (
              <Image
                src="/svgs/menu.svg"
                alt="menu-icon"
                width={25}
                height={25}
              />
            )}
          </button>

          {/* Right: Profile/Login */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer w-9 h-9 rounded-full ring-1 ring-gray-300 flex items-center justify-center hover:ring-indigo-500 overflow-hidden">
                    {user?.profileImage ? (
                      <img
                        src={previewUrl || user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-600">
                        {fallbackInitial}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  <div className="px-3 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">
                      {user.fullName || user.username}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>

                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 font-semibold"
                    >
                      Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-red-500 focus:text-red-600"
                  >
                    <span className="font-semibold text-sm">Logout</span>
                    <LogOut className="size-5 text-red-500" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-2 text-xs bg-purple-500 rounded-full px-4 py-2 text-white font-medium hover:bg-purple-600 transition"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out sm:hidden z-40 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center px-6 py-4 border-b">
          <img src="/imgs/logo.png" alt="logo" className="w-12 h-12" />
          <span className="font-semibold text-gray-800 text-lg italic">
            TTPro
          </span>
        </div>

        {/* Sidebar Links */}
        <div className="flex flex-col px-6 py-6 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`text-base font-medium transition ${
                isActive(item.href)
                  ? "text-indigo-600 font-semibold"
                  : "text-gray-700 hover:text-indigo-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Overlay when sidebar is open */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm sm:hidden z-30"
        />
      )}
    </header>
  );
}
