"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LogIn, LogOut, Plus, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import HouseIcon from "@mui/icons-material/House";
import JoinRightIcon from "@mui/icons-material/JoinRight";
import GroupWorkIcon from "@mui/icons-material/GroupWork";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import EditNoteIcon from "@mui/icons-material/EditNote";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
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
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const quickActionsButtonRef = useRef<HTMLButtonElement>(null);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const previewUrl = useProfileStore((state) => state.previewUrl);

  const fallbackInitial = user?.fullName?.charAt(0).toUpperCase() || "?";

  const navItems = [
    { label: "Home", href: "/", icon: HouseIcon },
    { label: "Matches", href: "/matches", icon: JoinRightIcon },
    { label: "Tournaments", href: "/tournaments", icon: EmojiEventsIcon },
    { label: "Teams", href: "/teams", icon: GroupWorkIcon },
    { label: "Leaderboard", href: "/leaderboard", icon: LeaderboardIcon },
    { label: "Scorer", href: "/scorer", icon: EditNoteIcon },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  }

  // Quick Actions Panel: close on click outside or Escape
  useEffect(() => {
    if (!quickActionsOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target as Node) &&
        !quickActionsButtonRef.current?.contains(event.target as Node)
      ) {
        setQuickActionsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickActionsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [quickActionsOpen]);

  // Close panels on route change
  useEffect(() => setQuickActionsOpen(false), [pathname]);

  // Sidebar nav cards (Profile-style)
  const sidebarNav = navItems;

  return (
    <header className="w-full fixed top-0 left-0 z-50">
      {/* Top Navbar */}
      <nav className="h-14 flex items-center justify-between px-4 border-b bg-white shadow-sm">
        {/* Left: Hamburger + Logo + Desktop Nav */}
        <div className="flex items-center gap-2">
          {/* Hamburger Menu (mobile) */}
          <button
            className="sm:hidden p-2 text-gray-700 hover:text-indigo-600"
            onClick={() => setOpen(true)}
          >
            <Image
              src="/svgs/menu.svg"
              alt="menu-icon"
              width={25}
              height={25}
              className="w-5 h-5"
            />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0"
          >
            <Image src="/imgs/logo.png" alt="logo" width={50} height={50} />
            <span className="text-base font-bold bg-linear-to-r from-[#3c6e71] to-[#284b63] bg-clip-text text-transparent tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              TTPro
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 font-medium text-sm transition-all duration-300 relative",
                    active
                      ? "text-indigo-600"
                      : "text-gray-700 hover:text-indigo-600"
                  )}
                >
                  <Icon sx={{ fontSize: 18 }} />
                  {item.label}
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Actions + Profile/Login */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <button
            ref={quickActionsButtonRef}
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

          {/* Profile */}
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
              className="flex items-center gap-2 text-xs bg-purple-500 rounded-full px-4 py-2 text-white font-medium hover:bg-purple-600 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <LogIn className="size-4" />
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Quick Actions Panel - Secondary Utility Controls */}
      {quickActionsOpen && (
        <div
          ref={quickActionsRef}
          id="quick-actions-panel"
          role="region"
          aria-label="Quick Actions Menu"
          className="hidden sm:block absolute top-full left-0 right-0 bg-linear-to-b from-white to-gray-50 border-b border-gray-100 shadow-md z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Quick Actions
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/match/create"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors duration-150"
              >
                <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                <span>Create Match</span>
              </Link>

              <Link
                href="/teams/create"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors duration-150"
              >
                <GroupAddIcon sx={{ fontSize: 16 }} />
                <span>Create Team</span>
              </Link>

              <Link
                href="/tournaments/create"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded hover:border-gray-300 hover:bg-gray-50 transition-colors duration-150"
              >
                <SportsMmaIcon sx={{ fontSize: 16 }} />
                <span>Create Tournament</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-[#d9d9d9] transform transition-transform duration-300 ease-in-out sm:hidden z-40 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Quick Actions - Secondary/Utility Panel */}
        <div className="border-b-2 border-black/50 bg-gray-200">
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Quick Actions
            </div>
          </div>
          <div className="flex flex-col gap-px">
            <button
              onClick={() => {
                router.push("/match/create");
                setOpen(false);
              }}
              className="group bg-white/50 text-left w-full transition-colors hover:bg-[#3c6e71]"
            >
              <div className="px-6 py-2 flex items-center gap-3">
                <AddCircleOutlineIcon
                  sx={{ fontSize: 22, color: "#3c6e71" }}
                  className="group-hover:!text-white transition-colors"
                />
                <span className="text-sm font-semibold tracking-wide text-[#353535] group-hover:text-white transition-colors">
                  Create Match
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                router.push("/teams/create");
                setOpen(false);
              }}
              className="group bg-white/50 text-left w-full transition-colors hover:bg-[#3c6e71]"
            >
              <div className="px-6 py-2 flex items-center gap-3">
                <GroupAddIcon
                  sx={{ fontSize: 22, color: "#3c6e71" }}
                  className="group-hover:!text-white transition-colors"
                />
                <span className="text-sm font-semibold tracking-wide text-[#353535] group-hover:text-white transition-colors">
                  Create Team
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                router.push("/tournaments/create");
                setOpen(false);
              }}
              className="group bg-white/50 text-left w-full transition-colors hover:bg-[#3c6e71]"
            >
              <div className="px-6 py-2 flex items-center gap-3">
                <SportsMmaIcon
                  sx={{ fontSize: 22, color: "#3c6e71" }}
                  className="group-hover:!text-white transition-colors"
                />
                <span className="text-sm font-semibold tracking-wide text-[#353535] group-hover:text-white transition-colors">
                  Create Tournament
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex flex-col gap-px">
          {sidebarNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setOpen(false);
                }}
                className={cn(
                  "group bg-white text-left transition-colors",
                  active ? "bg-[#3c6e71]" : "hover:bg-[#3c6e71]"
                )}
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon
                      sx={{
                        fontSize: 22,
                        color: active ? "#ffffff" : "#3c6e71",
                      }}
                      className="group-hover:!text-white transition-colors"
                    />
                    <span
                      className={cn(
                        "text-sm font-semibold tracking-wide",
                        active ? "text-white" : "text-[#353535]",
                        "group-hover:text-white"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#d9d9d9] group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm sm:hidden z-30"
        />
      )}
    </header>
  );
}
