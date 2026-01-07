import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  generateRoundRobinSchedule,
  generateSeededRoundRobinSchedule,
} from "@/services/tournament";
import mongoose from "mongoose";

// CRITICAL: Import models in correct order to ensure discriminators are registered
// 1. Import base Match model first
import Match from "@/models/MatchBase";
// 2. Import discriminators (this registers them on Match)
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
// 3. Import Tournament model
import Tournament from "@/models/Tournament";
// 4. Import User model for populating doubles pairs
import { User } from "@/models/User";

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

/**
 * Helper: Get match participants for singles or doubles
 */
function getMatchParticipants(
  pairing: any,
  isDoubles: boolean,
  participantIds: string[]
) {
  if (!isDoubles) {
    return [pairing.player1, pairing.player2];
  }

  const team1Idx = participantIds.findIndex(
    (id: any) => id === pairing.player1.toString()
  );
  const team2Idx = participantIds.findIndex(
    (id: any) => id === pairing.player2.toString()
  );

  return [
    new mongoose.Types.ObjectId(participantIds[team1Idx]),
    new mongoose.Types.ObjectId(participantIds[team1Idx + 1]),
    new mongoose.Types.ObjectId(participantIds[team2Idx]),
    new mongoose.Types.ObjectId(participantIds[team2Idx + 1]),
  ];
}

/**
 * Helper: Create and save a scheduled match
 * Uses multiple strategies to get the model for Next.js hot reload compatibility
 */
async function createScheduledMatch(
  matchParticipants: any[],
  tournament: any,
  userId: string
) {
  // CRITICAL: Discriminators are registered with their discriminator key, not model name
  // Strategy 1: Try Match discriminators (most reliable)
  let Model = Match.discriminators?.['individual'];

  // Strategy 2: Try mongoose.models with discriminator key
  if (!Model) {
    Model = mongoose.models.individual;
  }

  // Strategy 3: Try mongoose.models with model name (unlikely to work but try anyway)
  if (!Model) {
    Model = mongoose.models.IndividualMatch;
  }

  // Strategy 4: Try imported model
  if (!Model) {
    Model = IndividualMatch;
  }

  if (!Model) {
    throw new Error('IndividualMatch model not available. Server restart may be required.');
  }

  // Create match using the retrieved model
  const match = new Model({
    matchType: tournament.matchType,
    matchCategory: "individual",
    numberOfSets: tournament.rules.setsPerMatch,
    city: tournament.city,
    venue: tournament.venue,
    participants: matchParticipants,
    scorer: new mongoose.Types.ObjectId(userId),
    status: "scheduled",
    tournament: tournament._id,
  });

  await match.save();
  return match;
}

