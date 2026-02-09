// services/tournament/core/knockoutStatisticsService.ts

import mongoose from "mongoose";
import TournamentIndividual from "@/models/TournamentIndividual";
import TournamentTeam from "@/models/TournamentTeam";
import BracketState from "@/models/BracketState";
import Match from "@/models/MatchBase";
import Team from "@/models/Team";
import { User } from "@/models/User"
import {
  KnockoutStatistics,
  TournamentOutcome,
  ParticipantProgression,
  ParticipantStats,
  PerformanceMetrics,
  Medalist,
  MatchScore,
  MatchHighlight,
} from "@/types/knockoutStatistics.type";
import { IBracketState } from "@/models/BracketState";

interface MatchData {
  _id: string;
  matchCategory: "individual" | "team";
  status: string;
  bracketPosition?: {
    round: number;
    matchNumber: number;
  };
  roundName?: string;
  // Individual match fields
  participants?: mongoose.Types.ObjectId[];
  finalScore?: {
    side1Sets: number;
    side2Sets: number;
  };
  winnerSide?: "side1" | "side2" | null;
  games?: Array<{
    side1Score: number;
    side2Score: number;
    winnerSide?: "side1" | "side2" | null;
  }>;
  // Team match fields
  team1?: { teamId: mongoose.Types.ObjectId };
  team2?: { teamId: mongoose.Types.ObjectId };
  winnerTeam?: "team1" | "team2" | null;
}

interface ParticipantInfo {
  id: string;
  name: string;
  seedNumber?: number;
}

/**
 * Main orchestrator function to generate complete knockout tournament statistics
 */
