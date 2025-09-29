"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/hooks/useAuthStore";
import type { User } from "@/types/user";

export default function AuthProvider({ user, children }: { user: User | null; children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return <>{children}</>;
}