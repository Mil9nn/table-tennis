"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, LogIn, LogOut } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useProfileStore } from "@/hooks/useProfileStore";

export default function Navbar() {
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
    <header className="w-full fixed top-0 bg-white border-b border-gray-200 z-50">
      {/* Brand */}
      <Link href="/" className="px-4 py-2 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
          <div className="bg-white w-2 h-2 rounded-full shadow"></div>
        </div>
        <span className="font-semibold text-gray-800">TTPro</span>
      </Link>
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-12">
        {/* Left: Brand + Menu */}
        <div className="flex items-center gap-4">
          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Image
                src="/svgs/menu.svg"
                alt="menu-icon"
                width={25}
                height={25}
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {navItems.map((item) => (
                <DropdownMenuItem asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-2 py-1 rounded-md ${
                      isActive(item.href)
                        ? "text-indigo-600 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Profile/Login */}
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
                <Link href="/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => logout()}
                className="flex items-center gap-2 text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/auth/login"
            className="flex items-center gap-2 bg-purple-500 rounded-full px-4 py-2 text-white font-medium hover:bg-purple-600 transition"
          >
            <LogIn className="size-4" />
            <span className="text-xs">Login</span>
          </Link>
        )}
      </nav>
    </header>
  );
}