export async function generateKnockoutStatistics(
  tournamentId: string
): Promise<KnockoutStatistics> {
  // Fetch tournament
  const tournament = await fetchTournament(tournamentId);
  if (!tournament) {
    throw new Error("Tournament not found");
  }

  // Allow both pure knockout tournaments and hybrid tournaments with completed knockout phase
  if (tournament.format === "hybrid") {
    // For hybrid tournaments, verify knockout phase is complete
    // Allow if tournament is already completed (has stats) or if current phase is knockout
    if (tournament.status !== "completed" && tournament.currentPhase !== "knockout") {
      throw new Error("Hybrid tournament knockout phase is not complete");
    }
    // If tournament is completed, verify it has a bracket (completed knockout phase)
    if (tournament.status === "completed" && !tournament.bracket) {
      throw new Error("Completed hybrid tournament does not have a bracket");
    }
  } else if (tournament.format !== "knockout") {
    throw new Error("Tournament is not a knockout format");
  }

  // Fetch bracket
  const bracket = await BracketState.findOne({ tournament: tournamentId });
  if (!bracket) {
    throw new Error("Bracket not found for tournament");
  }

  // Verify bracket is completed
  if (!bracket.completed) {
    throw new Error("Bracket is not completed. Cannot generate statistics.");
  }

  // Collect match IDs from bracket structure (only bracket matches, not round-robin)
  const matchIds: string[] = [];
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.matchId) {
        const matchId = typeof match.matchId === "string"
          ? match.matchId
          : String(match.matchId);
        matchIds.push(matchId);
      }
    }
  }
  // Add third place match if it exists
  if (bracket.thirdPlaceMatch?.matchId) {
    const thirdPlaceId = typeof bracket.thirdPlaceMatch.matchId === "string"
      ? bracket.thirdPlaceMatch.matchId
      : String(bracket.thirdPlaceMatch.matchId);
    matchIds.push(thirdPlaceId);
  }

  // Fetch only bracket matches (not round-robin matches)
  // For pure knockout tournaments, this ensures only bracket matches are included
  // For hybrid tournaments, this ensures only knockout phase matches are included
  const matches = matchIds.length > 0
    ? await Match.find({ _id: { $in: matchIds } }).lean()
    : [];

  // Collect participant IDs from bracket (only participants who are in knockout bracket)
  const bracketParticipantIds = new Set<string>();
  for (const round of bracket.rounds) {
    for (const match of round.matches) {
      if (match.participant1) {
        const participantId = typeof match.participant1 === "string"
          ? match.participant1
          : String(match.participant1);
        bracketParticipantIds.add(participantId);
      }
      if (match.participant2) {
        const participantId = typeof match.participant2 === "string"
          ? match.participant2
          : String(match.participant2);
        bracketParticipantIds.add(participantId);
      }
    }
  }
  // Include third place match participants
  if (bracket.thirdPlaceMatch?.participant1) {
    const participantId = typeof bracket.thirdPlaceMatch.participant1 === "string"
      ? bracket.thirdPlaceMatch.participant1
      : String(bracket.thirdPlaceMatch.participant1);
    bracketParticipantIds.add(participantId);
  }
  if (bracket.thirdPlaceMatch?.participant2) {
    const participantId = typeof bracket.thirdPlaceMatch.participant2 === "string"
      ? bracket.thirdPlaceMatch.participant2
      : String(bracket.thirdPlaceMatch.participant2);
    bracketParticipantIds.add(participantId);
  }

  // For hybrid tournaments, use qualifiedParticipants if available, otherwise use bracket participants
  // For pure knockout tournaments, use bracket participants
  let participantIdsToFetch: string[];
  if (tournament.format === "hybrid" && tournament.qualifiedParticipants) {
    // For hybrid, only include qualified participants who are also in the bracket
    const qualifiedIds = tournament.qualifiedParticipants.map((p: any) => p.toString());
    participantIdsToFetch = Array.from(bracketParticipantIds).filter((id) =>
      qualifiedIds.includes(id)
    );
  } else {
    // For pure knockout, use all bracket participants
    participantIdsToFetch = Array.from(bracketParticipantIds);
  }

  // Fetch participants with seeding info (only those in knockout bracket)
  const participants = await fetchParticipants(
    tournament,
    tournament.category,
    participantIdsToFetch
  );

  // Calculate all statistics categories
   const outcome = extractTournamentOutcome(bracket, matches as unknown as MatchData[], participants, tournament.category);
   const participantProgression = calculateParticipantProgression(
     bracket,
     matches as unknown as MatchData[],
     participants,
     tournament.category,
     outcome.thirdPlace?.participantId // Pass third place ID to properly label them
   );
   const participantStats = calculateParticipantStats(matches as unknown as MatchData[], participants, tournament.category);
   const performanceMetrics = calculatePerformanceMetrics(matches as unknown as MatchData[], participants, tournament.category);

  return {
    generatedAt: new Date(),
    outcome,
    participantProgression,
    participantStats,
    performanceMetrics,
  };
}

/**
 * Fetch tournament by ID (handles both individual and team)
 */
async function fetchTournament(tournamentId: string) {
  const individualTournament = await TournamentIndividual.findById(tournamentId).lean();
  if (individualTournament) return individualTournament;

  const teamTournament = await TournamentTeam.findById(tournamentId).lean();
  return teamTournament;
}

/**
 * Fetch participants with name and seeding information
 * @param participantIds - Optional array of participant IDs to fetch. If provided, only these participants will be included.
 *                         If not provided, all tournament participants will be fetched.
 */
async function fetchParticipants(
   tournament: any,
   category: "individual" | "team",
   participantIds?: string[]
 ): Promise<ParticipantInfo[]> {
   const participants: ParticipantInfo[] = [];
 
   // Use provided participant IDs, or fall back to all tournament participants
   const idsToFetch = participantIds && participantIds.length > 0
     ? participantIds
     : tournament.participants.map((p: any) => p.toString());
 
   for (const participantId of idsToFetch) {
     const idStr = participantId.toString();
 
     if (category === "individual") {
       const user = await User.findById(participantId).lean() as any;
       if (user) {
         const seedingInfo = tournament.seeding?.find(
           (s: any) => s.participant.toString() === idStr
         );
         participants.push({
           id: idStr,
           name: user.fullName || user.username || "Unknown",
           seedNumber: seedingInfo?.seedNumber,
         });
       }
     } else {
       const team = await Team.findById(participantId).lean() as any;
       if (team) {
         const seedingInfo = tournament.seeding?.find(
           (s: any) => s.participant.toString() === idStr
         );
         participants.push({
           id: idStr,
           name: team.name || "Unknown Team",
           seedNumber: seedingInfo?.seedNumber,
         });
       }
     }
   }
 
   return participants;
 }

