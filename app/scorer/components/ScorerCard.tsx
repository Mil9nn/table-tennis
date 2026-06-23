"use client";

import Link from "next/link";
import React from "react";
import { formatDateShort } from "@/lib/utils";
import { getParticipantDisplayName } from "@/types/tournament.type";

export type ScorerCardProps = {
  tournament: {
    _id: string;
    name: string;
    format: string;
    category?: string;
    matchType?: string;
    startDate: string;
    endDate?: string;
    status: string;
    city: string;
    venue?: string;
    participants: any[];
    organizer?: any;
    scorers?: any[];
    currentPhase?: "round_robin" | "knockout" | "transition";
    drawGenerated?: boolean;
    maxParticipants?: number;
    standings?: Array<{
      participant: any;
      rank: number;
    }>;
    bracket?: {
      completed?: boolean;
      rounds?: Array<{
        roundNumber: number;
        matches?: Array<{
          participant1?: any;
          participant2?: any;
          winner?: string;
        }>;
      }>;
    };
    knockoutStatistics?: {
      outcome?: {
        champion?: {
          participantId: string;
          participantName: string;
        };
      };
    };
  };
};

export function ScorerCard({ tournament }: ScorerCardProps) {
  const getTournamentTypeLabel = () => {
    // For team tournaments, show "Team"
    if (tournament.category === "team") {
      return "Team";
    }
    // For individual tournaments, show matchType (Singles/Doubles)
    if (tournament.matchType) {
      return tournament.matchType.charAt(0).toUpperCase() + tournament.matchType.slice(1);
    }
    // Fallback to "Singles" if no matchType specified
    return "Singles";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "upcoming":
        return "text-orange-500";
      case "draft":
        return "text-gray-500";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-400";
    }
  };

  const getPhaseLabel = () => {
    if (tournament.format === "hybrid" && tournament.currentPhase) {
      if (tournament.currentPhase === "round_robin") return "Round-Robin Phase";
      if (tournament.currentPhase === "knockout") return "Knockout Phase";
      if (tournament.currentPhase === "transition") return "Transitioning";
    }
    return null;
  };

  const tournamentTypeLabel = getTournamentTypeLabel();
  const formatLabel = tournament.format === "hybrid"
    ? "Hybrid"
    : tournament.format.replace(/_/g, " ");
  const statusLabel = tournament.status.replace(/_/g, " ");
  const statusColor = getStatusColor(tournament.status);
  const phaseLabel = getPhaseLabel();
  const organizerName = tournament.organizer?.fullName || tournament.organizer?.username || "Unknown";
  const otherScorersCount =
    (tournament.scorers?.length || 0) > 0 ? tournament.scorers!.length - 1 : 0;

  // Get winner for completed tournaments
  const getWinnerName = () => {
    // Only check for completed tournaments
    if (tournament.status !== "completed") {
      return null;
    }

    // Priority 1: Check knockoutStatistics (most reliable for completed knockout/hybrid tournaments)
    if (tournament.knockoutStatistics?.outcome?.champion?.participantName) {
      return tournament.knockoutStatistics.outcome.champion.participantName;
    }

    // Priority 2: For knockout/hybrid tournaments, check bracket for winner
    if ((tournament.format === "knockout" || tournament.format === "hybrid") && tournament.bracket) {
      if (tournament.bracket.completed && tournament.bracket.rounds && tournament.bracket.rounds.length > 0) {
        const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
        if (finalRound.matches && finalRound.matches.length > 0) {
          const finalMatch = finalRound.matches[0];
          if (finalMatch.winner) {
            // Find the winner participant in the participants array
            const winnerId = finalMatch.winner.toString();
            const winnerParticipant = tournament.participants.find((p: any) => {
              const pId = p._id?.toString() || p.toString();
              return pId === winnerId;
            });
            if (winnerParticipant) {
              return getParticipantDisplayName(winnerParticipant);
            }
            // If participant not found in array, try to get from bracket match
            if (finalMatch.participant1 && finalMatch.participant1.toString() === winnerId) {
              return getParticipantDisplayName(finalMatch.participant1);
            }
            if (finalMatch.participant2 && finalMatch.participant2.toString() === winnerId) {
              return getParticipantDisplayName(finalMatch.participant2);
            }
          }
        }
      }
    }

    // Priority 3: For round-robin tournaments, check standings for rank 1
    if (tournament.format === "round_robin" && tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner && winner.participant) {
        return getParticipantDisplayName(winner.participant);
      }
    }

    // Fallback: Check standings for any tournament format (in case hybrid has standings)
    if (tournament.standings && tournament.standings.length > 0) {
      const winner = tournament.standings.find((s) => s.rank === 1);
      if (winner && winner.participant) {
        return getParticipantDisplayName(winner.participant);
      }
    }

    return null;
  };

  const winnerName = getWinnerName();

  return (
    <Link
      href={`/tournaments/${tournament._id}`}
      className="group block border border-[#d9d9d9] bg-[#ffffff] p-4 transition-colors hover:bg-[#3c6e71]"
    >
      {/* Line 1: Tournament name */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-sm text-gray-800 group-hover:text-[#ffffff] transition-colors">
          {tournament.name}
        </h3>
      </div>

      {/* Line 2: Meta info - Status/Type/Format/Phase/Players or Type/Format/Phase/Players/Winner */}
      <div className="flex items-center gap-1 flex-wrap mt-2 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
        {winnerName ? (
          // For completed tournaments with winner: show Type, Format, Phase (if exists), Players, Winner (no status)
          <>
            <span className="capitalize">{tournamentTypeLabel}</span>
            <span>•</span>
            <span className="capitalize">{formatLabel}</span>
            {phaseLabel && (
              <>
                <span>•</span>
                <span>{phaseLabel}</span>
              </>
            )}
            <span>•</span>
            <span>
              {tournament.participants.length}
              {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""} players
            </span>
            <span>•</span>
            <span className={`font-semibold text-green-500 group-hover:text-[#ffffff] transition-colors`}>Winner: {winnerName}</span>
          </>
        ) : (
          // For non-completed tournaments: show Status, Type, Format, Phase (if exists), Players
          <>
            <span className={`capitalize ${statusColor} group-hover:text-[#ffffff] transition-colors`}>{statusLabel}</span>
            <span>•</span>
            <span className="capitalize">{tournamentTypeLabel}</span>
            <span>•</span>
            <span className="capitalize">{formatLabel}</span>
            {phaseLabel && (
              <>
                <span>•</span>
                <span>{phaseLabel}</span>
              </>
            )}
            <span>•</span>
            <span>
              {tournament.participants.length}
              {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""} players
            </span>
          </>
        )}
      </div>

      {/* Line 3: Meta info - Date, City, Organizer, Scorers */}
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 transition-colors group-hover:text-[#ffffff]">
        <span>{formatDateShort(tournament.startDate)}</span>
        {tournament.city && (
          <>
            <span>•</span>
            <span>{tournament.city}</span>
          </>
        )}
        <span>•</span>
        <span><span className="font-semibold">Organizer:</span> <span className="font-semibold">{organizerName}</span></span>
        {otherScorersCount > 0 && (
          <>
            <span>•</span>
            <span>+{otherScorersCount} scorer{otherScorersCount > 1 ? "s" : ""}</span>
          </>
        )}
      </div>
    </Link>
  );
}

export default ScorerCard;