/**
 * Update group participants (add/remove players from groups)
 * Only organizer can update groups
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Only organizer can update groups
    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow updates if tournament uses groups
    // Check for round-robin format
    const usesGroups = tournament.format === "round_robin" 
      ? tournament.useGroups 
      : tournament.format === "hybrid"
      ? tournament.hybridConfig?.roundRobinUseGroups
      : false;
    
    if (!usesGroups) {
      return NextResponse.json(
        { error: "Tournament does not use groups" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { groups: updatedGroups } = body;

    if (!updatedGroups || !Array.isArray(updatedGroups)) {
      return NextResponse.json(
        { error: "Groups array is required" },
        { status: 400 }
      );
    }

    // Validate that all participants in groups are in tournament participants
    // For doubles tournaments, groups contain pair IDs, not player IDs
    const isDoubles = tournament.matchType === "doubles";
    const doublesPairs = (tournament as any).doublesPairs || [];
    
    let validParticipantIds: Set<string>;
    if (isDoubles && doublesPairs.length > 0) {
      // For doubles, validate against pair IDs
      validParticipantIds = new Set(
        doublesPairs.map((pair: any) => pair._id?.toString()).filter(Boolean)
      );
    } else {
      // For singles, validate against player IDs
      validParticipantIds = new Set(
        tournament.participants.map((p: any) => p.toString())
      );
    }

    for (const group of updatedGroups) {
      if (!group.groupId || !group.groupName) {
        return NextResponse.json(
          { error: "Each group must have groupId and groupName" },
          { status: 400 }
        );
      }

      for (const participantId of group.participants || []) {
        if (!validParticipantIds.has(participantId.toString())) {
          return NextResponse.json(
            { error: `Participant ${participantId} is not in tournament ${isDoubles ? 'pairs' : 'participants'}` },
            { status: 400 }
          );
        }
      }
    }

    // If matches are already generated, check if any have been played
    const matchesGenerated = tournament.drawGenerated;

    // Check if any matches have been played (not just scheduled)
    if (matchesGenerated && tournament.groups) {
      // Get IndividualMatch model with fallbacks
      // CRITICAL: Use discriminator key 'individual', not model name 'IndividualMatch'
      const MatchModel = Match.discriminators?.['individual'] ||
                        mongoose.models.individual ||
                        mongoose.models.IndividualMatch ||
                        IndividualMatch;

      if (!MatchModel) {
        return NextResponse.json(
          { error: "Server model error. Please restart the development server." },
          { status: 500 }
        );
      }

      for (const group of tournament.groups) {
        if (group.rounds) {
          for (const round of group.rounds) {
            if (round.matches && round.matches.length > 0) {
              const matches = await MatchModel.find({
                _id: { $in: round.matches },
              });
              const hasPlayedMatches = matches.some(
                (m: any) => m.status === "in_progress" || m.status === "completed"
              );
              if (hasPlayedMatches) {
                return NextResponse.json(
                  {
                    error:
                      "Cannot modify groups after matches have been played. This would reset all match results and standings.",
                  },
                  { status: 400 }
                );
              }
            }
          }
        }
      }
    }

    // Find existing groups to preserve rounds/standings if matches not generated
    const existingGroupsMap = new Map();
    if (tournament.groups) {
      tournament.groups.forEach((g: any) => {
        existingGroupsMap.set(g.groupId, g);
      });
    }

    // If matches were already generated, delete old matches before updating groups
    if (matchesGenerated && tournament.groups) {
      // Get IndividualMatch model with fallbacks
      // CRITICAL: Use discriminator key 'individual', not model name 'IndividualMatch'
      const MatchModel = Match.discriminators?.['individual'] ||
                        mongoose.models.individual ||
                        mongoose.models.IndividualMatch ||
                        IndividualMatch;

      if (!MatchModel) {
        return NextResponse.json(
          { error: "Server model error. Please restart the development server." },
          { status: 500 }
        );
      }

      for (const oldGroup of tournament.groups) {
        if (oldGroup.rounds) {
          for (const round of oldGroup.rounds) {
            if (round.matches && round.matches.length > 0) {
              await MatchModel.deleteMany({ _id: { $in: round.matches } });
            }
          }
        }
      }
    }

    // Update groups
    tournament.groups = updatedGroups.map((group: any) => {
      const existingGroup = existingGroupsMap.get(group.groupId);
      
      // CRITICAL: Deduplicate group participants to prevent duplicate entries
      // Normalize participant IDs to strings and remove duplicates
      const participantIds = (group.participants || []).map((p: any) => 
        typeof p === 'string' ? p : (p._id ? p._id.toString() : p.toString())
      );
      const uniqueParticipantIds = Array.from(new Set(participantIds));
      
      return {
        groupId: group.groupId,
        groupName: group.groupName,
        participants: uniqueParticipantIds,
        rounds: matchesGenerated
          ? []
          : existingGroup?.rounds || [], // Preserve if not regenerating
        standings: matchesGenerated
          ? []
          : existingGroup?.standings || [], // Preserve if not regenerating
      };
    });

    // Always generate matches when saving groups (auto-generate draw)
    // This handles both first-time generation and regeneration after modifications
    const seeding = tournament.seeding || [];

    // Generate matches for all groups that have at least 2 participants
    for (const group of tournament.groups) {
      const groupParticipantIds = group.participants.map((p: any) => p.toString());
      
      if (groupParticipantIds.length < 2) {
        // Skip groups with less than 2 participants - clear any existing rounds/standings
        group.rounds = [];
        group.standings = [];
        continue;
      }

      // Generate round-robin schedule for this group
      const groupSeeding = seeding.filter((s: any) =>
        groupParticipantIds.includes(s.participant.toString())
      );

      const schedule =
        groupSeeding.length > 0
          ? generateSeededRoundRobinSchedule(
              groupParticipantIds,
              groupSeeding,
              1, // courtsAvailable
              tournament.startDate,
              60 // matchDuration
            )
          : generateRoundRobinSchedule(
              groupParticipantIds,
              1, // courtsAvailable
              tournament.startDate,
              60 // matchDuration
            );

      // Create new matches for this group
      const groupRounds = [];
      for (const round of schedule) {
        const roundMatches = [];

        for (const pairing of round.matches) {
          // For doubles, use the proper getMatchParticipants that handles doublesPairs
          let matchParticipants: any[];
          if (isDoubles && doublesPairs.length > 0) {
            // Use doublesPairs to get actual player IDs from pair IDs
            const pair1 = doublesPairs.find(
              (p: any) => p._id?.toString() === pairing.player1.toString()
            );
            const pair2 = doublesPairs.find(
              (p: any) => p._id?.toString() === pairing.player2.toString()
            );
            
            if (pair1 && pair2) {
              matchParticipants = [
                new mongoose.Types.ObjectId(pair1.player1.toString()),
                new mongoose.Types.ObjectId(pair1.player2.toString()),
                new mongoose.Types.ObjectId(pair2.player1.toString()),
                new mongoose.Types.ObjectId(pair2.player2.toString()),
              ];
            } else {
              // Fallback to legacy method if pairs not found
              matchParticipants = getMatchParticipants(
                pairing,
                isDoubles,
                groupParticipantIds
              );
            }
          } else {
            matchParticipants = getMatchParticipants(
              pairing,
              isDoubles,
              groupParticipantIds
            );
          }
          const match = await createScheduledMatch(
            matchParticipants,
            tournament,
            decoded.userId
          );
          roundMatches.push(match._id);
        }

        groupRounds.push({
          roundNumber: round.roundNumber,
          matches: roundMatches,
          completed: false,
          scheduledDate: round.scheduledDate,
        });
      }

      // Initialize group standings
      // CRITICAL: Deduplicate participant IDs to prevent duplicate standings entries
      const uniqueGroupParticipantIds = Array.from(new Set(groupParticipantIds));
      
      
      const groupStandings = uniqueGroupParticipantIds.map((pId) => ({
        participant: pId,
        played: 0,
        won: 0,
        lost: 0,
        drawn: 0,
        setsWon: 0,
        setsLost: 0,
        setsDiff: 0,
        pointsScored: 0,
        pointsConceded: 0,
        pointsDiff: 0,
        points: 0,
        rank: 0,
        form: [],
        headToHead: new Map(),
      }));

      group.rounds = groupRounds;
      group.standings = groupStandings;
     
    }

    // CRITICAL: Mark groups as modified so Mongoose saves the changes
    tournament.markModified("groups");

    // Mark draw as generated since we've created matches
    tournament.drawGenerated = true;

    await tournament.save();

    // Populate and return updated tournament
    const populatePaths: any[] = [
      { path: "organizer", select: "username fullName profileImage" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName profileImage" },
    ];
    
    // For doubles tournaments, don't populate groups.participants or groups.standings.participant as User
    // because they're pair IDs, not user IDs. We'll handle it manually.
    const isDoublesForPopulate = tournament.matchType === "doubles";
    if (!isDoublesForPopulate) {
      populatePaths.push(
        { path: "groups.participants", select: "username fullName profileImage" },
        { path: "groups.standings.participant", select: "username fullName profileImage" }
      );
    }
    // For doubles, we don't populate standings.participant - they're pair IDs, not user IDs
    
    populatePaths.push({
      path: "groups.rounds.matches",
      populate: {
        path: "participants",
        select: "username fullName profileImage",
      },
    });
    
    await tournament.populate(populatePaths);
    
    // For doubles tournaments, manually populate group participants and standings as pairs
    if (isDoublesForPopulate && doublesPairs.length > 0) {
      // Ensure doublesPairs are populated with player information
      const populatedPairs = await ensureDoublesPairsPopulated(doublesPairs);
      
      // Create pairMap with normalized IDs (ensure consistent string format)
      const pairMap = new Map<string, any>();
      populatedPairs.forEach((pair: any) => {
        const pairId = normalizePairId(pair._id);
        if (pairId) {
          pairMap.set(pairId, pair);
        }
      });
      
      
      
      // Create reverse map: player ID -> pair (for cases where participant was populated as User)
      const playerToPairMap = new Map<string, any>();
      populatedPairs.forEach((pair: any) => {
        if (pair.player1?._id) {
          playerToPairMap.set(pair.player1._id.toString(), pair);
        }
        if (pair.player2?._id) {
          playerToPairMap.set(pair.player2._id.toString(), pair);
        }
      });
      
      if (tournament.groups && Array.isArray(tournament.groups)) {
        tournament.groups = tournament.groups.map((group: any) => {
          // Populate group participants as pairs
          if (group.participants && Array.isArray(group.participants)) {
            group.participants = group.participants.map((participant: any) => {
              // participant could be an ID string or a populated User (from failed populate)
              let pair: any = null;
              let pairId: string | null = null;
              
              if (participant && typeof participant === 'object' && participant._id) {
                // Check if it's a User object (from failed populate) or a pair object
                const participantId = normalizePairId(participant._id);
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
                // Participant is an ID string (pair ID)
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
                  isPair: true,
                  player1: pair.player1,
                  player2: pair.player2,
                };
              }
              
              // If pair not found, this is a data integrity issue
              const participantId = normalizePairId(participant) || 'unknown';
              console.error(`[groups PUT] DATA INTEGRITY ERROR: Pair not found for group participant: ${participantId}`);
              return {
                _id: participantId,
                fullName: `[ERROR: Pair not found]`,
                username: `error_${participantId}`,
                isPair: true,
                _error: true,
              };
            });
          }
          
          // Populate group standings as pairs
          if (group.standings && Array.isArray(group.standings)) {
            
            const standingParticipantIds = group.standings.map((s: any) => s.participant?.toString() || s.participant);
            
            
            group.standings = group.standings.map((standing: any) => {
              let pair: any = null;
              let pairId: string | null = null;
              
              // Check if participant is already a populated User object (from mongoose populate)
              if (standing.participant && typeof standing.participant === 'object' && standing.participant._id) {
                const participantId = standing.participant._id.toString();
                // Try to find pair by participant ID (could be a user ID)
                pair = playerToPairMap.get(participantId);
                if (pair) {
                  pairId = pair._id?.toString();
                } else {
                  // If not found by user ID, try as pair ID
                  pair = pairMap.get(participantId);
                  if (pair) {
                    pairId = participantId;
                  }
                }
              } else {
                // Participant is still an ID string (pair ID)
                // Normalize the ID to ensure consistent format
                pairId = normalizePairId(standing.participant);
                if (pairId) {
                  pair = pairMap.get(pairId);
                  if (!pair) {
                    // Try with ObjectId conversion in case format differs
                    try {
                      const normalizedId = new mongoose.Types.ObjectId(pairId).toString();
                      pair = pairMap.get(normalizedId);
                      if (pair) {
                        pairId = normalizedId;
                      }
                    } catch (e) {
                      // Not a valid ObjectId format
                    }
                  }
                }
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
              
              // If pair not found, this is a data integrity issue - log error
              const participantId = normalizePairId(standing.participant) || 'unknown';
              console.error(`[groups PUT] DATA INTEGRITY ERROR: Pair not found for standing participant: ${participantId}. Available pair IDs:`, Array.from(pairMap.keys()));
              // Return standing with error indicator instead of creating fake data
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
      tournament.groups.forEach((group: any) => {
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
      
      if (errors.length > 0) {
        console.error(`[groups PUT] DATA INTEGRITY ERRORS found:`, errors);
        // Still return the response, but log errors for debugging
        // The UI will show error indicators for invalid participants
      }
    }

    return NextResponse.json({
      message: "Groups updated successfully",
      tournament,
    });
  } catch (err: any) {
    console.error("Error updating groups:", err);
    return NextResponse.json(
      { error: "Failed to update groups", details: err.message },
      { status: 500 }
    );
  }
}

