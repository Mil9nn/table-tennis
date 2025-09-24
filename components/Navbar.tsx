"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, User, LogOut } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export default function Navbar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Updated navigation items based on your actual app structure
  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Matches", href: "/matches" },
    { label: "Teams", href: "/teams" },
  ];

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
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

            {/* Mobile Profile Dropdown */}
            <div className="sm:hidden">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="cursor-pointer w-10 h-10 rounded-full ring-2 ring-gray-500 flex items-center justify-center hover:ring-indigo-500 overflow-hidden transition-all">
                      {user?.profileImage ? (
                        <img
                          src={user?.profileImage}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-700" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    {user && (
                      <>
                        <div className="px-3 py-2 text-sm text-gray-700 border-b">
                          <div className="font-medium">
                            {user.fullName || user.username}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.email}
                          </div>
                        </div>

                        <DropdownMenuItem asChild>
                          <Link
                            href="/profile"
                            className="flex items-center gap-2"
                          >
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
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-6">
              {/* Main Navigation Links */}
              <div className="flex items-center gap-4">
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                        active
                          ? "text-indigo-600 bg-indigo-50 shadow-sm"
                          : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {user && <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer w-10 h-10 rounded-full ring-2 ring-gray-300 flex items-center justify-center hover:ring-indigo-500 overflow-hidden transition-all">
                    {user?.profileImage ? (
                      <img
                        src={user?.profileImage}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-gray-700" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48" align="end">
                  {user && (
                    <>
                      <div className="px-3 py-2 text-sm text-gray-700 border-b">
                        <div className="font-medium">
                          {user.fullName || user.username}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>

                      <DropdownMenuItem asChild>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2"
                        >
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
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>}
            </div>
            {!user && <Link href="/auth/login" className="flex items-center gap-2 bg-purple-500 rounded-full p-2 px-4 text-white font-semibold">
              <LogIn className="w-4 h-4" />
              Login
            </Link>}
          </div>
        </nav>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${
                  active ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {item.icon && <item.icon className="w-6 h-6 mb-1" />}
                <span className={`text-xs ${active ? "font-medium" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
