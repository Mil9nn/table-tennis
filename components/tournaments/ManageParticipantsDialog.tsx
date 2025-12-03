"use client";

import { useState, useEffect } from "react";
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
import { Loader2, UserPlus, X, Search, Users, Save } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { Participant } from "@/types/tournament.type";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { ScrollArea } from "@/components/ui/scroll-area";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonIcon from '@mui/icons-material/Person';

interface ManageParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  participants: Participant[];
  onUpdate: (participants: Participant[]) => void;
}

export function ManageParticipantsDialog({
  open,
  onOpenChange,
  tournamentId,
  participants,
  onUpdate,
}: ManageParticipantsDialogProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track pending changes locally
  const [pendingAdds, setPendingAdds] = useState<User[]>([]);
  const [pendingRemoves, setPendingRemoves] = useState<string[]>([]);

  // Local state for current participants (includes pending changes)
  const [localParticipants, setLocalParticipants] = useState<Participant[]>([]);

  // Initialize local participants when dialog opens or participants change
  useEffect(() => {
    if (open) {
      setLocalParticipants(participants);
      setPendingAdds([]);
      setPendingRemoves([]);
      setQuery("");
      setSuggestions([]);
    }
  }, [open, participants]);

  const fetchSuggestions = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axiosInstance.get(`/users/search?q=${val}`);
      // Filter out users who are already participants (including pending adds)
      const existingIds = new Set([
        ...localParticipants.map((p) => p._id),
        ...pendingAdds.map((u) => u._id),
      ]);
      const filtered = (response.data?.users || []).filter(
        (u: User) => !existingIds.has(u._id)
      );
      setSuggestions(filtered);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setSearching(false);
    }
  };

  const addParticipant = (user: User) => {
    // Add to pending adds and local participants
    setPendingAdds([...pendingAdds, user]);
    setLocalParticipants([
      ...localParticipants,
      {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
      } as Participant,
    ]);

    // Clear search
    setQuery("");
    setSuggestions([]);
  };

  const removeParticipant = (participant: Participant) => {
    // Check if it's a pending add (not yet saved)
    const isPendingAdd = pendingAdds.some((u) => u._id === participant._id);

    if (isPendingAdd) {
      // Remove from pending adds
      setPendingAdds(pendingAdds.filter((u) => u._id !== participant._id));
    } else {
      // Add to pending removes
      setPendingRemoves([...pendingRemoves, participant._id]);
    }

    // Remove from local participants
    setLocalParticipants(
      localParticipants.filter((p) => p._id !== participant._id)
    );
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
        await axiosInstance.post(
          `/tournaments/${tournamentId}/add-participant`,
          {
            participantId: user._id,
          }
        );
      }

      // Apply all removals
      for (const participantId of pendingRemoves) {
        await axiosInstance.delete(
          `/tournaments/${tournamentId}/add-participant`,
          {
            data: { participantId },
          }
        );
      }

      // Fetch updated tournament to get latest participants
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      onUpdate(data.tournament.participants);

      toast.success(
        `Successfully ${
          pendingAdds.length > 0
            ? `added ${pendingAdds.length} participant${
                pendingAdds.length > 1 ? "s" : ""
              }`
            : ""
        }${pendingAdds.length > 0 && pendingRemoves.length > 0 ? " and " : ""}${
          pendingRemoves.length > 0
            ? `removed ${pendingRemoves.length} participant${
                pendingRemoves.length > 1 ? "s" : ""
              }`
            : ""
        }`
      );

      onOpenChange(false);
    } catch (err: any) {
      console.error("Error saving participants:", err);
      toast.error(err.response?.data?.error || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state
    setLocalParticipants(participants);
    setPendingAdds([]);
    setPendingRemoves([]);
    setQuery("");
    setSuggestions([]);
    onOpenChange(false);
  };

  const hasChanges = pendingAdds.length > 0 || pendingRemoves.length > 0;

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ManageAccountsIcon className="size-5 text-indigo-500" />
            <span className="text-indigo-500">Manage Participants</span>
          </DialogTitle>
          <DialogDescription>
            Add or remove participants before generating the draw.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search to add participants */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Add Participant
            </label>
            <div className="relative">
              <Input
                placeholder="Search users by name or username..."
                value={query}
                onChange={(e) => fetchSuggestions(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
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
                  {suggestions.map((u) => {
                    const displayName = u.fullName || u.username;

                    return (
                      <li
                        key={u._id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addParticipant(u)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={u.profileImage}
                              alt={displayName}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium">
                              {displayName}
                            </span>
                            <span className="text-xs text-slate-500">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
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
          </div>

          {/* Current participants list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                Participants ({localParticipants.length})
              </label>
            </div>

            <ScrollArea className="h-[240px] border rounded-lg">
              {localParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500">
                  <PersonIcon className="size-6 mb-2" />
                  <p className="text-sm">No participants yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {localParticipants.map((p) => {
                    const isPendingAdd = pendingAdds.some(
                      (u) => u._id === p._id
                    );
                    const isPendingRemove = pendingRemoves.includes(p._id);

                    return (
                      <div
                        key={p._id}
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
                              src={p.profileImage}
                              alt={p.username}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(p.fullName || p.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {p.fullName || p.username}
                              </span>
                              {isPendingAdd && (
                                <span className="text-xs text-green-600 font-medium">
                                  (new)
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              @{p.username}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(p)}
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
