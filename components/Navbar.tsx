"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LogIn, LogOut, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import HouseIcon from "@mui/icons-material/House";
import JoinRightIcon from "@mui/icons-material/JoinRight";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
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
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const previewUrl = useProfileStore((state) => state.previewUrl);

  const navItems = [
    { label: "Home", href: "/", icon: HouseIcon },
    { label: "Matches", href: "/matches", icon: JoinRightIcon },
    { label: "Tournaments", href: "/tournaments", icon: EmojiEventsIcon },
    { label: "Teams", href: "/teams", icon: GroupWorkIcon },
    { label: "Leaderboard", href: "/leaderboard", icon: LeaderboardIcon },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  }

  const fallbackInitial = user?.fullName?.charAt(0).toUpperCase() || "?";

  // Handle click outside and escape key for quick actions panel
  useEffect(() => {
    if (!quickActionsOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target as Node)
      ) {
        setQuickActionsOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setQuickActionsOpen(false);
      }
    }

    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }, 0);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [quickActionsOpen]);

  // Auto-close quick actions panel on route change
  useEffect(() => {
    setQuickActionsOpen(false);
  }, [pathname]);

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Left: Brand & Quick Actions */}
        <div className="flex items-center gap-3">
          <Link href="/" className="items-center hidden sm:flex">
            <Image
              src="/imgs/logo.png"
              alt="logo"
              width={48}
              height={48}
              className="w-12 h-12"
              priority
            />
            <span className="font-semibold text-gray-800 text-lg italic">
              TTPro
            </span>
          </Link>

          {/* Quick Actions Toggle (Desktop Only) */}
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className={cn(
              "hidden sm:flex size-9 rounded-full items-center justify-center transition-all duration-200",
              quickActionsOpen
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
            )}
            aria-label="Quick Actions"
            aria-expanded={quickActionsOpen}
            aria-controls="quick-actions-panel"
          >
            <Plus
              className={cn(
                "size-5 transition-transform duration-200",
                quickActionsOpen && "rotate-45"
              )}
            />
          </button>
        </div>

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
              <X className="size-5" />
            ) : (
              <div className="p-2 shadow-md rounded-full">
                <Image
                  src="/svgs/menu.svg"
                  alt="menu-icon"
                  width={25}
                  height={25}
                  className="w-4"
                />
              </div>
            )}
          </button>

          {/* Right: Profile/Login */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer size-9 rounded-full ring-1 ring-gray-300 flex items-center justify-center hover:ring-indigo-500 overflow-hidden">
                    {user?.profileImage ? (
                      <Image
                        src={previewUrl || user.profileImage}
                        alt="Profile"
                        width={48}
                        height={48}
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
                    onClick={() => {
                      logout();
                      router.push("/");
                    }}
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
                <LogIn className="size-4" />
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Quick Actions Panel (Desktop Only) */}
      {quickActionsOpen && (
        <div
          ref={quickActionsRef}
          id="quick-actions-panel"
          role="region"
          aria-label="Quick Actions Menu"
          className="hidden sm:block absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex gap-3 justify-start max-w-md">
              {/* Create Match */}
              <Link
                href="/match/create"
                onClick={() => setQuickActionsOpen(false)}
                className="
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  font-medium text-sm transition-all
                  bg-black text-white
                  hover:bg-black/90 active:scale-95
                  shadow-sm hover:shadow-md
                "
              >
                <JoinRightIcon sx={{ fontSize: 20 }} />
                <span>Create Match</span>
              </Link>

              {/* Create Team */}
              <Link
                href="/teams/create"
                onClick={() => setQuickActionsOpen(false)}
                className="
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  font-medium text-sm transition-all
                  bg-indigo-600 text-white
                  hover:bg-indigo-700 active:scale-95
                  shadow-sm hover:shadow-md
                "
              >
                <GroupWorkIcon sx={{ fontSize: 20 }} />
                <span>Create Team</span>
              </Link>

              {/* Create Tournament */}
              <Link
                href="/tournaments/create"
                onClick={() => setQuickActionsOpen(false)}
                className="
                  flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                  font-medium text-sm transition-all
                  bg-gray-200 text-gray-900
                  hover:bg-gray-300 active:scale-95
                  shadow-sm hover:shadow-md
                "
              >
                <EmojiEventsIcon sx={{ fontSize: 20 }} />
                <span>Create Tournament</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out sm:hidden z-40 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center px-6 py-4 border-b">
          <Image
            src="/imgs/logo.png"
            alt="logo"
            width={48}
            height={48}
            className="size-12"
          />
          <span className="font-semibold text-gray-800 text-lg italic">
            TTPro
          </span>
        </div>

        {/* Create Buttons */}
        <div className="flex flex-col border-b">
          {/* Create Match */}
          <Link
            href="/match/create"
            onClick={() => setOpen(false)}
            className="
            flex items-center justify-center gap-2 w-full py-4
            font-medium text-sm transition-all
            bg-black text-white
            hover:bg-black/80 active:bg-black/90
            "
          >
            <JoinRightIcon sx={{ fontSize: 20 }} />
            Create a Match
          </Link>

          {/* Create Team */}
          <Link
            href="/teams/create"
            onClick={() => setOpen(false)}
            className="
              flex items-center justify-center gap-2 w-full py-4
              font-medium text-sm transition-all
              bg-indigo-600 text-white
              hover:bg-indigo-700 active:bg-indigo-800
            "
          >
            <GroupWorkIcon sx={{ fontSize: 20 }} />
            Create a Team
          </Link>

          {/* Create Tournament */}
          <Link
            href="/tournaments/create"
            onClick={() => setOpen(false)}
            className="
              flex items-center justify-center gap-2 w-full py-4
              font-medium text-sm transition-all
              bg-gray-200 text-gray-900
              hover:bg-gray-300 active:bg-gray-400
            "
          >
            <EmojiEventsIcon sx={{ fontSize: 20 }} />
            Create a Tournament
          </Link>
        </div>

        {/* Sidebar Links */}
        <div className="flex flex-col pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 text-base font-medium px-6 py-3 transition ${
                  isActive(item.href)
                    ? "text-indigo-600 font-semibold bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                <Icon
                  sx={{
                    fontSize: 24,
                    color: isActive(item.href) ? "#4f46e5" : "#374151",
                  }}
                />
                {item.label}
              </Link>
            );
          })}
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
