"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Swords,
  X,
  Plus,
  Shuffle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

interface CustomMatch {
  participant1: Participant | string;
  participant2: Participant | string;
}

export default function CustomMatchingPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<CustomMatch[]>([]);
  const [format, setFormat] = useState<string>("");
  const [drawGenerated, setDrawGenerated] = useState(false);

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `/tournaments/${tournamentId}/custom-matching`
      );

      setParticipants(data.participants || []);
      setFormat(data.format);
      setDrawGenerated(data.drawGenerated);

      // Convert existing custom matches to the right format
      if (data.customBracketMatches && data.customBracketMatches.length > 0) {
        setMatches(data.customBracketMatches);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error(err.response?.data?.error || "Failed to load tournament");
      router.push(`/tournaments/${tournamentId}`);
    } finally {
      setLoading(false);
    }
  };

  const getUsedParticipantIds = (): Set<string> => {
    const used = new Set<string>();
    matches.forEach((match) => {
      const p1Id = typeof match.participant1 === "string" 
        ? match.participant1 
        : match.participant1?._id;
      const p2Id = typeof match.participant2 === "string" 
        ? match.participant2 
        : match.participant2?._id;
      if (p1Id) used.add(p1Id);
      if (p2Id) used.add(p2Id);
    });
    return used;
  };

  const getAvailableParticipants = (excludeIndex?: number): Participant[] => {
    const used = new Set<string>();
    matches.forEach((match, idx) => {
      if (idx === excludeIndex) return;
      const p1Id = typeof match.participant1 === "string" 
        ? match.participant1 
        : match.participant1?._id;
      const p2Id = typeof match.participant2 === "string" 
        ? match.participant2 
        : match.participant2?._id;
      if (p1Id) used.add(p1Id);
      if (p2Id) used.add(p2Id);
    });
    return participants.filter((p) => !used.has(p._id));
  };

  const getParticipantById = (id: string): Participant | undefined => {
    return participants.find((p) => p._id === id);
  };

  const getParticipantFromSlot = (slot: Participant | string): Participant | undefined => {
    if (!slot) return undefined;
    if (typeof slot === "string") {
      return getParticipantById(slot);
    }
    return slot;
  };

  const addMatch = () => {
    const available = getAvailableParticipants();
    if (available.length < 2) {
      toast.error("Not enough available participants to create a new match");
      return;
    }
    setMatches([...matches, { participant1: "", participant2: "" } as any]);
  };

  const removeMatch = (index: number) => {
    setMatches(matches.filter((_, i) => i !== index));
  };

  const updateMatchParticipant = (
    matchIndex: number,
    slot: "participant1" | "participant2",
    participantId: string
  ) => {
    const newMatches = [...matches];
    newMatches[matchIndex] = {
      ...newMatches[matchIndex],
      [slot]: participantId,
    };
    setMatches(newMatches);
  };

  const autoGenerateMatches = () => {
    // Shuffle participants and pair them
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const newMatches: CustomMatch[] = [];

    for (let i = 0; i < shuffled.length - 1; i += 2) {
      newMatches.push({
        participant1: shuffled[i]._id,
        participant2: shuffled[i + 1]._id,
      });
    }

    // Handle odd number of participants (one gets a bye - not added to matches)
    setMatches(newMatches);
    toast.success("Matches auto-generated randomly");
  };

  const clearAllMatches = () => {
    setMatches([]);
    toast.success("All matches cleared");
  };

  const handleSave = async () => {
    // Validate all matches have both participants
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const p1Id = typeof match.participant1 === "string" 
        ? match.participant1 
        : match.participant1?._id;
      const p2Id = typeof match.participant2 === "string" 
        ? match.participant2 
        : match.participant2?._id;

      if (!p1Id || !p2Id) {
        toast.error(`Match ${i + 1} is incomplete. Please select both participants.`);
        return;
      }
    }

    try {
      setSaving(true);

      const customBracketMatches = matches.map((match) => ({
        participant1: typeof match.participant1 === "string" 
          ? match.participant1 
          : match.participant1._id,
        participant2: typeof match.participant2 === "string" 
          ? match.participant2 
          : match.participant2._id,
      }));

      await axiosInstance.post(`/tournaments/${tournamentId}/custom-matching`, {
        customBracketMatches,
      });

      toast.success("Custom matching saved successfully");
      router.push(`/tournaments/${tournamentId}`);
    } catch (err: any) {
      console.error("Error saving custom matching:", err);
      toast.error(err.response?.data?.error || "Failed to save custom matching");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (format !== "knockout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Custom matching is only available for knockout tournaments.
            </p>
            <Button
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (drawGenerated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Cannot Edit Matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              The draw has already been generated for this tournament. Custom matching cannot be changed.
            </p>
            <Button
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournament
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const usedParticipants = getUsedParticipantIds();
  const unmatchedParticipants = participants.filter(
    (p) => !usedParticipants.has(p._id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournament
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Swords className="w-8 h-8 text-indigo-600" />
                Custom Match Setup
              </h1>
              <p className="text-gray-600">
                Create custom first-round matchups for knockout tournament
              </p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={autoGenerateMatches}
                  disabled={participants.length < 2}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Random Matchups
                </Button>
                <Button
                  variant="outline"
                  onClick={clearAllMatches}
                  disabled={matches.length === 0}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Matches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Matches ({matches.length})</span>
                <Button
                  size="sm"
                  onClick={addMatch}
                  disabled={getAvailableParticipants().length < 2}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Match
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matches.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Swords className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No matches created yet</p>
                  <p className="text-sm mt-1">
                    Click &quot;Add Match&quot; or &quot;Random Matchups&quot; to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {matches.map((match, index) => {
                    const p1 = getParticipantFromSlot(match.participant1);
                    const p2 = getParticipantFromSlot(match.participant2);
                    const p1Id = typeof match.participant1 === "string" 
                      ? match.participant1 
                      : match.participant1?._id;
                    const p2Id = typeof match.participant2 === "string" 
                      ? match.participant2 
                      : match.participant2?._id;

                    // Get available participants for this match slot
                    const availableForMatch = getAvailableParticipants(index);
                    const availableForP1 = p2Id 
                      ? availableForMatch.filter(p => p._id !== p2Id)
                      : availableForMatch;
                    const availableForP2 = p1Id 
                      ? availableForMatch.filter(p => p._id !== p1Id)
                      : availableForMatch;

                    // Add current selections to available options
                    if (p1 && !availableForP1.find(p => p._id === p1._id)) {
                      availableForP1.unshift(p1);
                    }
                    if (p2 && !availableForP2.find(p => p._id === p2._id)) {
                      availableForP2.unshift(p2);
                    }

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>

                        {/* Participant 1 */}
                        <div className="flex-1">
                          <Select
                            value={p1Id || ""}
                            onValueChange={(value) =>
                              updateMatchParticipant(index, "participant1", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select player 1">
                                {p1 ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={p1.profileImage} />
                                      <AvatarFallback className="text-xs">
                                        {(p1.fullName || p1.username)
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {p1.fullName || p1.username}
                                    </span>
                                  </div>
                                ) : (
                                  "Select player 1"
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availableForP1.map((participant) => (
                                <SelectItem
                                  key={participant._id}
                                  value={participant._id}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={participant.profileImage} />
                                      <AvatarFallback className="text-xs">
                                        {(participant.fullName || participant.username)
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {participant.fullName || participant.username}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="text-gray-400 font-semibold px-2">VS</div>

                        {/* Participant 2 */}
                        <div className="flex-1">
                          <Select
                            value={p2Id || ""}
                            onValueChange={(value) =>
                              updateMatchParticipant(index, "participant2", value)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select player 2">
                                {p2 ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={p2.profileImage} />
                                      <AvatarFallback className="text-xs">
                                        {(p2.fullName || p2.username)
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">
                                      {p2.fullName || p2.username}
                                    </span>
                                  </div>
                                ) : (
                                  "Select player 2"
                                )}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {availableForP2.map((participant) => (
                                <SelectItem
                                  key={participant._id}
                                  value={participant._id}
                                >
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarImage src={participant.profileImage} />
                                      <AvatarFallback className="text-xs">
                                        {(participant.fullName || participant.username)
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    {participant.fullName || participant.username}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMatch(index)}
                          className="text-gray-400 hover:text-red-600 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Unmatched Participants */}
        {unmatchedParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6 border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-amber-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Unmatched Participants ({unmatchedParticipants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {unmatchedParticipants.map((participant) => (
                    <div
                      key={participant._id}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border"
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={participant.profileImage} />
                        <AvatarFallback className="text-xs">
                          {(participant.fullName || participant.username)
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {participant.fullName || participant.username}
                      </span>
                    </div>
                  ))}
                </div>
                {unmatchedParticipants.length === 1 && (
                  <p className="text-sm text-amber-700 mt-3">
                    This participant will receive a bye in the first round.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          <Button
            onClick={handleSave}
            disabled={saving || matches.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Custom Matching
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            disabled={saving}
          >
            Cancel
          </Button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          <p>
            Custom matches will be used when generating the tournament bracket.
            <br />
            Unmatched participants will receive a bye if the number is odd.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

