"use client";

import { Moon, Sun } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export type LandingTheme = "dark" | "light";

const STORAGE_KEY = "lp-theme";

type LandingThemeContextValue = {
  theme: LandingTheme;
  setTheme: (theme: LandingTheme) => void;
  toggleTheme: () => void;
};

const LandingThemeContext = createContext<LandingThemeContextValue | null>(null);

function readStoredTheme(): LandingTheme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: LandingTheme) {
  document.documentElement.dataset.lpTheme = theme;
}

export function LandingThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("${STORAGE_KEY}");document.documentElement.dataset.lpTheme=t==="dark"?"dark":"light"}catch(e){document.documentElement.dataset.lpTheme="light"}})();`,
      }}
    />
  );
}

export function LandingThemeProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [theme, setThemeState] = useState<LandingTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: LandingTheme) => {
    setThemeState(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return (
    <LandingThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      <div
        className={className}
        data-theme={mounted ? theme : undefined}
        suppressHydrationWarning
      >
        {children}
      </div>
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme() {
  const ctx = useContext(LandingThemeContext);
  if (!ctx) {
    throw new Error("useLandingTheme must be used within LandingThemeProvider");
  }
  return ctx;
}

export function LandingThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useLandingTheme();
  const isLight = theme === "light";
  const id = "landing-theme-toggle";

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-full border border-[var(--lp-border)] bg-[var(--lp-surface)]/60 px-3 py-1.5",
        className
      )}
    >
      <Sun
        className={cn(
          "size-3.5 shrink-0 transition-colors",
          isLight ? "text-[var(--lp-accent)]" : "text-[var(--lp-text-muted)]"
        )}
        aria-hidden="true"
      />
      <Switch
        id={id}
        checked={isLight}
        onCheckedChange={(checked) => setTheme(checked ? "light" : "dark")}
        aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
        className="h-5 w-9 border border-[var(--lp-border)] bg-[var(--lp-bg)] data-[state=checked]:bg-[var(--lp-accent)] data-[state=unchecked]:bg-[var(--lp-bg)] focus-visible:ring-[var(--lp-accent)]/40 [&_[data-slot=switch-thumb]]:size-4 [&_[data-slot=switch-thumb]]:bg-[var(--lp-text)] data-[state=checked]:[&_[data-slot=switch-thumb]]:bg-[var(--lp-on-accent)]"
      />
      <Moon
        className={cn(
          "size-3.5 shrink-0 transition-colors",
          !isLight ? "text-[var(--lp-accent)]" : "text-[var(--lp-text-muted)]"
        )}
        aria-hidden="true"
      />
      <label
        htmlFor={id}
        className="sr-only"
      >
        {isLight ? "Light mode on" : "Dark mode on"}
      </label>
    </div>
  );
}
