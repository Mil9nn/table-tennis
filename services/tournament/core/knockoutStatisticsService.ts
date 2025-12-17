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

  if (tournament.format !== "knockout") {
    throw new Error("Tournament is not a knockout format");
  }

  // Fetch bracket
  const bracket = await BracketState.findOne({ tournament: tournamentId });
  if (!bracket) {
    throw new Error("Bracket not found for tournament");
  }

  // Fetch all matches
  const matches = await Match.find({ tournament: tournamentId }).lean();

  // Fetch participants with seeding info
  const participants = await fetchParticipants(tournament, tournament.category);

  // Calculate all statistics categories
  const outcome = extractTournamentOutcome(bracket, matches, participants, tournament.category);
  const participantProgression = calculateParticipantProgression(
    bracket,
    matches,
    participants,
    tournament.category
  );
  const participantStats = calculateParticipantStats(matches, participants, tournament.category);
  const performanceMetrics = calculatePerformanceMetrics(matches, participants, tournament.category);

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
 */
async function fetchParticipants(
  tournament: any,
  category: "individual" | "team"
): Promise<ParticipantInfo[]> {
  const participants: ParticipantInfo[] = [];

  for (const participantId of tournament.participants) {
    const idStr = participantId.toString();

    if (category === "individual") {
      const user = await User.findById(participantId).lean();
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
      const team = await Team.findById(participantId).lean();
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
  let finalMatchScore: MatchScore | undefined;

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

  return {
    champion,
    runnerUp,
    thirdPlace,
    finalMatchScore,
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
  category: "individual" | "team"
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
    const roundReached = getRoundReachedLabel(
      eliminationRoundNumber,
      totalRounds,
      bracket
    );

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
