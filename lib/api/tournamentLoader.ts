/**
 * Tournament Loader Utilities
 *
 * Centralized tournament fetching with permission checks and population.
 * Replaces duplicated tournament loading patterns across 18+ routes.
 */

import Tournament, { ITournament } from "@/models/Tournament";
import Team from "@/models/Team";
import { User } from "@/models/User";
import BracketState from "@/models/BracketState";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import { connectDB } from "@/lib/mongodb";
import { ApiError } from "./http";

export interface TournamentLoadOptions {
  /** Require the user to be the tournament organizer */
  requireOrganizer?: boolean;
  /** Require the user to be either organizer or a scorer */
  requireOrganizerOrScorer?: boolean;
  /** Populate participants based on tournament category */
  populateParticipants?: boolean;
  /** Populate scorers */
  populateScorers?: boolean;
  /** Populate standings */
  populateStandings?: boolean;
  /** Populate groups with participants and standings */
  populateGroups?: boolean;
  /** Populate seeding */
  populateSeeding?: boolean;
  /** Populate bracket for knockout/hybrid tournaments */
  populateBracket?: boolean;
  /** Populate round matches */
  populateRounds?: boolean;
  /** Skip DB connection (if already connected) */
  skipConnect?: boolean;
}

export interface LoadedTournament {
  tournament: ITournament;
  isTeamTournament: boolean;
}

/**
 * Load a tournament with permission checks and optional population
 *
 * @throws ApiError if tournament not found or permission denied
 *
 * @example
 * ```ts
 * const { tournament, isTeamTournament } = await loadTournament(id, userId, {
 *   requireOrganizer: true,
 *   populateParticipants: true,
 * });
 * ```
 */
export async function loadTournament(
  tournamentId: string,
  userId: string | null,
  options: TournamentLoadOptions = {}
): Promise<LoadedTournament> {
  if (!options.skipConnect) {
    await connectDB();
  }

  // Ensure models are registered for population
  void IndividualMatch;
  void TeamMatch;
  void User;
  void Team;

  // First fetch to check category and permissions
  const tournamentRaw = await Tournament.findById(tournamentId);

  if (!tournamentRaw) {
    throw ApiError.notFound("Tournament");
  }

  const isTeamTournament = tournamentRaw.category === "team";

  // Permission checks
  if (options.requireOrganizer) {
    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }
    if (tournamentRaw.organizer.toString() !== userId) {
      throw ApiError.forbidden("Only the organizer can perform this action");
    }
  }

  if (options.requireOrganizerOrScorer) {
    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }
    const isOrganizer = tournamentRaw.organizer.toString() === userId;
    const isScorer = tournamentRaw.scorers?.some(
      (s: any) => s.toString() === userId
    );
    if (!isOrganizer && !isScorer) {
      throw ApiError.forbidden("Not authorized for this tournament");
    }
  }

  // If no population needed, return early
  if (
    !options.populateParticipants &&
    !options.populateScorers &&
    !options.populateStandings &&
    !options.populateGroups &&
    !options.populateSeeding &&
    !options.populateBracket &&
    !options.populateRounds
  ) {
    return { tournament: tournamentRaw, isTeamTournament };
  }

  // Build populated query
  let query = Tournament.findById(tournamentId).populate(
    "organizer",
    "username fullName profileImage"
  );

  if (options.populateScorers) {
    query = query.populate("scorers", "username fullName profileImage");
  }

  // Populate based on category
  if (options.populateParticipants) {
    if (isTeamTournament) {
      query = query.populate({
        path: "participants",
        model: Team,
        select: "name logo city captain players",
        populate: [
          { path: "captain", select: "username fullName profileImage" },
          { path: "players.user", select: "username fullName profileImage" },
        ],
      });
    } else {
      query = query.populate({
        path: "participants",
        model: User,
        select: "username fullName profileImage",
        options: { strictPopulate: false },
      });
    }
  }

  if (options.populateStandings) {
    if (isTeamTournament) {
      query = query.populate({
        path: "standings.participant",
        model: Team,
        select: "name logo city captain",
      });
    } else {
      query = query.populate(
        "standings.participant",
        "username fullName profileImage"
      );
    }
  }

  if (options.populateGroups) {
    if (isTeamTournament) {
      query = query
        .populate({
          path: "groups.standings.participant",
          model: Team,
          select: "name logo city captain",
        })
        .populate({
          path: "groups.participants",
          model: Team,
          select: "name logo city captain players",
          populate: [
            { path: "captain", select: "username fullName profileImage" },
            { path: "players.user", select: "username fullName profileImage" },
          ],
        });
    } else {
      query = query
        .populate(
          "groups.standings.participant",
          "username fullName profileImage"
        )
        .populate("groups.participants", "username fullName profileImage");
    }
  }

  if (options.populateSeeding) {
    if (isTeamTournament) {
      query = query.populate({
        path: "seeding.participant",
        model: Team,
        select: "name logo city captain",
      });
    } else {
      query = query.populate(
        "seeding.participant",
        "username fullName profileImage"
      );
    }
  }

  if (options.populateRounds) {
    const MatchModel = isTeamTournament ? TeamMatch : IndividualMatch;
    const matchPopulate = isTeamTournament
      ? [
          {
            path: "team1.captain",
            select: "username fullName profileImage",
          },
          {
            path: "team2.captain",
            select: "username fullName profileImage",
          },
          {
            path: "subMatches.playerTeam1",
            select: "username fullName profileImage",
          },
          {
            path: "subMatches.playerTeam2",
            select: "username fullName profileImage",
          },
        ]
      : { path: "participants", select: "username fullName profileImage" };

    query = query
      .populate({
        path: "rounds.matches",
        model: MatchModel,
        populate: matchPopulate,
      })
      .populate({
        path: "groups.rounds.matches",
        model: MatchModel,
        populate: matchPopulate,
      });
  }

  const tournament = await query;

  if (!tournament) {
    throw ApiError.notFound("Tournament");
  }

  // Load bracket from BracketState if needed
  if (
    options.populateBracket &&
    (tournament.format === "knockout" || tournament.format === "hybrid")
  ) {
    await loadBracketData(tournament, isTeamTournament);
  }

  return { tournament, isTeamTournament };
}

