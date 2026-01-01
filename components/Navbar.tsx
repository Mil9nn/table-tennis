"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LogIn, Plus, ChevronRight } from "lucide-react";
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
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const quickActionsButtonRef = useRef<HTMLButtonElement>(null);

  const user = useAuthStore((state) => state.user);
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

  // Desktop nav (excludes Home since logo links to /)
  const desktopNavItems = navItems.slice(1);

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
      <nav className="h-14 flex items-center justify-between px-4 border-b bg-zinc-900 shadow-sm gap-2 lg:gap-4">
        {/* Left: Hamburger + Logo + Quick Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
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
              className="w-5 h-5 bg-white"
            />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/imgs/logo.png" alt="logo" width={50} height={50} />
            <span
              className="text-base font-bold bg-gradient-to-r from-[#2fa4d9] to-[#4ac7f6] bg-clip-text text-transparent tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              TTPro
            </span>
          </Link>

          {/* Quick Actions */}
          <button
            ref={quickActionsButtonRef}
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className={cn(
              "hidden sm:flex ml-2 size-8 rounded-full items-center justify-center transition-all duration-200",
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
                "size-4 transition-transform duration-200",
                quickActionsOpen && "rotate-45"
              )}
            />
          </button>
        </div>

        {/* Right: Desktop Nav + Profile/Login */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-wrap">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-2 lg:px-3 py-2 font-medium text-xs lg:text-sm transition-all duration-300 relative",
                    active
                      ? "text-blue-500"
                      : "text-gray-400 hover:text-blue-400"
                  )}
                >
                  <Icon sx={{ fontSize: 18 }} />
                  {item.label}
                  {active && (
                    <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Profile */}
          {user ? (
            <Link
              href="/profile"
              className="cursor-pointer size-9 rounded-full ring-1 ring-gray-300 flex items-center justify-center hover:ring-indigo-500 overflow-hidden"
            >
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
            </Link>
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
          className="hidden sm:block absolute top-full left-0 right-0 bg-zinc-900 shadow-md z-40 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-2">
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
      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 w-72 sm:hidden z-40",
          "bg-zinc-900/95 backdrop-blur-xl",
          "border-r border-white/10",
          "transform transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-white/10">
          <span className="text-sm font-semibold tracking-wide text-white">
            Navigation
          </span>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-white/70 hover:text-white" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4 space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-white/40 px-2">
            Quick Actions
          </p>

          {[
            { label: "Create Match", href: "/match/create", icon: Plus },
            { label: "Create Team", href: "/teams/create", icon: Plus },
            {
              label: "Create Tournament",
              href: "/tournaments/create",
              icon: Plus,
            },
          ].map(({ label, href, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                router.push(href);
                setOpen(false);
              }}
              className="
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
          text-sm font-medium text-white/80
          bg-white/5 hover:bg-white/10
          transition-all
        "
            >
              <Icon className="w-4 h-4 text-indigo-400" />
              {label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="px-4 py-2">
          <p className="text-[11px] uppercase tracking-widest text-white/40 px-2 mb-2">
            Menu
          </p>

          <div className="space-y-1">
            {sidebarNav.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                    "text-sm font-medium transition-all",
                    active
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
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
