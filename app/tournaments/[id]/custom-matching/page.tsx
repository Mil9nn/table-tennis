"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tournament, isUserParticipant } from "@/types/tournament.type";
import CustomKnockoutMatcher from "@/components/tournaments/CustomKnockoutMatcher";

export default function CustomMatchingPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);

  const fetchTournament = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/tournaments/${tournamentId}`);
      setTournament(data.tournament);
    } catch (err) {
      toast.error("Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const handleSuccess = () => {
    toast.success("Custom matchups saved!");
    fetchTournament();
    router.push(`/tournaments/${tournamentId}`);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <p>Tournament not found</p>
      </div>
    );
  }

  // Check if tournament has a knockout bracket (either pure knockout or hybrid in knockout phase)
  const hasKnockoutBracket = 
    tournament.bracket && 
    (tournament.format === "knockout" || 
     (tournament.format === "hybrid" && tournament.currentPhase === "knockout"));

  if (!hasKnockoutBracket) {
    return (
      <div className="text-center py-12">
        <p>This tournament does not have a knockout bracket</p>
        {tournament.format === "hybrid" && tournament.currentPhase !== "knockout" && (
          <p className="text-sm text-gray-500 mt-2">
            Please complete the round-robin phase and transition to knockout phase first.
          </p>
        )}
        <Button
          variant="outline"
          onClick={() => router.push(`/tournaments/${tournamentId}`)}
          className="mt-4"
        >
          Back to Tournament
        </Button>
      </div>
    );
  }

  const currentRound = tournament.bracket.rounds.find(
    (r) => r.roundNumber === selectedRound
  );

  const isRoundLocked =
    currentRound?.completed ||
    currentRound?.matches?.some((m: any) => m.completed);

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/tournaments/${tournamentId}`)}
              className="p-2 -ml-2 rounded-xl hover:bg-zinc-100 transition"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-700" />
            </button>

            <div>
              <h1 className="text-xl font-semibold text-zinc-900">
                Custom Bracket Matching
              </h1>
              <p className="text-sm text-zinc-500">{tournament.name}</p>
            </div>
          </div>

          {/* Round Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {tournament.bracket.rounds.map((round) => {
              const hasCompleted = round.matches?.some(
                (match: any) => match.completed
              );
              const locked = round.completed || hasCompleted;

              return (
                <button
                  key={round.roundNumber}
                  disabled={locked}
                  onClick={() => setSelectedRound(round.roundNumber)}
                  className={`
                    px-4 py-2 text-sm rounded-full border transition
                    whitespace-nowrap
                    ${
                      locked
                        ? "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
                        : selectedRound === round.roundNumber
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-zinc-300 hover:bg-zinc-100"
                    }
                  `}
                >
                  {round.roundName}
                  {locked && " 🔒"}
                </button>
              );
            })}
          </div>

          {/* Locked Warning */}
          {isRoundLocked && (
            <div className="flex items-center gap-2 text-amber-700 text-sm bg-amber-50 border border-amber-200 p-3 rounded-lg">
              ⚠️ This round has already started and cannot be modified.
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main
        className="
          max-w-6xl mx-auto px-4 py-8
          animate-[fadeIn_0.3s_ease-out]
        "
      >
        <CustomKnockoutMatcher
          tournamentId={tournamentId}
          bracket={tournament.bracket}
          participants={
            // For hybrid tournaments in knockout phase, use qualified participants only
            // For pure knockout tournaments, use all participants
            tournament.format === "hybrid" && tournament.currentPhase === "knockout" && tournament.qualifiedParticipants
              ? tournament.qualifiedParticipants.filter(isUserParticipant)
              : tournament.participants.filter(isUserParticipant)
          }
          qualifiedParticipantIds={
            // Pass qualified participant IDs for validation and UI indicators
            tournament.format === "hybrid" && tournament.currentPhase === "knockout" && tournament.qualifiedParticipants
              ? new Set(tournament.qualifiedParticipants.map((p: any) => p._id?.toString() || p.toString()))
              : new Set(tournament.participants.map((p: any) => p._id?.toString() || p.toString()))
          }
          currentRound={selectedRound}
          onSuccess={handleSuccess}
          matchType={tournament.matchType}
          existingPairs={tournament.doublesPairs}
        />
      </main>
    </div>
  );
}
