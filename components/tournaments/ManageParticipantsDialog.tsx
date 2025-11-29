"use client";

import { useState } from "react";
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
import { Loader2, UserPlus, X, Search, Users } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { Participant } from "@/types/tournament.type";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const fetchSuggestions = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axiosInstance.get(`/users/search?q=${val}`);
      // Filter out users who are already participants
      const existingIds = participants.map((p) => p._id);
      const filtered = (response.data?.users || []).filter(
        (u: User) => !existingIds.includes(u._id)
      );
      setSuggestions(filtered);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setSearching(false);
    }
  };

  const addParticipant = async (user: User) => {
    setAddingId(user._id);
    try {
      const { data } = await axiosInstance.post(
        `/tournaments/${tournamentId}/add-participant`,
        { participantId: user._id }
      );
      
      onUpdate(data.tournament.participants);
      toast.success(`${user.fullName || user.username} added to tournament`);
      
      // Clear search
      setQuery("");
      setSuggestions([]);
    } catch (err: any) {
      console.error("Error adding participant:", err);
      toast.error(err.response?.data?.error || "Failed to add participant");
    } finally {
      setAddingId(null);
    }
  };

  const removeParticipant = async (participant: Participant) => {
    setRemovingId(participant._id);
    try {
      const { data } = await axiosInstance.delete(
        `/tournaments/${tournamentId}/add-participant`,
        { data: { participantId: participant._id } }
      );
      
      onUpdate(data.tournament.participants);
      toast.success(`${participant.fullName || participant.username} removed from tournament`);
    } catch (err: any) {
      console.error("Error removing participant:", err);
      toast.error(err.response?.data?.error || "Failed to remove participant");
    } finally {
      setRemovingId(null);
    }
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Manage Participants
          </DialogTitle>
          <DialogDescription>
            Add or remove participants before generating the tournament draw.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search to add participants */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Add Participant
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search users by name or username..."
                value={query}
                onChange={(e) => fetchSuggestions(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 200)}
                className="pl-9"
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
                    const isAdding = addingId === u._id;
                    
                    return (
                      <li
                        key={u._id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => !isAdding && addParticipant(u)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={u.profileImage} alt={displayName} />
                            <AvatarFallback className="text-xs">
                              {getInitial(displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium">{displayName}</span>
                            <span className="text-xs text-slate-500">@{u.username}</span>
                          </div>
                        </div>
                        
                        {isAdding ? (
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        ) : (
                          <UserPlus className="w-4 h-4 text-indigo-600" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {focused && query.length >= 2 && suggestions.length === 0 && !searching && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-center text-sm text-slate-500">
                  No users found
                </div>
              )}
            </div>
          </div>

          {/* Current participants list */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Current Participants ({participants.length})
            </label>
            
            <ScrollArea className="h-[240px] border rounded-lg">
              {participants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500">
                  <Users className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">No participants yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {participants.map((p) => {
                    const isRemoving = removingId === p._id;
                    
                    return (
                      <div
                        key={p._id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={p.profileImage} alt={p.username} />
                            <AvatarFallback className="text-xs">
                              {getInitial(p.fullName || p.username)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium text-slate-800">
                              {p.fullName || p.username}
                            </span>
                            <span className="text-xs text-slate-500">@{p.username}</span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(p)}
                          disabled={isRemoving}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          {isRemoving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

