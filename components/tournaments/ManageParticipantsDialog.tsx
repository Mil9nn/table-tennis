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
import { Loader2, X, Users2, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@/types/user";
import { 
  Participant, 
  TeamParticipant, 
  UserParticipant,
  isTeamParticipant,
  getParticipantDisplayName,
  getParticipantImage,
} from "@/types/tournament.type";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { ScrollArea } from "@/components/ui/scroll-area";

import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";

// Team type from search results
interface TeamSearchResult {
  _id: string;
  name: string;
  logo?: string;
  city?: string;
  captain?: {
    _id: string;
    username: string;
    fullName?: string;
  };
  players?: any[];
}

interface ManageParticipantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  participants: Participant[];
  category: "individual" | "team";
  matchType?: "singles" | "doubles" | "mixed_doubles";
  onUpdate: (participants: Participant[]) => void;
}

export function ManageParticipantsDialog({
  open,
  onOpenChange,
  tournamentId,
  participants,
  category,
  matchType = "singles",
  onUpdate,
}: ManageParticipantsDialogProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<(User | TeamSearchResult)[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [saving, setSaving] = useState(false);

  // Track pending changes locally
  const [pendingAdds, setPendingAdds] = useState<(User | TeamSearchResult)[]>([]);
  const [pendingRemoves, setPendingRemoves] = useState<string[]>([]);

  // Local state for current participants (includes pending changes)
  const [localParticipants, setLocalParticipants] = useState<Participant[]>([]);

  const isTeamTournament = category === "team";
  const isDoubles = matchType === "doubles" || matchType === "mixed_doubles";

  // Initialize local participants when dialog opens or participants change
  useEffect(() => {
    if (open) {
      // Filter out null/undefined participants
      // Accept objects (populated participants) - even if missing fields, display will handle it
      // Reject strings (ObjectIds that weren't populated - this shouldn't happen but handle it)
      const validParticipants = (participants || []).filter((p) => {
        // Must be an object (populated participant)
        // Reject null, undefined, strings, numbers, etc.
        return p !== null && p !== undefined && typeof p === 'object' && !Array.isArray(p);
      });
      
      setLocalParticipants(validParticipants);
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
      // Use different search endpoint based on category
      const endpoint = isTeamTournament 
        ? `/teams/search?query=${val}`
        : `/users/search?q=${val}`;
      
      const response = await axiosInstance.get(endpoint);
      
      // Filter out items who are already participants (including pending adds)
      // Note: We don't include pendingRemoves here so users can re-add participants they just removed
      const existingIds = new Set([
        ...localParticipants.map((p) => p._id || (p as any).id || String(p)),
        ...pendingAdds.map((item) => item._id || (item as any).id || String(item)),
      ]);

      const data = isTeamTournament 
        ? (response.data?.teams || [])
        : (response.data?.users || []);
      
      const filtered = data.filter((item: any) => !existingIds.has(item._id));
      setSuggestions(filtered);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setSearching(false);
    }
  };

  const addParticipant = (item: User | TeamSearchResult) => {
    const itemId = item._id;

    // Check if this participant was previously removed in this session
    const wasPendingRemove = pendingRemoves.includes(itemId);

    if (wasPendingRemove) {
      // Remove from pending removes (undoing the removal)
      setPendingRemoves(pendingRemoves.filter((id) => id !== itemId));
    } else {
      // Add to pending adds (new addition)
      setPendingAdds([...pendingAdds, item]);
    }

    // Convert to participant format
    let newParticipant: Participant;

    if (isTeamTournament) {
      const team = item as TeamSearchResult;
      newParticipant = {
        _id: team._id,
        name: team.name,
        logo: team.logo,
        city: team.city,
        captain: team.captain,
        players: team.players,
      } as TeamParticipant;
    } else {
      const user = item as User;
      newParticipant = {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
      } as UserParticipant;
    }

    setLocalParticipants([...localParticipants, newParticipant]);

    // Clear search
    setQuery("");
    setSuggestions([]);
  };

  const removeParticipant = (participant: Participant) => {
    const participantId = (participant as any)._id || (participant as any).id || String(participant);
    
    // Check if it's a pending add (not yet saved)
    const isPendingAdd = pendingAdds.some((item) => (item._id || (item as any).id) === participantId);

    if (isPendingAdd) {
      // Remove from pending adds
      setPendingAdds(pendingAdds.filter((item) => (item._id || (item as any).id) !== participantId));
    } else {
      // Add to pending removes
      setPendingRemoves([...pendingRemoves, participantId]);
    }

    // Remove from local participants
    setLocalParticipants(
      localParticipants.filter((p) => {
        const pId = (p as any)._id || (p as any).id || String(p);
        return pId !== participantId;
      })
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
      for (const item of pendingAdds) {
        await axiosInstance.post(
          `/tournaments/${tournamentId}/add-participant`,
          {
            participantId: item._id,
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

      const entityName = isTeamTournament ? "team" : "participant";
      const entityNamePlural = isTeamTournament ? "teams" : "participants";
      
      toast.success(
        `Successfully ${
          pendingAdds.length > 0
            ? `added ${pendingAdds.length} ${pendingAdds.length > 1 ? entityNamePlural : entityName}`
            : ""
        }${pendingAdds.length > 0 && pendingRemoves.length > 0 ? " and " : ""}${
          pendingRemoves.length > 0
            ? `removed ${pendingRemoves.length} ${pendingRemoves.length > 1 ? entityNamePlural : entityName}`
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

  // Group participants into pairs for doubles tournaments
  const getPairs = () => {
    const pairs: Array<{ players: Participant[]; index: number }> = [];
    for (let i = 0; i < localParticipants.length; i += 2) {
      if (localParticipants[i + 1]) {
        pairs.push({
          players: [localParticipants[i], localParticipants[i + 1]],
          index: i,
        });
      } else {
        // Single player without partner
        pairs.push({
          players: [localParticipants[i]],
          index: i,
        });
      }
    }
    return pairs;
  };

  // Move a pair up
  const movePairUp = (pairIndex: number) => {
    if (pairIndex === 0) return;
    const newParticipants = [...localParticipants];
    const arrayIndex = pairIndex * 2;

    // Swap with previous pair (4 elements total)
    [
      newParticipants[arrayIndex - 2],
      newParticipants[arrayIndex - 1],
      newParticipants[arrayIndex],
      newParticipants[arrayIndex + 1],
    ] = [
      newParticipants[arrayIndex],
      newParticipants[arrayIndex + 1],
      newParticipants[arrayIndex - 2],
      newParticipants[arrayIndex - 1],
    ];

    setLocalParticipants(newParticipants.filter(Boolean));
  };

  // Move a pair down
  const movePairDown = (pairIndex: number) => {
    const pairs = getPairs();
    if (pairIndex >= pairs.length - 1) return;
    const newParticipants = [...localParticipants];
    const arrayIndex = pairIndex * 2;

    // Swap with next pair (4 elements total)
    [
      newParticipants[arrayIndex],
      newParticipants[arrayIndex + 1],
      newParticipants[arrayIndex + 2],
      newParticipants[arrayIndex + 3],
    ] = [
      newParticipants[arrayIndex + 2],
      newParticipants[arrayIndex + 3],
      newParticipants[arrayIndex],
      newParticipants[arrayIndex + 1],
    ];

    setLocalParticipants(newParticipants.filter(Boolean));
  };

  // Helper to get display info for a suggestion item
  const getSuggestionDisplay = (item: User | TeamSearchResult) => {
    if (isTeamTournament) {
      const team = item as TeamSearchResult;
      return {
        name: team.name,
        subtext: team.city ? team.city : `${team.players?.length || 0} players`,
        image: team.logo,
      };
    } else {
      const user = item as User;
      return {
        name: user.fullName || user.username,
        subtext: `@${user.username}`,
        image: user.profileImage,
      };
    }
  };

  // Helper to get display info for a participant
  const getParticipantDisplay = (p: Participant | any) => {
    // Handle null/undefined or non-object participants
    if (!p || typeof p !== 'object') {
      return {
        name: "Unknown",
        subtext: "N/A",
        image: undefined,
      };
    }

    if (isTeamParticipant(p)) {
      return {
        name: p.name || "Unknown Team",
        subtext: p.city || `${p.players?.length || 0} players`,
        image: p.logo,
      };
    } else {
      // Use the helper function for consistency
      const displayName = getParticipantDisplayName(p);
      const username = p.username || "unknown";
      return {
        name: displayName,
        subtext: `@${username}`,
        image: getParticipantImage(p),
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ManageAccountsIcon className="size-5 text-indigo-500" />
            <span className="text-indigo-500">
              Manage {isTeamTournament ? "Teams" : "Participants"}
            </span>
          </DialogTitle>
          <DialogDescription>
            {isDoubles && !isTeamTournament
              ? "Add or remove players. Players are organized into pairs for doubles matches."
              : `Add or remove ${isTeamTournament ? "teams" : "participants"} before generating the draw.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search to add participants */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Add {isTeamTournament ? "Team" : "Participant"}
            </label>
            <div className="relative">
              <Input
                placeholder={isTeamTournament 
                  ? "Search teams by name..." 
                  : "Search users by name or username..."
                }
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
                  {suggestions.map((item) => {
                    const display = getSuggestionDisplay(item);

                    return (
                      <li
                        key={item._id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => addParticipant(item)}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage
                              src={display.image}
                              alt={display.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(display.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-medium">
                              {display.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {display.subtext}
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
                    No {isTeamTournament ? "teams" : "users"} found
                  </div>
                )}
            </div>
          </div>

          {/* Current participants list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">
                {isDoubles && !isTeamTournament ? "Pairs" : isTeamTournament ? "Teams" : "Participants"}
                {isDoubles && !isTeamTournament ? ` (${Math.floor(localParticipants.length / 2)} pairs, ${localParticipants.length} players)` : ` (${localParticipants.length})`}
              </label>
            </div>

            {/* Warning for odd number of participants in doubles */}
            {isDoubles && !isTeamTournament && localParticipants.length % 2 !== 0 && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700">
                  <strong>Incomplete pair:</strong> You have an odd number of players. Add one more player to complete the pair.
                </div>
              </div>
            )}

            <ScrollArea className="h-[240px] border rounded-lg">
              {localParticipants.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500">
                  {isTeamTournament ? (
                    <GroupsIcon className="size-6 mb-2" />
                  ) : (
                    <PersonIcon className="size-6 mb-2" />
                  )}
                  <p className="text-sm">No {isTeamTournament ? "teams" : "participants"} yet</p>
                </div>
              ) : isDoubles && !isTeamTournament ? (
                // Doubles: Show pairs
                <div className="divide-y">
                  {getPairs().map((pair, pairIndex) => (
                    <div key={pair.index} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500">
                          Pair {pairIndex + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => movePairUp(pairIndex)}
                            disabled={pairIndex === 0}
                            className="h-6 w-6 p-0"
                            title="Move pair up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => movePairDown(pairIndex)}
                            disabled={pairIndex >= getPairs().length - 1}
                            className="h-6 w-6 p-0"
                            title="Move pair down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {pair.players.map((p, idx) => {
                          const participantId = p._id || (p as any).id || String(p);
                          const isPendingAdd = pendingAdds.some(
                            (item) => (item._id || (item as any).id) === participantId
                          );
                          const isPendingRemove = pendingRemoves.includes(participantId);
                          const display = getParticipantDisplay(p);

                          return (
                            <div
                              key={participantId}
                              className={`flex items-center justify-between px-2 py-1.5 rounded ${
                                isPendingAdd
                                  ? "bg-green-50"
                                  : isPendingRemove
                                  ? "bg-red-50 opacity-60"
                                  : "bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={display.image} alt={display.name} />
                                  <AvatarFallback className="text-[10px]">
                                    {getInitial(display.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col leading-tight">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-medium text-slate-800">
                                      {display.name}
                                    </span>
                                    {isPendingAdd && (
                                      <span className="text-[10px] text-green-600 font-medium">
                                        (new)
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-500">
                                    {display.subtext}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeParticipant(p)}
                                className="h-5 w-5 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                      {pair.players.length === 1 && (
                        <div className="text-[10px] text-amber-600 mt-1 ml-2">
                          ⚠️ Missing partner
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Singles or Teams: Show regular list
                <div className="divide-y">
                  {localParticipants
                    .filter((p) => p && typeof p === 'object')
                    .map((p) => {
                    const participantId = p._id || (p as any).id || String(p);
                    const isPendingAdd = pendingAdds.some(
                      (item) => (item._id || (item as any).id) === participantId
                    );
                    const isPendingRemove = pendingRemoves.includes(participantId);
                    const display = getParticipantDisplay(p);

                    return (
                      <div
                        key={participantId}
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
                              src={display.image}
                              alt={display.name}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitial(display.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-800">
                                {display.name}
                              </span>
                              {isPendingAdd && (
                                <span className="text-xs text-green-600 font-medium">
                                  (new)
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500">
                              {display.subtext}
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
