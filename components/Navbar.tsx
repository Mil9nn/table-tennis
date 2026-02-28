"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { X, LogIn, Plus } from "lucide-react";
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

  const desktopNavItems = navItems.slice(1);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  }

  useEffect(() => {
    if (!quickActionsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(e.target as Node) &&
        !quickActionsButtonRef.current?.contains(e.target as Node)
      )
        setQuickActionsOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQuickActionsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [quickActionsOpen]);

  useEffect(() => setQuickActionsOpen(false), [pathname]);

  const quickActionLinks = [
    { label: "Create Match", href: "/match/create", icon: AddCircleOutlineIcon },
    { label: "Create Team", href: "/teams/create", icon: GroupAddIcon },
    { label: "Create Tournament", href: "/tournaments/create", icon: SportsMmaIcon },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

        .nav-font { font-family: 'Syne', sans-serif; }
        .body-font { font-family: 'DM Sans', sans-serif; }

        .nav-link-item {
          position: relative;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          color: rgba(255,255,255,0.45);
          padding: 6px 10px;
          border-radius: 8px;
          transition: color 0.2s ease, background 0.2s ease;
          display: flex;
          align-items: center;
          gap: 5px;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-link-item:hover {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.06);
        }
        .nav-link-item.active {
          color: #fff;
          background: rgba(96, 165, 250, 0.12);
        }
        .nav-link-item.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 2px 2px 0 0;
        }

        .qa-btn {
          width: 32px; height: 32px;
          border-radius: 10px;
          align-items: center; justify-content: center;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .qa-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
        .qa-btn.active {
          background: rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.5);
          color: #60a5fa;
        }

        .qa-panel {
          background: #1e1e1e;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .qa-pill {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          transition: all 0.18s ease;
        }
        .qa-pill:hover {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(59, 130, 246, 0.35);
          color: #93c5fd;
        }

        .profile-ring {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.15);
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.2s ease, transform 0.2s ease;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.07);
        }
        .profile-ring:hover { border-color: #60a5fa; transform: scale(1.05); }

        .login-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border-radius: 999px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.75rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: 0.02em;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 0 rgba(59,130,246,0);
        }
        .login-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }
        .login-btn:active { transform: scale(0.97); }

        /* Sidebar */
        .sidebar {
          background: #141414;
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .sidebar-section-label {
          font-family: 'Syne', sans-serif;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding: 0 12px;
          margin-bottom: 6px;
        }
        .sidebar-item {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.84rem;
          font-weight: 500;
          color: rgba(255,255,255,0.55);
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
        }
        .sidebar-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
        .sidebar-item.active { background: rgba(59,130,246,0.12); color: #93c5fd; }

        .sidebar-qa-item {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          cursor: pointer;
          transition: all 0.18s ease;
          text-align: left;
        }
        .sidebar-qa-item:hover { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.25); color: #93c5fd; }
      `}</style>

      <header className="w-full">
        {/* Navbar */}
        <nav
          style={{
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            background: "#1a1a1a",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
            gap: "12px",
          }}
        >
          {/* Left */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Hamburger (mobile) */}
            <button
              className="sm:hidden w-8 h-8 flex items-center justify-center bg-white/10 border border-white/20 rounded-lg cursor-pointer hover:bg-white/15 transition-colors"
              onClick={() => setOpen(true)}
            >
              <Image
                src="/svgs/menu.svg"
                alt="menu"
                width={16}
                height={16}
                className="invert opacity-70"
              />
            </button>

            {/* Logo */}
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
              <Image src="/imgs/logo.png" alt="logo" width={34} height={34} />
              <span
                className="nav-font"
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #60a5fa, #93c5fd)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-0.02em",
                }}
              >
                TTPro
              </span>
            </Link>

            {/* Divider */}
            <div
              className="hidden sm:block"
              style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }}
            />

            {/* Quick Actions Button */}
            <button
              ref={quickActionsButtonRef}
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className={cn("hidden sm:flex qa-btn", quickActionsOpen && "active")}
              aria-label="Quick Actions"
              aria-expanded={quickActionsOpen}
            >
              <Plus
                className="w-[15px] h-[15px] transition-transform duration-200"
                style={{
                  transform: quickActionsOpen ? "rotate(45deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </div>

          {/* Center: Desktop Nav */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "2px", flex: 1, justifyContent: "center" }}>
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("nav-link-item", active && "active")}
                >
                  <Icon sx={{ fontSize: 15 }} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Profile / Login */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {user ? (
              <Link href="/profile" className="profile-ring">
                {user?.profileImage ? (
                  <Image
                    src={previewUrl || user.profileImage}
                    alt="Profile"
                    width={36}
                    height={36}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span
                    className="nav-font"
                    style={{ fontSize: "0.8rem", fontWeight: 700, color: "#93c5fd" }}
                  >
                    {fallbackInitial}
                  </span>
                )}
              </Link>
            ) : (
              <Link href="/auth/login" className="login-btn">
                <LogIn style={{ width: 13, height: 13 }} />
                Login
              </Link>
            )}
          </div>
        </nav>

        {/* Quick Actions Panel */}
        {quickActionsOpen && (
          <div
            ref={quickActionsRef}
            id="quick-actions-panel"
            className="hidden sm:block qa-panel"
            style={{
              padding: "10px 16px",
              animation: "qaSlideIn 0.15s ease forwards",
            }}
          >
            <style>{`
              @keyframes qaSlideIn {
                from { opacity: 0; transform: translateY(-6px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "8px", alignItems: "center" }}>
              <span
                className="nav-font"
                style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.2)", textTransform: "uppercase", marginRight: 4 }}
              >
                Quick
              </span>
              {quickActionLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setQuickActionsOpen(false)}
                  className="qa-pill"
                >
                  <Icon sx={{ fontSize: 13 }} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Sidebar */}
        <div
          className="sm:hidden sidebar"
          style={{
            position: "fixed",
            inset: "0 auto 0 0",
            width: "280px",
            zIndex: 40,
            transform: open ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Sidebar Header */}
          <div
            style={{
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image src="/imgs/logo.png" alt="logo" width={26} height={26} />
              <span
                className="nav-font"
                style={{ fontSize: "0.95rem", fontWeight: 800, color: "#93c5fd", letterSpacing: "-0.02em" }}
              >
                TTPro
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: 30, height: 30,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              <X style={{ width: 15, height: 15, color: "rgba(255,255,255,0.5)" }} />
            </button>
          </div>

          {/* Sidebar Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Quick Actions */}
            <div>
              <div className="sidebar-section-label">Quick Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {quickActionLinks.map(({ label, href, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => { router.push(href); setOpen(false); }}
                    className="sidebar-qa-item"
                  >
                    <Icon sx={{ fontSize: 16, color: "#60a5fa" }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <div className="sidebar-section-label">Menu</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {navItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => { router.push(item.href); setOpen(false); }}
                      className={cn("sidebar-item", active && "active")}
                    >
                      <Icon sx={{ fontSize: 17 }} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          {!user && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => { router.push("/auth/login"); setOpen(false); }}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px",
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  borderRadius: 12,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <LogIn style={{ width: 15, height: 15 }} />
                Sign in to your account
              </button>
            </div>
          )}
        </div>

        {/* Overlay */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="sm:hidden"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 30,
              animation: "fadeIn 0.2s ease",
            }}
          />
        )}
      </header>
    </>
  );
}