/**
 * Tournament Permission Helpers
 * 
 * Centralized permission checks for tournament-related actions.
 */

import { connectDB } from "@/lib/mongodb";
import Tournament from "@/models/Tournament";

/**
 * Check if a user can score matches in a tournament.
 * 
 * A user can score if they are:
 * 1. The tournament organizer (admin)
 * 2. In the tournament's scorers array
 * 
 * @param userId - The user's ID to check
 * @param tournamentId - The tournament's ID
 * @returns true if user can score, false otherwise
 */
export async function canScoreTournamentMatch(
  userId: string,
  tournamentId: string
): Promise<boolean> {
  try {
    await connectDB();
    
    const tournament = await Tournament.findById(tournamentId)
      .select("organizer scorers")
      .lean<{ organizer: any; scorers?: any[] }>();
    
    if (!tournament) return false;
    
    // Admin (organizer) can always score
    if (tournament.organizer?.toString() === userId) return true;
    
    // Check if user is in scorers array
    return tournament.scorers?.some(
      (scorerId: any) => scorerId?.toString() === userId
    ) ?? false;
  } catch (error) {
    console.error("Error checking tournament scoring permission:", error);
    return false;
  }
}

/**
 * Check if a user is the tournament admin (organizer).
 * 
 * @param userId - The user's ID to check
 * @param tournamentId - The tournament's ID
 * @returns true if user is admin, false otherwise
 */
export async function isTournamentAdmin(
  userId: string,
  tournamentId: string
): Promise<boolean> {
  try {
    await connectDB();
    
    const tournament = await Tournament.findById(tournamentId)
      .select("organizer")
      .lean<{ organizer: any }>();
    
    if (!tournament) return false;
    
    return tournament.organizer?.toString() === userId;
  } catch (error) {
    console.error("Error checking tournament admin permission:", error);
    return false;
  }
}

/**
 * Get tournament with scorer info for permission checking.
 * Returns null if tournament doesn't exist.
 */
export async function getTournamentScorerInfo(tournamentId: string) {
  try {
    await connectDB();
    
    return await Tournament.findById(tournamentId)
      .select("organizer scorers")
      .lean<{ organizer: any; scorers?: any[] }>();
  } catch (error) {
    console.error("Error fetching tournament scorer info:", error);
    return null;
  }
}

/**
 * Check scoring permission using pre-fetched tournament data.
 * Use this when you already have the tournament data to avoid extra DB calls.
 */
export function canScoreWithTournamentData(
  userId: string,
  tournament: { organizer: any; scorers?: any[] } | null
): boolean {
  if (!tournament) return false;
  
  // Admin (organizer) can always score
  if (tournament.organizer?.toString() === userId) return true;
  
  // Check if user is in scorers array
  return tournament.scorers?.some(
    (scorerId: any) => scorerId?.toString() === userId
  ) ?? false;
}