/**
 * Load bracket data from BracketState and populate matches
 */
async function loadBracketData(
  tournament: ITournament,
  isTeamTournament: boolean
): Promise<void> {
  // If bracket not in tournament document, try BracketState
  if (!tournament.bracket) {
    const bracketState = await BracketState.findOne({
      tournament: tournament._id,
    });
    if (bracketState) {
      (tournament as any).bracket = {
        size: bracketState.size,
        rounds: bracketState.rounds,
        currentRound: bracketState.currentRound,
        completed: bracketState.completed,
        thirdPlaceMatch: bracketState.thirdPlaceMatch,
      };
    }
  }

  if (!tournament.bracket) return;

  // Collect all matchIds from bracket
  const matchIds: string[] = [];

  tournament.bracket.rounds?.forEach((round: any) => {
    round.matches?.forEach((match: any) => {
      if (match.matchId) {
        matchIds.push(match.matchId);
      }
    });
  });

  if (tournament.bracket.thirdPlaceMatch?.matchId) {
    matchIds.push(tournament.bracket.thirdPlaceMatch.matchId);
  }

  if (matchIds.length === 0) return;

  // Fetch and populate bracket matches
  const MatchModel = isTeamTournament ? TeamMatch : IndividualMatch;
  let bracketMatchesQuery;

  if (isTeamTournament) {
    bracketMatchesQuery = (MatchModel as any).find({ _id: { $in: matchIds } })
      .populate("team1.captain", "username fullName profileImage")
      .populate("team2.captain", "username fullName profileImage")
      .populate("subMatches.playerTeam1", "username fullName profileImage")
      .populate("subMatches.playerTeam2", "username fullName profileImage");
  } else {
    bracketMatchesQuery = (MatchModel as any).find({ _id: { $in: matchIds } }).populate(
      "participants",
      "username fullName profileImage"
    );
  }

  const bracketMatches = await bracketMatchesQuery;

  // Create map for quick lookup
  const matchMap = new Map();
  bracketMatches.forEach((match: any) => {
    matchMap.set(match._id.toString(), match.toObject());
  });

  // Replace matchIds with populated match objects
  tournament.bracket.rounds?.forEach((round: any) => {
    round.matches?.forEach((bracketMatch: any) => {
      if (bracketMatch.matchId) {
        const populatedMatch = matchMap.get(bracketMatch.matchId.toString());
        if (populatedMatch) {
          bracketMatch.matchId = populatedMatch;
        }
      }
    });
  });

  if (tournament.bracket.thirdPlaceMatch?.matchId) {
    const populatedMatch = matchMap.get(
      tournament.bracket.thirdPlaceMatch.matchId.toString()
    );
    if (populatedMatch) {
      tournament.bracket.thirdPlaceMatch.matchId = populatedMatch;
    }
  }

  // For team tournaments, populate participant info in bracket
  if (isTeamTournament) {
    await populateBracketParticipants(tournament);
  }
}

