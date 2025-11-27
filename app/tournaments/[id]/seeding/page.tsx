"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, Reorder } from "framer-motion";
import { Participant } from "@/types/match.type";



interface SeedEntry {
  participant: Participant;
  seedNumber: number;
}

interface Tournament {
  _id: string;
  title: string;
  participants: Participant[];
  seeding: SeedEntry[];
  seedingMethod: string;
  drawGenerated: boolean;
}

export default function TournamentSeedingPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedingMethod, setSeedingMethod] = useState<string>("manual");
  const [orderedParticipants, setOrderedParticipants] = useState<SeedEntry[]>([]);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      const tournamentData = data.tournament;
      setTournament(tournamentData);

      // Initialize seeding
      if (tournamentData.seeding && tournamentData.seeding.length > 0) {
        setOrderedParticipants(
          [...tournamentData.seeding].sort((a, b) => a.seedNumber - b.seedNumber)
        );
        setSeedingMethod(tournamentData.seedingMethod || "manual");
      } else {
        // Create initial seeding from participants
        const initialSeeding = tournamentData.participants.map((p: Participant, idx: number) => ({
          participant: p,
          seedNumber: idx + 1,
        }));
        setOrderedParticipants(initialSeeding);
        setSeedingMethod("none");
      }
    } catch (err: any) {
      console.error("Error fetching tournament:", err);
      toast.error(err.response?.data?.error || "Failed to load tournament");
      router.push(`/tournaments/${tournamentId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (newOrder: SeedEntry[]) => {
    // Update seed numbers based on new order
    const updatedSeeding = newOrder.map((entry, idx) => ({
      ...entry,
      seedNumber: idx + 1,
    }));
    setOrderedParticipants(updatedSeeding);
  };

  const handleSeedingMethodChange = (method: string) => {
    setSeedingMethod(method);

    if (method === "none") {
      // Reset to registration order
      const resetSeeding = tournament?.participants.map((p, idx) => ({
        participant: p,
        seedNumber: idx + 1,
      })) || [];
      setOrderedParticipants(resetSeeding);
    }
  };

  const handleSave = async () => {
    if (!tournament) return;

    try {
      setSaving(true);

      // Prepare seeding data
      const seedingData = orderedParticipants.map((entry) => ({
        participant: typeof entry.participant === "string"
          ? entry.participant
          : entry.participant._id,
        seedNumber: entry.seedNumber,
      }));

      await axiosInstance.post(`/tournaments/${tournamentId}/seeding`, {
        seeding: seedingData,
        seedingMethod,
      });

      toast.success("Player order saved successfully");
      router.push(`/tournaments/${tournamentId}`);
    } catch (err: any) {
      console.error("Error saving seeding:", err);
      toast.error(err.response?.data?.error || "Failed to save player order");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tournament settings...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return null;
  }

  if (tournament.drawGenerated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Cannot Edit Seeding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              The draw has already been generated for this tournament. Seeding cannot be changed.
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

  const getParticipantInfo = (entry: SeedEntry) => {
    const participant = entry.participant;
    return participant;
  };

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

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Player Seeding & Order
          </h1>
          <p className="text-gray-600">{tournament.title}</p>
        </motion.div>

        {/* Seeding Method Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Seeding Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={seedingMethod} onValueChange={handleSeedingMethodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Registration Order (Default)</SelectItem>
                  <SelectItem value="manual">Custom Order (Drag & Drop)</SelectItem>
                </SelectContent>
              </Select>

              {seedingMethod === "manual" && (
                <p className="text-sm text-gray-600">
                  Drag and drop participants to set the seeding order. The top participant will be seed #1.
                </p>
              )}
              {seedingMethod === "none" && (
                <p className="text-sm text-gray-600">
                  Participants will follow the registration order.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Participant List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>
                Player Order ({orderedParticipants.length} participants)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Reorder.Group
                axis="y"
                values={orderedParticipants}
                onReorder={handleReorder}
                className="space-y-2"
              >
                {orderedParticipants.map((entry) => {
                  const participant = getParticipantInfo(entry);
                  return (
                    <Reorder.Item
                      key={participant._id}
                      value={entry}
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-5 h-5 text-gray-400" />

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                          {entry.seedNumber}
                        </div>

                        <Avatar className="w-10 h-10">
                          <AvatarImage src={participant.profileImage} />
                          <AvatarFallback>
                            {participant.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {participant.fullName || participant.username}
                          </p>
                          <p className="text-sm text-gray-500">@{participant.username}</p>
                        </div>
                      </div>
                    </Reorder.Item>
                  );
                })}
              </Reorder.Group>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex gap-4"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Player Order
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
      </div>
    </div>
  );
}