/**
 * Extract tournament outcome (Champion, Runner-up, Third Place, Final Scores)
 */
function extractTournamentOutcome(
  bracket: IBracketState,
  matches: MatchData[],
  participants: ParticipantInfo[],
  category: "individual" | "team"
): TournamentOutcome {
  // Find final round
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound || finalRound.matches.length === 0) {
    throw new Error("Final round not found in bracket");
  }

  const finalMatch = finalRound.matches[0];
  const finalMatchDoc = matches.find((m) => m._id.toString() === finalMatch.matchId);

  let championId: string | null = null;
   let runnerUpId: string | null = null;
   let finalMatchScore: MatchScore | undefined = undefined;

  // Case 1: Final match exists and is completed (normal case)
  if (finalMatchDoc && finalMatch.winner) {
    championId = finalMatch.winner;
    runnerUpId =
      finalMatch.participant1 === championId ? finalMatch.participant2 : finalMatch.participant1;
    finalMatchScore = getMatchScore(finalMatchDoc, championId, category);
  }
  // Case 2: Final match doesn't exist (old tournament) - infer from semifinals
  else if (!finalMatch.matchId && bracket.rounds.length >= 2) {
    // Get semifinal round (second-to-last round)
    const semifinalRound = bracket.rounds[bracket.rounds.length - 2];

    if (semifinalRound && semifinalRound.matches.length >= 2) {
      const semifinal1 = semifinalRound.matches[0];
      const semifinal2 = semifinalRound.matches[1];

      // Find actual match documents
      const semifinal1Doc = matches.find((m) => m._id.toString() === semifinal1.matchId);
      const semifinal2Doc = matches.find((m) => m._id.toString() === semifinal2.matchId);

      if (semifinal1.winner && semifinal2.winner && semifinal1Doc && semifinal2Doc) {
        // Infer champion and runner-up from semifinal winners
        championId = semifinal1.winner;
        runnerUpId = semifinal2.winner;

        // Use the first semifinal as the "final" score for display purposes
        finalMatchScore = getMatchScore(semifinal1Doc, championId, category);
      }
    }
  }

  if (!championId || !runnerUpId) {
    throw new Error("Final match not completed - cannot determine tournament outcome");
  }

  const champion = getParticipantMedalist(championId, participants);
  const runnerUp = getParticipantMedalist(runnerUpId, participants);

  // Get third place (if exists)
  let thirdPlace: Medalist | undefined;
  let thirdPlaceMatchScore: MatchScore | undefined;

  // Case 1: Third place match exists and has a winner (normal case)
  if (bracket.thirdPlaceMatch && bracket.thirdPlaceMatch.winner) {
    const thirdPlaceMatchDoc = matches.find(
      (m) => m._id.toString() === bracket.thirdPlaceMatch?.matchId
    );
    if (thirdPlaceMatchDoc) {
      thirdPlace = getParticipantMedalist(bracket.thirdPlaceMatch.winner, participants);
      thirdPlaceMatchScore = getMatchScore(
        thirdPlaceMatchDoc,
        bracket.thirdPlaceMatch.winner,
        category
      );
    }
  }
  // Case 2: No third place match - determine third place from semi-finals
  // Third place is the participant who lost to the champion in the semi-finals
  // Note: We do NOT set thirdPlaceMatchScore here since there's no actual third place match
  else if (!bracket.thirdPlaceMatch && bracket.rounds.length >= 2 && championId) {
    // Get semifinal round (second-to-last round)
    const semifinalRound = bracket.rounds[bracket.rounds.length - 2];

    if (semifinalRound && semifinalRound.matches.length > 0) {
      // Find which semi-final match the champion came from
      for (const semifinalMatch of semifinalRound.matches) {
        if (semifinalMatch.winner === championId) {
          // Found the semi-final where the champion won
          // The loser from this semi-final is the third place
          const thirdPlaceId =
            semifinalMatch.participant1 === championId
              ? semifinalMatch.participant2
              : semifinalMatch.participant1;

          if (thirdPlaceId) {
            thirdPlace = getParticipantMedalist(thirdPlaceId, participants);
            // Do NOT set thirdPlaceMatchScore here - there's no actual third place match
            // thirdPlaceMatchScore should only be set when bracket.thirdPlaceMatch exists
          }
          break;
        }
      }
    }
  }

  return {
     champion,
     runnerUp,
     thirdPlace,
     finalMatchScore: finalMatchScore || {
       side1Sets: 0,
       side2Sets: 0,
       setsBreakdown: [],
     },
     thirdPlaceMatchScore,
   };
}

