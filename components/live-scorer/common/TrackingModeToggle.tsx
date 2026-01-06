"use client";

import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMatchStore } from "@/hooks/useMatchStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function TrackingModeToggle() {
  const match = useMatchStore((s) => s.match);
  const shotTrackingMode = useMatchStore((s) => s.shotTrackingMode);
  const setShotTrackingMode = useMatchStore((s) => s.setShotTrackingMode);
  const user = useAuthStore((s) => s.user);

  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize from match or user preference when match loads
  useEffect(() => {
    if (match) {
      if (match.shotTrackingMode) {
        setShotTrackingMode(match.shotTrackingMode);
      } else if (user?.shotTrackingMode) {
        setShotTrackingMode(user.shotTrackingMode);
      } else {
        setShotTrackingMode("detailed");
      }
    }
  }, [match, user?.shotTrackingMode, setShotTrackingMode]);

  // Determine effective mode: match override > user preference > default "detailed"
  const effectiveMode =
    shotTrackingMode || user?.shotTrackingMode || "detailed";

  const handleToggle = async (checked: boolean) => {
    // Use match from closure - it's safe because we check it before rendering
    if (!match) return;

    const newMode: "detailed" | "simple" = checked ? "detailed" : "simple";
    setIsUpdating(true);

    try {
      // Update match's shotTrackingMode (mid-match override)
      const category = match.matchCategory;
      await axiosInstance.put(`/matches/${category}/${match._id}`, {
        shotTrackingMode: newMode,
      });

      setShotTrackingMode(newMode);
      toast.success(
        `Switched to ${newMode === "detailed" ? "Detailed" : "Simple"} tracking mode`
      );
    } catch (error: any) {
      console.error("Error updating tracking mode:", error);
      toast.error("Failed to update tracking mode");
    } finally {
      setIsUpdating(false);
    }
  };

  // Early return after all hooks are called - this is safe as long as hooks are always called
  if (!match) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 shadow-sm">
      <div className="flex-1">
        <Label htmlFor="tracking-mode" className="text-sm font-medium text-gray-700">
          Shot Tracking
        </Label>
        <p className="text-xs text-gray-500 mt-0.5">
          {effectiveMode === "detailed"
            ? "Record shot type, origin, and landing"
            : "Simple scoring only"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
        <Switch
          id="tracking-mode"
          checked={effectiveMode === "detailed"}
          onCheckedChange={handleToggle}
          disabled={isUpdating || !match}
        />
        <span className="text-xs text-gray-600 min-w-[60px]">
          {effectiveMode === "detailed" ? "Detailed" : "Simple"}
        </span>
      </div>
    </div>
  );
}

