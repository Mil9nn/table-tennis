/**
 * Population Service
 *
 * Provides reusable population utilities for Individual and Team matches.
 * Eliminates repeated .populate() chains across 14+ route handlers.
 */

import { Query } from "mongoose";

export interface PopulationOptions {
  includeScorer?: boolean;      // default: true
  includeTournament?: boolean;  // default: false
  includeShots?: boolean;       // default: true
  userFields?: string;          // default: "username fullName profileImage"
}

const DEFAULT_USER_FIELDS = "username fullName profileImage";

/**
 * Populate an individual match with all related data
 *
 * @param query - Mongoose query to apply population to
 * @param options - Optional configuration for what to populate
 * @returns Query with population chains applied
 *
 * @example
 * const match = await populateIndividualMatch(IndividualMatch.findById(id)).exec();
 */
export function populateIndividualMatch<T>(
  query: Query<T, any>,
  options: PopulationOptions = {}
): Query<T, any> {
  const {
    includeScorer = true,
    includeTournament = false,
    includeShots = true,
    userFields = DEFAULT_USER_FIELDS,
  } = options;

  // Always populate participants
  query = query.populate("participants", userFields);

  // Optionally populate scorer
  if (includeScorer) {
    query = query.populate("scorer", userFields);
  }

  // Optionally populate tournament (with organizer and scorers for permission checks)
  if (includeTournament) {
    query = query.populate({
      path: "tournament",
      select: "name format status organizer scorers",
      populate: [
        { path: "organizer", select: "username fullName profileImage" },
        { path: "scorers", select: "username fullName profileImage" }
      ]
    });
  }

  // Optionally populate shot players
  if (includeShots) {
    query = query.populate("games.shots.player", userFields);
  }

  return query;
}

/**
 * Populate an individual match with basic data (participants + scorer only)
 * Useful for list views where shot data isn't needed
 *
 * @example
 * const matches = await populateIndividualMatchBasic(IndividualMatch.find()).exec();
 */
export function populateIndividualMatchBasic<T>(
  query: Query<T, any>,
  options: PopulationOptions = {}
): Query<T, any> {
  const {
    userFields = DEFAULT_USER_FIELDS,
  } = options;

  return query
    .populate("participants", userFields)
    .populate("scorer", userFields);
}

/**
 * Populate a team match with all related data
 *
 * @param query - Mongoose query to apply population to
 * @param options - Optional configuration for what to populate
 * @returns Query with population chains applied
 *
 * @example
 * const match = await populateTeamMatch(TeamMatch.findById(id)).exec();
 */
export function populateTeamMatch<T>(
  query: Query<T, any>,
  options: PopulationOptions = {}
): Query<T, any> {
  const {
    includeScorer = true,
    includeTournament = false,
    includeShots = true,
    userFields = DEFAULT_USER_FIELDS,
  } = options;

  // Always populate team players and captains
  query = query
    .populate("team1.players.user team2.players.user", userFields)
    .populate("team1.captain team2.captain", "username fullName");

  // Always populate submatch players
  query = query.populate(
    "subMatches.playerTeam1 subMatches.playerTeam2",
    userFields
  );

  // Optionally populate scorer
  if (includeScorer) {
    query = query.populate("scorer", userFields);
  }

  // Optionally populate tournament (with organizer and scorers for permission checks)
  if (includeTournament) {
    query = query.populate({
      path: "tournament",
      select: "name format status organizer scorers",
      populate: [
        { path: "organizer", select: "username fullName profileImage" },
        { path: "scorers", select: "username fullName profileImage" }
      ]
    });
  }

  // Optionally populate shot players
  if (includeShots) {
    query = query.populate({
      path: "subMatches.games.shots.player",
      select: userFields,
    });
  }

  return query;
}

/**
 * Populate a team match with basic data (team players + scorer only)
 * Useful for list views where shot data isn't needed
 *
 * @example
 * const matches = await populateTeamMatchBasic(TeamMatch.find()).exec();
 */
export function populateTeamMatchBasic<T>(
  query: Query<T, any>,
  options: PopulationOptions = {}
): Query<T, any> {
  const {
    userFields = DEFAULT_USER_FIELDS,
  } = options;

  return query
    .populate("team1.players.user team2.players.user", userFields)
    .populate("team1.captain team2.captain", "username fullName")
    .populate("subMatches.playerTeam1 subMatches.playerTeam2", userFields)
    .populate("scorer", userFields);
}