/**
 * Calculate participant progression (round reached, elimination details)
 */
function calculateParticipantProgression(
  bracket: IBracketState,
  matches: MatchData[],
  participants: ParticipantInfo[],
  category: "individual" | "team",
  thirdPlaceId?: string // Optional third place participant ID to properly label them
): ParticipantProgression[] {
  const progressions: ParticipantProgression[] = [];
  const totalRounds = bracket.rounds.length;

  for (const participant of participants) {
    let matchesPlayed = 0;
    let highestRound = 0;
    let eliminationRound: string | undefined;
    let eliminationRoundNumber: number | undefined;
    let eliminatedBy: { participantId: string; participantName: string } | undefined;

    // Check all rounds
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        if (
          match.participant1 === participant.id ||
          match.participant2 === participant.id
        ) {
          if (match.completed) {
            matchesPlayed++;
            highestRound = Math.max(highestRound, round.roundNumber);

            // Check if they lost
            if (match.winner && match.winner !== participant.id) {
              eliminationRound = round.roundName;
              eliminationRoundNumber = round.roundNumber;
              eliminatedBy = {
                participantId: match.winner,
                participantName:
                  participants.find((p) => p.id === match.winner)?.name || "Unknown",
              };
            }
          }
        }
      }
    }

    // Determine round reached based on elimination
    // If this participant is the third place finisher, label them as "Third Place"
    let roundReached = getRoundReachedLabel(
      eliminationRoundNumber,
      totalRounds,
      bracket
    );

    // Override label if this is the third place finisher
    if (thirdPlaceId && participant.id === thirdPlaceId && roundReached === "Semi-finalist") {
      roundReached = "Third Place";
    }

    progressions.push({
      participantId: participant.id,
      participantName: participant.name,
      seedNumber: participant.seedNumber,
      matchesPlayed,
      roundReached,
      eliminationRound,
      eliminatedBy,
    });
  }

  return progressions;
}

/**
 * Calculate win-loss statistics for all participants
 */
function calculateParticipantStats(
  matches: MatchData[],
  participants: ParticipantInfo[],
  category: "individual" | "team"
): ParticipantStats[] {
  const stats: ParticipantStats[] = [];

  for (const participant of participants) {
    let matchesWon = 0;
    let matchesLost = 0;
    let setsWon = 0;
    let setsLost = 0;
    let pointsScored = 0;
    let pointsConceded = 0;

    for (const match of matches) {
      if (match.status !== "completed") continue;

      const participantSide = getParticipantSideInMatch(match, participant.id, category);
      if (!participantSide) continue;

      // Count match win/loss
      const isWinner = isParticipantWinner(match, participantSide, category);
      if (isWinner) {
        matchesWon++;
      } else {
        matchesLost++;
      }

      // Count sets and points
      if (category === "individual" && match.finalScore && match.games) {
        const mySets = participantSide === "side1" ? match.finalScore.side1Sets : match.finalScore.side2Sets;
        const opponentSets = participantSide === "side1" ? match.finalScore.side2Sets : match.finalScore.side1Sets;

        setsWon += mySets;
        setsLost += opponentSets;

        // Sum points from all games
        for (const game of match.games) {
          if (participantSide === "side1") {
            pointsScored += game.side1Score;
            pointsConceded += game.side2Score;
          } else {
            pointsScored += game.side2Score;
            pointsConceded += game.side1Score;
          }
        }
      }
    }

    stats.push({
      participantId: participant.id,
      participantName: participant.name,
      matchesWon,
      matchesLost,
      setsWon,
      setsLost,
      setsDiff: setsWon - setsLost,
      pointsScored,
      pointsConceded,
      pointsDiff: pointsScored - pointsConceded,
    });
  }

  return stats;
}

