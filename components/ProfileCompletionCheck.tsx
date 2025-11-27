"use client";

import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const ProfileCompletionCheck = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Routes that don't require profile completion
    const exemptRoutes = [
      "/auth/login",
      "/auth/register",
      "/complete-profile",
      "/",
    ];

    // Check if user is logged in, profile is incomplete, and not on an exempt route
    if (
      user &&
      !user.isProfileComplete &&
      !exemptRoutes.includes(pathname) &&
      !pathname.startsWith("/auth")
    ) {
      router.push("/complete-profile");
    }
  }, [user, pathname, router]);

  return null; // This component doesn't render anything
};

export default ProfileCompletionCheck;