/**
 * Populate team info in bracket participants
 */
async function populateBracketParticipants(
  tournament: ITournament
): Promise<void> {
  if (!tournament.bracket?.rounds) return;

  const participantIds = new Set<string>();

  tournament.bracket.rounds.forEach((round: any) => {
    round.matches?.forEach((match: any) => {
      if (match.participant1)
        participantIds.add(match.participant1.toString());
      if (match.participant2)
        participantIds.add(match.participant2.toString());
    });
  });

  if (tournament.bracket.thirdPlaceMatch) {
    const tpm = tournament.bracket.thirdPlaceMatch;
    if (tpm.participant1) participantIds.add(tpm.participant1.toString());
    if (tpm.participant2) participantIds.add(tpm.participant2.toString());
  }

  if (participantIds.size === 0) return;

  const teams = await Team.find({ _id: { $in: Array.from(participantIds) } })
    .select("name logo city captain")
    .populate("captain", "username fullName profileImage")
    .lean();

  const teamMap = new Map();
  teams.forEach((team: any) => {
    teamMap.set(team._id.toString(), team);
  });

  tournament.bracket.rounds.forEach((round: any) => {
    round.matches?.forEach((match: any) => {
      if (match.participant1) {
        match.participant1Info = teamMap.get(match.participant1.toString());
      }
      if (match.participant2) {
        match.participant2Info = teamMap.get(match.participant2.toString());
      }
    });
  });

  if (tournament.bracket.thirdPlaceMatch) {
    const tpm = tournament.bracket.thirdPlaceMatch;
    if (tpm.participant1) {
      tpm.participant1Info = teamMap.get(tpm.participant1.toString());
    }
    if (tpm.participant2) {
      tpm.participant2Info = teamMap.get(tpm.participant2.toString());
    }
  }
}

/**
 * Get the appropriate match model based on tournament category
 */
export function getMatchModel(category: "individual" | "team") {
  return category === "team" ? TeamMatch : IndividualMatch;
}

/**
 * Get participant population config based on tournament category
 */
export function getParticipantPopulateConfig(category: "individual" | "team") {
  if (category === "team") {
    return {
      model: Team,
      select: "name logo city captain players",
      populate: [
        { path: "captain", select: "username fullName profileImage" },
        { path: "players.user", select: "username fullName profileImage" },
      ],
    };
  }
  return {
    model: User,
    select: "username fullName profileImage",
  };
}

/**
 * Filter out null/unpopulated participants from tournament data
 */
export function filterValidParticipants(
  participants: any[],
  isTeamTournament: boolean
): any[] {
  return participants.filter((p: any) => {
    if (!p || typeof p !== "object" || Array.isArray(p)) {
      return false;
    }

    if (!p._id && !p.id) {
      return false;
    }

    if (isTeamTournament) {
      return !!p.name;
    } else {
      return !!(p.username || p.fullName);
    }
  });
}