/**
 * Calculate performance metrics for all participants
 */
function calculatePerformanceMetrics(
  matches: MatchData[],
  participants: ParticipantInfo[],
  category: "individual" | "team"
): PerformanceMetrics[] {
  const metrics: PerformanceMetrics[] = [];

  for (const participant of participants) {
    let totalPoints = 0;
    let totalPointsConceded = 0;
    let totalSets = 0;
    let biggestMargin = -Infinity;
    let biggestWin: MatchHighlight | null = null;
    let closestMargin = Infinity;
    let closestMatch: MatchHighlight | null = null;

    for (const match of matches) {
      if (match.status !== "completed") continue;

      const participantSide = getParticipantSideInMatch(match, participant.id, category);
      if (!participantSide) continue;

      if (category === "individual" && match.games && match.finalScore) {
        const opponentId = getOpponentId(match, participant.id, category);
        const opponentName = participants.find((p) => p.id === opponentId)?.name || "Unknown";

        // Sum points from games
        let myPoints = 0;
        let oppPoints = 0;
        for (const game of match.games) {
          if (participantSide === "side1") {
            myPoints += game.side1Score;
            oppPoints += game.side2Score;
          } else {
            myPoints += game.side2Score;
            oppPoints += game.side1Score;
          }
        }

        totalPoints += myPoints;
        totalPointsConceded += oppPoints;
        totalSets += match.games.length;

        const margin = myPoints - oppPoints;
        const isWinner = isParticipantWinner(match, participantSide, category);

        // Track biggest win
        if (isWinner && margin > biggestMargin) {
          biggestMargin = margin;
          const mySets = participantSide === "side1" ? match.finalScore.side1Sets : match.finalScore.side2Sets;
          const oppSets = participantSide === "side1" ? match.finalScore.side2Sets : match.finalScore.side1Sets;
          biggestWin = {
            opponentName,
            setScore: `${mySets}-${oppSets}`,
            pointMargin: margin,
            roundName: match.roundName || "Unknown Round",
          };
        }

        // Track closest match (5+ sets or close deciding set)
        if (match.games.length >= 3) {
          const lastGame = match.games[match.games.length - 1];
          const lastGameMargin = Math.abs(
            lastGame.side1Score - lastGame.side2Score
          );
          if (lastGameMargin < closestMargin) {
            closestMargin = lastGameMargin;
            const mySets = participantSide === "side1" ? match.finalScore.side1Sets : match.finalScore.side2Sets;
            const oppSets = participantSide === "side1" ? match.finalScore.side2Sets : match.finalScore.side1Sets;
            closestMatch = {
              opponentName,
              setScore: `${mySets}-${oppSets}`,
              deciderScore: `${lastGame.side1Score}-${lastGame.side2Score}`,
              roundName: match.roundName || "Unknown Round",
            };
          }
        }
      }
    }

    const avgPointsPerSet = totalSets > 0 ? totalPoints / totalSets : 0;
    const avgPointsConcededPerSet = totalSets > 0 ? totalPointsConceded / totalSets : 0;

    metrics.push({
      participantId: participant.id,
      participantName: participant.name,
      avgPointsPerSet: Math.round(avgPointsPerSet * 10) / 10,
      avgPointsConcededPerSet: Math.round(avgPointsConcededPerSet * 10) / 10,
      biggestWin: biggestWin || {
        opponentName: "N/A",
        setScore: "0-0",
        pointMargin: 0,
        roundName: "N/A",
      },
      closestMatch: closestMatch || {
        opponentName: "N/A",
        setScore: "0-0",
        deciderScore: "0-0",
        roundName: "N/A",
      },
    });
  }

  return metrics;
}

