"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Trophy,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CustomBracketMatcher from "@/components/tournaments/CustomBracketMatcher";
import { motion } from "framer-motion";

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
  rank?: number;
  points?: number;
  groupId?: string;
}

interface CustomMatch {
  participant1: Participant | string | null;
  participant2: Participant | string | null;
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
  const [bracketGenerated, setBracketGenerated] = useState(false);
  const [isMultiStage, setIsMultiStage] = useState(false);
  const [qualifiedInfo, setQualifiedInfo] = useState<{
    total: number;
    fromGroups: boolean;
  } | null>(null);

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
      setBracketGenerated(data.bracketGenerated || false);
      setIsMultiStage(data.isMultiStage || false);
      setQualifiedInfo(data.qualifiedInfo || null);

      // Convert existing custom matches to the right format
      if (data.customBracketMatches && data.customBracketMatches.length > 0) {
        const convertedMatches: CustomMatch[] = data.customBracketMatches.map(
          (m: any) => ({
            participant1: m.participant1?._id || m.participant1 || null,
            participant2: m.participant2?._id || m.participant2 || null,
          })
        );
        setMatches(convertedMatches);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error(err.response?.data?.error || "Failed to load tournament");
      router.push(`/tournaments/${tournamentId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate all matches have both participants
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const p1Id =
        typeof match.participant1 === "string"
          ? match.participant1
          : match.participant1?._id;
      const p2Id =
        typeof match.participant2 === "string"
          ? match.participant2
          : match.participant2?._id;

      if (!p1Id || !p2Id) {
        toast.error(
          `Match ${i + 1} is incomplete. Please select both participants.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const customBracketMatches = matches.map((match) => ({
        participant1:
          typeof match.participant1 === "string"
            ? match.participant1
            : match?.participant1?._id,
        participant2:
          typeof match.participant2 === "string"
            ? match.participant2
            : match?.participant2?._id,
      }));

      await axiosInstance.post(`/tournaments/${tournamentId}/custom-matching`, {
        customBracketMatches,
      });

      toast.success("Custom matching saved successfully");

      // For multi-stage tournaments, redirect to tournament page
      // For regular knockout, also redirect to tournament page
      router.push(`/tournaments/${tournamentId}`);
    } catch (err: any) {
      console.error("Error saving custom matching:", err);
      toast.error(
        err.response?.data?.error || "Failed to save custom matching"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  // Check if this is a knockout or multi-stage tournament
  const isKnockoutOrMultiStage =
    format === "knockout" || isMultiStage || format === "multi_stage";

  if (!isKnockoutOrMultiStage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Available</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Custom matching is only available for knockout or multi-stage
              tournaments.
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

  // For knockout tournaments, allow editing if next round can be customized
  // (i.e., previous round is complete but next round matches haven't been created)
  const canEditKnockout = format === "knockout" && drawGenerated && bracketGenerated;
  
  // For other cases, block if draw/bracket is generated
  if ((drawGenerated || bracketGenerated) && !canEditKnockout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Cannot Edit Matching</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              The bracket has already been generated for this tournament. Custom
              matching cannot be changed.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/tournaments/${tournamentId}`)}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournament
          </Button>

          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Custom Bracket Setup
              </h1>
              <p className="text-gray-600">
                {isMultiStage
                  ? "Configure knockout stage matchups for qualified participants"
                  : "Create custom matchups for knockout tournament"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Card className="border-gray-200">
            <CardContent className="">
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">Qualified Participants</p>
                <p className="text-2xl font-bold text-gray-900">
                  {participants.length}
                </p>
              </div>
            </CardContent>
          </Card>

          {qualifiedInfo && (
            <Card className="border-gray-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {qualifiedInfo.fromGroups
                        ? "From Group Stage"
                        : "From Round Robin"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {qualifiedInfo.total} Advanced
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 bg-white">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Configure Matches
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Match participants for the knockout bracket. Winners will advance to the next round.
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            {participants.length < 2 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Not enough participants for knockout stage
                </p>
                <p className="text-sm text-gray-500">
                  At least 2 participants are required
                </p>
              </div>
            ) : (
              <CustomBracketMatcher
                participants={participants}
                matches={matches}
                onMatchesChange={setMatches}
                onSave={handleSave}
                saving={saving}
                showGroupInfo={isMultiStage && qualifiedInfo?.fromGroups}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
