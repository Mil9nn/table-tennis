import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { validateRequest, updateTournamentSchema } from "@/lib/validations";
import mongoose from "mongoose";

// CRITICAL: Import models in correct order to ensure discriminators are registered
// 1. Import base Match model first
import Match from "@/models/MatchBase";
// 2. Import discriminators (this registers them on Match)
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
// 3. Import other models
import Tournament from "@/models/Tournament";
import TournamentIndividual from "@/models/TournamentIndividual";
import TournamentTeam from "@/models/TournamentTeam";
import { User } from "@/models/User";
import Team from "@/models/Team";
import BracketState from "@/models/BracketState";

// Helper to get population config based on tournament category
function getParticipantPopulateConfig(category: "individual" | "team") {
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

// Helper to get match model based on tournament category
/**
 * Helper: Normalize pair ID to consistent string format
 */
function normalizePairId(pairId: any): string {
  if (!pairId) return '';
  if (typeof pairId === 'string') return pairId;
  if (pairId?.toString) return pairId.toString();
  return String(pairId);
}

/**
 * Helper: Ensure doublesPairs are populated with player information
 * Returns populated pairs with normalized IDs
 */
async function ensureDoublesPairsPopulated(doublesPairs: any[]): Promise<any[]> {
  if (!doublesPairs || doublesPairs.length === 0) {
    return [];
  }

  // Extract player IDs (handle both ObjectId and populated User objects)
  const playerIds: string[] = [];
  doublesPairs.forEach((pair: any) => {
    // player1 and player2 are ObjectIds in the database
    // If already populated, they'll be objects with _id
    // If not populated, they'll be ObjectIds
    const p1Id = pair.player1?._id?.toString() || pair.player1?.toString();
    const p2Id = pair.player2?._id?.toString() || pair.player2?.toString();
    if (p1Id) playerIds.push(p1Id);
    if (p2Id) playerIds.push(p2Id);
  });

  // Convert playerIds to ObjectIds for MongoDB query
  const playerObjectIds = playerIds
    .filter((id): id is string => Boolean(id && mongoose.Types.ObjectId.isValid(id)))
    .map(id => new mongoose.Types.ObjectId(id));

  // Fetch users that aren't already populated
  const users = playerObjectIds.length > 0
    ? await User.find({ _id: { $in: playerObjectIds } })
        .select("username fullName profileImage")
        .lean()
    : [];
  const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

  // Populate pairs with user info (handle both already-populated and unpopulated cases)
  const populatedPairs = doublesPairs.map((pair: any) => {
    const p1Id = pair.player1?._id?.toString() || pair.player1?.toString();
    const p2Id = pair.player2?._id?.toString() || pair.player2?.toString();

    // Check if already populated (has _id property indicating it's a User object)
    const player1Populated = pair.player1 && typeof pair.player1 === 'object' && pair.player1._id && pair.player1.username;
    const player2Populated = pair.player2 && typeof pair.player2 === 'object' && pair.player2._id && pair.player2.username;

    return {
      _id: pair._id,
      player1: player1Populated
        ? pair.player1 // Already populated
        : (p1Id ? userMap.get(p1Id) || null : null),
      player2: player2Populated
        ? pair.player2 // Already populated
        : (p2Id ? userMap.get(p2Id) || null : null),
    };
  });

  // Log if any players weren't found
  const missingPlayers = populatedPairs.filter(p => !p.player1 || !p.player2);
  if (missingPlayers.length > 0) {
    console.warn(`[ensureDoublesPairsPopulated] ${missingPlayers.length} pairs have missing player data`);
    missingPlayers.forEach((pair, idx) => {
      const p1Id = doublesPairs[idx]?.player1?.toString();
      const p2Id = doublesPairs[idx]?.player2?.toString();
      console.warn(`[ensureDoublesPairsPopulated] Pair ${pair._id}: player1=${p1Id} (found: ${!!pair.player1}), player2=${p2Id} (found: ${!!pair.player2})`);
    });
  }

  return populatedPairs;
}

function getMatchModel(category: "individual" | "team") {
  return category === "team" ? TeamMatch : IndividualMatch;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Ensure models are registered for population
    // Explicitly reference models to ensure they're loaded
    const IndividualMatchModel = IndividualMatch;
    const TeamMatchModel = TeamMatch;
    const UserModel = User;
    const TeamModel = Team;
    
    if (!IndividualMatchModel || !UserModel || !TeamModel || !TeamMatchModel) {
      throw new Error("Required models not loaded");
    }

    const { id } = await context.params;

    // Use base Tournament model to fetch and determine category
    const tournamentRaw = await Tournament.findById(id);
    if (!tournamentRaw) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const isTeamTournament = tournamentRaw.category === "team";
    const participantConfig = getParticipantPopulateConfig(tournamentRaw.category);
    // Use the actual model instead of string name to ensure it's registered
    const MatchModel = isTeamTournament ? TeamMatch : IndividualMatch;
    
    // Use category-specific model for proper population (like loadTournament does)
    const TournamentModel = isTeamTournament ? TournamentTeam : TournamentIndividual;

    // Build the populate configuration using category-specific model for proper schema support
    let query: any = (TournamentModel as any).findById(id)
      .populate("organizer", "username fullName profileImage")
      .populate({
        path: "scorers",
        select: "username fullName profileImage",
        options: { strictPopulate: false } // Don't fail if scorers field doesn't exist in some documents
      });

    // Populate participants based on category
    if (isTeamTournament) {
      query = query
        .populate({
          path: "participants",
          model: Team,
          select: "name logo city captain players",
          populate: [
            { path: "captain", select: "username fullName profileImage" },
            { path: "players.user", select: "username fullName profileImage" },
          ],
        })
        .populate({
          path: "standings.participant",
          model: Team,
          select: "name logo city captain",
        })
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
        })
        .populate({
          path: "seeding.participant",
          model: Team,
          select: "name logo city captain",
        })
        .populate({
          path: "qualifiedParticipants",
          model: Team,
          select: "name logo city captain",
        });
    } else {
      // For individual tournaments, populate participants from User model
      const isDoublesTournament = 
        tournamentRaw.matchType === "doubles";
      
      query = query
        .populate({
          path: "participants",
          model: User,
          select: "username fullName profileImage",
          options: { strictPopulate: false } // Don't fail if some users don't exist
        });
      
      // For doubles tournaments, don't populate standings.participant or groups.standings.participant as User
      // because they're actually pair IDs, not user IDs. We'll handle it manually later.
      if (!isDoublesTournament) {
        query = query
          .populate("standings.participant", "username fullName profileImage")
          .populate("groups.standings.participant", "username fullName profileImage")
          .populate("groups.participants", "username fullName profileImage");
      } else {
        // CRITICAL: For doubles tournaments, groups.participants and groups.standings.participant contain pair IDs, not user IDs
        // DO NOT populate them as Users - this would cause incorrect data
        // We'll manually populate them as pair objects later
        // No populate needed here for doubles tournaments
      }
      
      query = query
        .populate("seeding.participant", "username fullName profileImage")
        .populate("qualifiedParticipants", "username fullName profileImage");
    }

    // Populate matches based on category
    query = query
      .populate({
        path: "rounds.matches",
        model: MatchModel,
        populate: isTeamTournament
          ? [
              { path: "team1.captain", select: "username fullName profileImage" },
              { path: "team2.captain", select: "username fullName profileImage" },
              { path: "subMatches.playerTeam1", select: "username fullName profileImage" },
              { path: "subMatches.playerTeam2", select: "username fullName profileImage" },
            ]
          : {
              path: "participants",
              select: "username fullName profileImage",
            },
      })
      .populate({
        path: "groups.rounds.matches",
        model: MatchModel,
        populate: isTeamTournament
          ? [
              { path: "team1.captain", select: "username fullName profileImage" },
              { path: "team2.captain", select: "username fullName profileImage" },
              { path: "subMatches.playerTeam1", select: "username fullName profileImage" },
              { path: "subMatches.playerTeam2", select: "username fullName profileImage" },
            ]
          : {
              path: "participants",
              select: "username fullName profileImage",
            },
      });

    const tournament = await query;

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }



    // For knockout/hybrid tournaments, load bracket from BracketState if not in tournament document
    if (tournament.format === "knockout" || tournament.format === "hybrid") {
      // For hybrid tournaments in knockout phase, bracket is required
      const isHybridInKnockout = tournament.format === "hybrid" && tournament.currentPhase === "knockout";
      
      // If bracket is not in tournament document or is empty, try to load from BracketState
      const hasBracket = tournament.bracket && 
        typeof tournament.bracket === 'object' && 
        Object.keys(tournament.bracket).length > 0 &&
        tournament.bracket.rounds && 
        Array.isArray(tournament.bracket.rounds) && 
        tournament.bracket.rounds.length > 0;
      
      if (!hasBracket) {
        // Try to load from BracketState
        const bracketState = await BracketState.findOne({ tournament: id });
        if (bracketState) {
          // Validate BracketState has valid structure
          const hasValidBracketState = bracketState.rounds &&
            Array.isArray(bracketState.rounds) &&
            bracketState.rounds.length > 0;
          
          if (hasValidBracketState) {
            // Convert BracketState document to bracket object
            (tournament as any).bracket = {
              size: bracketState.size,
              rounds: bracketState.rounds,
              currentRound: bracketState.currentRound,
              completed: bracketState.completed,
              thirdPlaceMatch: bracketState.thirdPlaceMatch,
            };
            
          } else {
            console.warn(`[GET /tournaments/${id}] BracketState exists but has invalid structure`, {
              hasRounds: !!bracketState.rounds,
              roundsType: typeof bracketState.rounds,
              roundsLength: bracketState.rounds?.length || 0,
            });
          }
        } else if (isHybridInKnockout) {
          // For hybrid tournaments in knockout phase, bracket should exist
          console.warn(`[GET /tournaments/${id}] Hybrid tournament in knockout phase but no bracket found in tournament.bracket or BracketState`);
        }
      }
    }

    // For knockout/hybrid tournaments, manually populate bracket matches
    // (bracket is Schema.Types.Mixed, so auto-populate doesn't work)
    if ((tournament.format === "knockout" || tournament.format === "hybrid") && tournament.bracket) {
      const matchIds: string[] = [];

      // Collect all matchIds from bracket
      tournament.bracket.rounds?.forEach((round: any) => {
        round.matches?.forEach((match: any) => {
          if (match.matchId) {
            matchIds.push(match.matchId);
          }
        });
      });

      // Add third place match if exists
      if (tournament.bracket.thirdPlaceMatch?.matchId) {
        matchIds.push(tournament.bracket.thirdPlaceMatch.matchId);
      }

      // Fetch and populate all bracket matches
      if (matchIds.length > 0) {
        let bracketMatchesQuery;
        
        if (isTeamTournament) {
          bracketMatchesQuery = TeamMatch.find({ _id: { $in: matchIds } })
            .populate("team1.captain", "username fullName profileImage")
            .populate("team2.captain", "username fullName profileImage")
            .populate("subMatches.playerTeam1", "username fullName profileImage")
            .populate("subMatches.playerTeam2", "username fullName profileImage");
        } else {
          bracketMatchesQuery = IndividualMatch.find({ _id: { $in: matchIds } })
            .populate({
              path: "participants",
              select: "username fullName profileImage _id"
            });
        }

        const bracketMatches = await bracketMatchesQuery;

        // Create a map for quick lookup
        const matchMap = new Map();
        bracketMatches.forEach((match: any) => {
          matchMap.set(match._id.toString(), match.toObject());
        });

        // Replace matchIds with populated match objects in bracket structure
        tournament.bracket.rounds?.forEach((round: any) => {
          round.matches?.forEach((bracketMatch: any) => {
            if (bracketMatch.matchId) {
              const populatedMatch = matchMap.get(bracketMatch.matchId.toString());
              if (populatedMatch) {
                // Store the populated match as an embedded object
                bracketMatch.matchId = populatedMatch;
              }
            }
          });
        });

        // Handle third place match
        if (tournament.bracket.thirdPlaceMatch?.matchId) {
          const populatedMatch = matchMap.get(
            tournament.bracket.thirdPlaceMatch.matchId.toString()
          );
          if (populatedMatch) {
            tournament.bracket.thirdPlaceMatch.matchId = populatedMatch;
          }
        }
      }

      // For team tournaments, also populate participant info in bracket
      if (isTeamTournament && tournament.bracket.rounds) {
        const participantIds = new Set<string>();
        
        // Collect all participant IDs from bracket
        tournament.bracket.rounds.forEach((round: any) => {
          round.matches?.forEach((match: any) => {
            if (match.participant1) participantIds.add(match.participant1.toString());
            if (match.participant2) participantIds.add(match.participant2.toString());
          });
        });
        if (tournament.bracket.thirdPlaceMatch) {
          const tpm = tournament.bracket.thirdPlaceMatch;
          if (tpm.participant1) participantIds.add(tpm.participant1.toString());
          if (tpm.participant2) participantIds.add(tpm.participant2.toString());
        }

        // Fetch team info
        if (participantIds.size > 0) {
          const teams = await Team.find({ _id: { $in: Array.from(participantIds) } })
            .select("name logo city captain")
            .populate("captain", "username fullName profileImage")
            .lean();

          const teamMap = new Map();
          teams.forEach((team: any) => {
            teamMap.set(team._id.toString(), team);
          });

          // Add team info to bracket
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
      }
    }

    // Convert Mongoose document to plain object to ensure proper serialization
    const tournamentData = tournament.toObject ? tournament.toObject() : tournament;
    
    // Filter out null/invalid scorers (deleted users) and ensure they're populated objects
    if (tournamentData.scorers && Array.isArray(tournamentData.scorers)) {
      tournamentData.scorers = tournamentData.scorers.filter(
        (s: any) => {
          // Filter out null, undefined, and ObjectIds (unpopulated references)
          // Only keep populated objects
          if (!s || typeof s !== 'object' || Array.isArray(s)) {
            return false;
          }
          
          // Must have an ID
          if (!s._id && !s.id) {
            return false;
          }
          
          // Must have username or fullName (User fields)
          return !!(s.username || s.fullName);
        }
      );
    } else if (!tournamentData.scorers) {
      tournamentData.scorers = [];
    }
    
    // Filter out null participants (deleted users/teams) and ensure they're populated objects
    if (tournamentData.participants && Array.isArray(tournamentData.participants)) {
      tournamentData.participants = tournamentData.participants.filter(
        (p: any) => {
          // Filter out null, undefined, and ObjectIds (unpopulated references)
          // Only keep populated objects
          if (!p || typeof p !== 'object' || Array.isArray(p)) {
            return false;
          }
          
          // Must have an ID
          if (!p._id && !p.id) {
            return false;
          }
          
          // Must have required fields based on category
          if (isTeamTournament) {
            return !!p.name; // Teams must have a name
          } else {
            return !!(p.username || p.fullName); // Users must have username or fullName
          }
        }
      );
    }

    // Manually populate doublesPairs for individual doubles tournaments
    const isDoublesTournament = !isTeamTournament &&
      tournamentData.matchType === "doubles";
    
    if (
      isDoublesTournament &&
      tournamentData.doublesPairs &&
      tournamentData.doublesPairs.length > 0
    ) {
      // Ensure doublesPairs are populated with player information
      const populatedPairs = await ensureDoublesPairsPopulated(tournamentData.doublesPairs);
      tournamentData.doublesPairs = populatedPairs;

      // Create a map of pair ID -> populated pair for standings lookup (with normalized IDs)
      const pairMap = new Map<string, any>();
      populatedPairs.forEach((pair: any) => {
        const pairId = normalizePairId(pair._id);
        if (pairId) {
          pairMap.set(pairId, pair);
        }
      });

      // For doubles tournaments, standings use pair IDs instead of player IDs
      // We need to populate standings.participant with pair info
      // NOTE: The new standings architecture ensures no duplicates at the source,
      // so we only need to populate pair information here
      if (tournamentData.standings && tournamentData.standings.length > 0) {

        // Create a reverse map: player ID -> pair (for cases where participant was populated as User)
        const playerToPairMap = new Map<string, any>();
        tournamentData.doublesPairs.forEach((pair: any) => {
          if (pair.player1?._id) {
            playerToPairMap.set(pair.player1._id.toString(), pair);
          }
          if (pair.player2?._id) {
            playerToPairMap.set(pair.player2._id.toString(), pair);
          }
        });

        tournamentData.standings = tournamentData.standings.map((standing: any) => {
          let pair: any = null;
          let pairId: string | null = null;

          // Check if participant is already a populated User object (from mongoose populate)
          if (standing.participant && typeof standing.participant === 'object' && standing.participant._id) {
            const participantId = normalizePairId(standing.participant._id);
            // Try to find pair by participant ID (could be a user ID)
            pair = playerToPairMap.get(participantId);
            if (pair) {
              pairId = normalizePairId(pair._id);
            } else {
              // If not found by user ID, try as pair ID
              pair = pairMap.get(participantId);
              if (pair) {
                pairId = participantId;
              }
            }
          } else {
            // Participant is still an ID string (pair ID)
            pairId = normalizePairId(standing.participant);
            pair = pairMap.get(pairId || '');
          }
          
          if (pair && pairId) {
            // Create a pseudo-participant object for the pair
            const player1Name = pair.player1?.fullName || pair.player1?.username || "Player 1";
            const player2Name = pair.player2?.fullName || pair.player2?.username || "Player 2";
            return {
              ...standing,
              participant: {
                _id: normalizePairId(pairId),
                fullName: `${player1Name} / ${player2Name}`,
                username: `${pair.player1?.username || "p1"} & ${pair.player2?.username || "p2"}`,
                profileImage: pair.player1?.profileImage || pair.player2?.profileImage,
                // Store original pair info for reference
                isPair: true,
                player1: pair.player1,
                player2: pair.player2,
              },
            };
          }
          
          // If pair not found, this is a data integrity issue
          const participantId = normalizePairId(standing.participant) || 'unknown';
          console.error(`[GET tournament] DATA INTEGRITY ERROR: Pair not found for standing participant: ${participantId}`);
          return {
            ...standing,
            participant: {
              _id: participantId,
              fullName: `[ERROR: Pair not found]`,
              username: `error_${participantId}`,
              isPair: true,
              _error: true,
            },
          };
        });
      }

      // Also populate group participants and standings with pair info
      if (tournamentData.groups && Array.isArray(tournamentData.groups)) {
        // Create a reverse map: player ID -> pair (for cases where participant was populated as User)
        const playerToPairMap = new Map<string, any>();
        tournamentData.doublesPairs.forEach((pair: any) => {
          if (pair.player1?._id) {
            playerToPairMap.set(pair.player1._id.toString(), pair);
          }
          if (pair.player2?._id) {
            playerToPairMap.set(pair.player2._id.toString(), pair);
          }
        });

        tournamentData.groups = tournamentData.groups.map((group: any) => {
          // Populate group participants as pairs (for doubles tournaments, participants are pair IDs)
          if (group.participants && Array.isArray(group.participants)) {
            group.participants = group.participants.map((participant: any) => {
              let pair: any = null;
              let pairId: string | null = null;

              // Check if participant is already a populated User object (from mongoose populate attempt)
              if (participant && typeof participant === 'object' && participant._id) {
                const participantId = normalizePairId(participant._id);
                // Try to find pair by participant ID (could be a user ID from failed populate)
                pair = playerToPairMap.get(participantId);
                if (pair) {
                  pairId = normalizePairId(pair._id);
                } else {
                  // If not found by user ID, try as pair ID
                  pair = pairMap.get(participantId);
                  if (pair) {
                    pairId = participantId;
                  }
                }
              } else {
                // Participant is still an ID string (pair ID)
                pairId = normalizePairId(participant);
                pair = pairMap.get(pairId || '');
              }
              
              if (pair && pairId) {
                // Create a pseudo-participant object for the pair
                const player1Name = pair.player1?.fullName || pair.player1?.username || "Player 1";
                const player2Name = pair.player2?.fullName || pair.player2?.username || "Player 2";
                return {
                  _id: normalizePairId(pairId),
                  fullName: `${player1Name} / ${player2Name}`,
                  username: `${pair.player1?.username || "p1"} & ${pair.player2?.username || "p2"}`,
                  profileImage: pair.player1?.profileImage || pair.player2?.profileImage,
                  // Store original pair info for reference
                  isPair: true,
                  player1: pair.player1,
                  player2: pair.player2,
                };
              }
              
              // If pair not found, this is a data integrity issue
              const participantId = normalizePairId(participant) || 'unknown';
              console.error(`[GET tournament] DATA INTEGRITY ERROR: Pair not found for group participant: ${participantId}`);
              return {
                _id: participantId,
                fullName: `[ERROR: Pair not found]`,
                username: `error_${participantId}`,
                isPair: true,
                _error: true,
              };
            });
          }

          if (group.standings && Array.isArray(group.standings)) {
            // NOTE: The new standings architecture ensures no duplicates at the source,
            // so we only need to populate pair information here

            group.standings = group.standings.map((standing: any) => {
              let pair: any = null;
              let pairId: string | null = null;

              // Check if participant is already a populated User object (from mongoose populate)
              if (standing.participant && typeof standing.participant === 'object' && standing.participant._id) {
                const participantId = normalizePairId(standing.participant._id);
                // Try to find pair by participant ID (could be a user ID)
                pair = playerToPairMap.get(participantId);
                if (pair) {
                  pairId = normalizePairId(pair._id);
                } else {
                  // If not found by user ID, try as pair ID
                  pair = pairMap.get(participantId);
                  if (pair) {
                    pairId = participantId;
                  }
                }
              } else {
                // Participant is still an ID string (pair ID)
                pairId = normalizePairId(standing.participant);
                pair = pairMap.get(pairId || '');
              }
              
              if (pair && pairId) {
                // Create a pseudo-participant object for the pair
                const player1Name = pair.player1?.fullName || pair.player1?.username || "Player 1";
                const player2Name = pair.player2?.fullName || pair.player2?.username || "Player 2";
                return {
                  ...standing,
                  participant: {
                    _id: normalizePairId(pairId),
                    fullName: `${player1Name} / ${player2Name}`,
                    username: `${pair.player1?.username || "p1"} & ${pair.player2?.username || "p2"}`,
                    profileImage: pair.player1?.profileImage || pair.player2?.profileImage,
                    // Store original pair info for reference
                    isPair: true,
                    player1: pair.player1,
                    player2: pair.player2,
                  },
                };
              }
              
              // If pair not found, this is a data integrity issue
              const participantId = normalizePairId(standing.participant) || 'unknown';
              console.error(`[GET tournament] DATA INTEGRITY ERROR: Pair not found for group standing participant: ${participantId}`);
              return {
                ...standing,
                participant: {
                  _id: participantId,
                  fullName: `[ERROR: Pair not found]`,
                  username: `error_${participantId}`,
                  isPair: true,
                  _error: true,
                },
              };
            });
          }
          return group;
        });
      }
      
      // Validation: Check for data integrity issues
      const errors: string[] = [];
      if (tournamentData.standings) {
        tournamentData.standings.forEach((standing: any, idx: number) => {
          if ((standing.participant as any)?._error) {
            errors.push(`Standing ${idx + 1}: Pair not found for participant ${standing.participant._id}`);
          }
        });
      }
      if (tournamentData.groups) {
        tournamentData.groups.forEach((group: any) => {
          if (group.standings) {
            group.standings.forEach((standing: any, idx: number) => {
              if ((standing.participant as any)?._error) {
                errors.push(`Group ${group.groupId || 'unknown'}, standing ${idx + 1}: Pair not found for participant ${standing.participant._id}`);
              }
            });
          }
          if (group.participants) {
            group.participants.forEach((participant: any, idx: number) => {
              if ((participant as any)?._error) {
                errors.push(`Group ${group.groupId || 'unknown'}, participant ${idx + 1}: Pair not found for participant ${participant._id}`);
              }
            });
          }
        });
      }
      
      if (errors.length > 0) {
        console.error(`[GET tournament] DATA INTEGRITY ERRORS found:`, errors);
        // Still return the response, but log errors for debugging
        // The UI will show error indicators for invalid participants
      }
    }
    
    return NextResponse.json({ tournament: tournamentData }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { error: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Explicitly ensure models are registered
    if (!IndividualMatch || !TeamMatch) {
      throw new Error("Match models not loaded");
    }

    const { id } = await context.params;

    // Fetch tournament to verify organizer authorization
    const existingTournament = await Tournament.findById(id);
    if (!existingTournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can update tournament
    const organizerId = existingTournament.organizer?.toString();
    if (organizerId && organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the organizer can update this tournament" },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body using Zod schema
    const validation = validateRequest(updateTournamentSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const updateData = validation.data;

    const isTeamTournament = existingTournament.category === "team";

    let query = Tournament.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate("organizer", "username fullName profileImage");

    // Populate based on category
    if (isTeamTournament) {
      query = query
        .populate({
          path: "participants",
          model: Team,
          select: "name logo city captain players",
          populate: [
            { path: "captain", select: "username fullName profileImage" },
            { path: "players.user", select: "username fullName profileImage" },
          ],
        })
        .populate({
          path: "standings.participant",
          model: Team,
          select: "name logo city captain",
        })
        .populate({
          path: "groups.standings.participant",
          model: Team,
          select: "name logo city captain",
        })
        .populate({
          path: "seeding.participant",
          model: Team,
          select: "name logo city captain",
        });
    } else {
      query = query
        .populate("participants", "username fullName profileImage")
        .populate("standings.participant", "username fullName profileImage")
        .populate("groups.standings.participant", "username fullName profileImage")
        .populate("seeding.participant", "username fullName profileImage");
    }

    const tournament = await query;

    return NextResponse.json({
      tournament,
      message: "Tournament updated successfully",
    });
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { error: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await context.params;

    // Fetch tournament to verify organizer authorization
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can delete tournament
    const organizerId = tournament.organizer?.toString();
    if (organizerId && organizerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Only the organizer can delete this tournament" },
        { status: 403 }
      );
    }

    await Tournament.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Tournament deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 }
    );
  }
}