// ============ HELPER FUNCTIONS ============

/**
 * Get medalist information from participant ID
 */
function getParticipantMedalist(
  participantId: string | null,
  participants: ParticipantInfo[]
): Medalist {
  if (!participantId) {
    return { participantId: "", participantName: "Unknown", seedNumber: undefined };
  }

  const participant = participants.find((p) => p.id === participantId);
  if (!participant) {
    return { participantId, participantName: "Unknown", seedNumber: undefined };
  }

  return {
    participantId: participant.id,
    participantName: participant.name,
    seedNumber: participant.seedNumber,
  };
}

/**
 * Get match score with set breakdown
 */
function getMatchScore(
  match: MatchData,
  winnerId: string,
  category: "individual" | "team"
): MatchScore {
  if (category === "individual" && match.finalScore && match.games) {
    const winnerSide = getParticipantSideInMatch(match, winnerId, category);
    const side1Sets = match.finalScore.side1Sets;
    const side2Sets = match.finalScore.side2Sets;

    const setsBreakdown = match.games.map((game) => [game.side1Score, game.side2Score]);

    return {
      side1Sets: winnerSide === "side1" ? side1Sets : side2Sets,
      side2Sets: winnerSide === "side1" ? side2Sets : side1Sets,
      setsBreakdown,
    };
  }

  return {
    side1Sets: 0,
    side2Sets: 0,
    setsBreakdown: [],
  };
}

/**
 * Get participant side in match (side1/side2 or team1/team2)
 */
function getParticipantSideInMatch(
  match: MatchData,
  participantId: string,
  category: "individual" | "team"
): "side1" | "side2" | null {
  if (category === "individual" && match.participants) {
    const index = match.participants.findIndex((p) => p.toString() === participantId);
    return index === 0 ? "side1" : index === 1 ? "side2" : null;
  } else if (category === "team") {
    if (match.team1?.teamId.toString() === participantId) return "side1";
    if (match.team2?.teamId.toString() === participantId) return "side2";
  }
  return null;
}

/**
 * Check if participant is winner
 */
function isParticipantWinner(
  match: MatchData,
  participantSide: "side1" | "side2",
  category: "individual" | "team"
): boolean {
  if (category === "individual") {
    return match.winnerSide === participantSide;
  } else {
    const teamSide = participantSide === "side1" ? "team1" : "team2";
    return match.winnerTeam === teamSide;
  }
}

/**
 * Get opponent ID
 */
function getOpponentId(
  match: MatchData,
  participantId: string,
  category: "individual" | "team"
): string {
  if (category === "individual" && match.participants) {
    return match.participants.find((p) => p.toString() !== participantId)?.toString() || "";
  } else if (category === "team") {
    if (match.team1?.teamId.toString() === participantId) {
      return match.team2?.teamId.toString() || "";
    } else {
      return match.team1?.teamId.toString() || "";
    }
  }
  return "";
}

/**
 * Get round reached label based on elimination round
 * @param eliminationRoundNumber - The round number where participant was eliminated (undefined if won tournament)
 * @param totalRounds - Total number of rounds in the tournament
 * @param bracket - The bracket state
 */
function getRoundReachedLabel(
  eliminationRoundNumber: number | undefined,
  totalRounds: number,
  bracket: IBracketState
): string {
  // If never eliminated, they won the tournament
  if (eliminationRoundNumber === undefined) {
    return "Champion";
  }

  // Calculate how many rounds from the end they were eliminated
  const roundsFromEnd = totalRounds - eliminationRoundNumber;

  // Map elimination round to position
  switch (roundsFromEnd) {
    case 0:
      // Lost in the final round
      return "Runner-up";
    case 1:
      // Lost in the semi-final round
      return "Semi-finalist";
    case 2:
      // Lost in the quarter-final round
      return "Quarter-finalist";
    case 3:
      // Lost in Round of 16
      return "Round of 16";
    case 4:
      // Lost in Round of 32
      return "Round of 32";
    default:
      // For earlier rounds, use generic label
      return `Round ${eliminationRoundNumber}`;
  }
}
