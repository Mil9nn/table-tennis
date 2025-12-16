"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2, X, Shield, UserPlus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { UserParticipant } from "@/types/tournament.type";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const MAX_SCORERS = 10;

interface ManageScorersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  organizer: UserParticipant;
  scorers: UserParticipant[];
  onUpdate: (scorers: UserParticipant[]) => void;
}

export function ManageScorersDialog({
  open,
  onOpenChange,
  tournamentId,
  organizer,
  scorers,
  onUpdate,
}: ManageScorersDialogProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track pending changes locally
  const [pendingAdds, setPendingAdds] = useState<User[]>([]);
  const [pendingRemoves, setPendingRemoves] = useState<string[]>([]);

  // Local state for current scorers (includes pending changes)
  const [localScorers, setLocalScorers] = useState<UserParticipant[]>([]);

  useEffect(() => {
    if (open) {
      setLocalScorers(scorers || []);
      setPendingAdds([]);
      setPendingRemoves([]);
      setQuery("");
      setSuggestions([]);
      setFocused(false);
    }
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, [open, scorers]);

  const fetchSuggestions = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axiosInstance.get(`/users/search?q=${val}`);

      const existingIds = new Set([
        organizer._id,
        ...localScorers.map((s) => s._id),
        ...pendingAdds.map((u) => u._id),
      ]);

      const filtered = (response.data?.users || []).filter(
        (user: User) => !existingIds.has(user._id)
      );
      setSuggestions(filtered);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setSearching(false);
    }
  };

  const addScorer = (user: User) => {
    const scorerId = user._id;

    // Check if this scorer was previously removed in this session
    const wasPendingRemove = pendingRemoves.includes(scorerId);

    if (wasPendingRemove) {
      // Remove from pending removes (undoing the removal)
      setPendingRemoves(pendingRemoves.filter((id) => id !== scorerId));
    } else {
      // Add to pending adds (new addition)
      setPendingAdds([...pendingAdds, user]);
    }

    const newScorer: UserParticipant = {
      _id: user._id,
      username: user.username,
      fullName: user.fullName,
      profileImage: user.profileImage,
    };

    setLocalScorers([...localScorers, newScorer]);

    // Clear search
    setQuery("");
    setSuggestions([]);
  };

  const removeScorer = (scorer: UserParticipant) => {
    const scorerId = scorer._id;

    // Check if it's a pending add (not yet saved)
    const isPendingAdd = pendingAdds.some((user) => user._id === scorerId);

    if (isPendingAdd) {
      // Remove from pending adds
      setPendingAdds(pendingAdds.filter((user) => user._id !== scorerId));
    } else {
      // Add to pending removes
      setPendingRemoves([...pendingRemoves, scorerId]);
    }

    // Remove from local scorers
    setLocalScorers(localScorers.filter((s) => s._id !== scorerId));
  };

  const handleSave = async () => {
    if (pendingAdds.length === 0 && pendingRemoves.length === 0) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      // Apply all additions
      for (const user of pendingAdds) {
        await axiosInstance.post(`/tournaments/${tournamentId}/scorers`, {
          userId: user._id,
        });
      }

      // Apply all removals
      for (const scorerId of pendingRemoves) {
        await axiosInstance.delete(
          `/tournaments/${tournamentId}/scorers/${scorerId}`
        );
      }

      toast.success(
        `Successfully ${
          pendingAdds.length > 0
            ? `added ${pendingAdds.length} ${
                pendingAdds.length > 1 ? "scorers" : "scorer"
              }`
            : ""
        }${pendingAdds.length > 0 && pendingRemoves.length > 0 ? " and " : ""}${
          pendingRemoves.length > 0
            ? `removed ${pendingRemoves.length} ${
                pendingRemoves.length > 1 ? "scorers" : "scorer"
              }`
            : ""
        }`
      );

      // Fetch updated tournament to get latest scorers
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      onUpdate(data.tournament.scorers);

      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving scorers:", err);
      toast.error(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state
    setLocalScorers(scorers);
    setPendingAdds([]);
    setPendingRemoves([]);
    setQuery("");
    setSuggestions([]);
    onOpenChange(false);
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  const canAddMore = localScorers.length < MAX_SCORERS;
  const hasChanges = pendingAdds.length > 0 || pendingRemoves.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-indigo-500" />
            <span className="text-indigo-500">Manage Scorers</span>
          </DialogTitle>
          <DialogDescription>
            Add users who can score matches in this tournament.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Admin section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Admin</label>
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={organizer.profileImage}
                    alt={organizer.fullName || organizer.username}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitial(organizer.fullName || organizer.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-slate-800">
                    {organizer.fullName || organizer.username}
                  </span>
                  <span className="text-xs text-slate-500">
                    @{organizer.username}
                  </span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-700"
              >
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </div>
          </div>

          {/* Search to add scorers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Scorers ({localScorers.length}/{MAX_SCORERS})
              </label>
            </div>
            {canAddMore ? (
              <div className="relative">
                <Input
                  placeholder="Search users by name or username..."
                  value={query}
                  onChange={(e) => fetchSuggestions(e.target.value)}
                  onFocus={() => {
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                    }
                    setFocused(true);
                  }}
                  onBlur={() => {
                    blurTimeoutRef.current = setTimeout(
                      () => setFocused(false),
                      200
                    );
                  }}
                  className="pl-2 placeholder:text-sm"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <BlinkingDotsLoader />
                  </div>
                )}

                {/* Dropdown suggestions */}
                {focused && suggestions.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                    {suggestions.map((user) => (
                      <li
                        key={user._id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addScorer(user)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={user.profileImage}
                              alt={user.fullName || user.username}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(user.fullName || user.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium">
                              {user.fullName || user.username}
                            </span>
                            <span className="text-xs text-slate-500">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {focused &&
                  query.length >= 2 &&
                  suggestions.length === 0 &&
                  !searching && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-sm text-slate-500">
                      No users found
                    </div>
                  )}
              </div>
            ) : (
              <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                Maximum {MAX_SCORERS} scorers reached. Remove a scorer to add
                more.
              </p>
            )}
          </div>

          {/* Current scorers list */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Scorers ({localScorers.length}/{MAX_SCORERS})
            </label>
            <ScrollArea className="h-[200px] border rounded-lg">
              {localScorers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500">
                  <UserPlus className="size-6 mb-2" />
                  <p className="text-sm">No scorers added yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Only the admin can score matches
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {localScorers.map((scorer) => {
                    const scorerId = scorer._id;
                    const isPendingAdd = pendingAdds.some(
                      (user) => user._id === scorerId
                    );
                    const isPendingRemove = pendingRemoves.includes(scorerId);

                    return (
                      <div
                        key={scorerId}
                        className={`flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors ${
                          isPendingAdd
                            ? "bg-green-50"
                            : isPendingRemove
                            ? "bg-red-50 opacity-60"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={scorer.profileImage}
                              alt={scorer.fullName || scorer.username}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(scorer.fullName || scorer.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {scorer.fullName || scorer.username}
                              </span>
                              {isPendingAdd && (
                                <span className="text-xs text-green-600 font-medium">
                                  (new)
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              @{scorer.username}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeScorer(scorer)}
                          disabled={saving}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Save/Cancel buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="min-w-[100px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
