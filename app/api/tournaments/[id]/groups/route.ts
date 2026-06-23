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
import { syncTournamentProjections } from "@/models/utils/tournamentProjectionSync";
import { loadAndApplyProjectedTournamentData } from "@/lib/api/tournamentProjections";
import {
  ensureDoublesPairsPopulated,
  resolveDoublesGroups,
  resolveGroupsWithParticipantMap,
} from "@/lib/api/doublesPairResolution";
import { tournamentProjectionRepository } from "@/services/tournament/repositories/TournamentProjectionRepository";
// 4. Import User model for populating doubles pairs
import { User } from "@/models/User";

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
 * Get projection-backed groups for a tournament.
 * Used as a fallback by native clients when tournament detail payload
 * does not include hydrated groups.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
    }

    const tournament = await Tournament.findById(id)
      .select("category matchType participants doublesPairs groups")
      .populate({
        path: "participants",
        model: User,
        select: "username fullName profileImage name logo",
        options: { strictPopulate: false },
      })
      .lean();

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const tournamentData: any = {
      _id: id,
      matchType: (tournament as any).matchType,
      doublesPairs: (tournament as any).doublesPairs || [],
      participants: Array.isArray((tournament as any).participants)
        ? (tournament as any).participants
        : [],
      groups: Array.isArray((tournament as any).groups)
        ? (tournament as any).groups
        : [],
    };

    await loadAndApplyProjectedTournamentData(id, tournamentData);

    const isDoubles =
      tournamentData.matchType === "doubles" &&
      Array.isArray(tournamentData.doublesPairs) &&
      tournamentData.doublesPairs.length > 0;

    let resolvedGroups: any[] = Array.isArray(tournamentData.groups)
      ? tournamentData.groups
      : [];

    if (isDoubles) {
      const populatedPairs = await ensureDoublesPairsPopulated(tournamentData.doublesPairs);
      resolvedGroups = resolveDoublesGroups(resolvedGroups, populatedPairs);
    } else {
      const participantById = new Map<string, any>(
        (tournamentData.participants || [])
          .filter(
            (participant: any) =>
              participant && typeof participant === "object" && participant._id
          )
          .map((participant: any) => [participant._id.toString(), participant])
      );
      resolvedGroups = resolveGroupsWithParticipantMap(resolvedGroups, participantById);
    }

    return NextResponse.json({ groups: resolvedGroups }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament groups:", error);
    return NextResponse.json({ error: "Failed to fetch tournament groups" }, { status: 500 });
  }
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

    if (isDoubles && doublesPairs.length === 0) {
      return NextResponse.json(
        {
          error:
            "Doubles pairs must be configured before saving groups. Create pairs first, then assign them to groups.",
        },
        { status: 400 }
      );
    }

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

    // Validate group names
    const groupNames = new Map<string, string>(); // groupId -> groupName
    for (const group of updatedGroups) {
      if (!group.groupId || !group.groupName) {
        return NextResponse.json(
          { error: "Each group must have groupId and groupName" },
          { status: 400 }
        );
      }

      // Trim group name
      const trimmedName = group.groupName.trim();
      
      // Validate group name is not empty after trim
      if (!trimmedName) {
        return NextResponse.json(
          { error: `Group ${group.groupId}: Group name cannot be empty` },
          { status: 400 }
        );
      }

      // Validate group name length
      if (trimmedName.length > 50) {
        return NextResponse.json(
          { error: `Group ${group.groupId}: Group name must be 50 characters or less` },
          { status: 400 }
        );
      }

      // Check for duplicate group names
      for (const [existingGroupId, existingName] of groupNames.entries()) {
        if (existingName === trimmedName && existingGroupId !== group.groupId) {
          return NextResponse.json(
            { error: `Group names must be unique. "${trimmedName}" is used by multiple groups.` },
            { status: 400 }
          );
        }
      }

      groupNames.set(group.groupId, trimmedName);

      for (const participantId of group.participants || []) {
        if (!validParticipantIds.has(participantId.toString())) {
          return NextResponse.json(
            { error: `Participant ${participantId} is not in tournament ${isDoubles ? 'pairs' : 'participants'}` },
            { status: 400 }
          );
        }
      }
    }

    // Update group names with trimmed versions
    for (const group of updatedGroups) {
      group.groupName = group.groupName.trim();
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
    try {
      const category = (tournament as any).category === "team" ? "team" : "individual";
      const phase = (tournament as any).currentPhase;
      const groups = Array.isArray((tournament as any).groups) ? (tournament as any).groups : [];
      await tournamentProjectionRepository.upsertGroups(id, category, groups);
      await tournamentProjectionRepository.upsertGroupStandings(
        id,
        category,
        phase,
        groups
      );
    } catch (projectionSyncError) {
      console.error("[groups PUT] Projection repository sync failed:", projectionSyncError);
      try {
        await syncTournamentProjections(tournament.toObject ? tournament.toObject() : tournament);
      } catch (fallbackSyncError) {
        console.error("[groups PUT] Projection fallback sync failed:", fallbackSyncError);
      }
    }

    await tournament.populate([
      { path: "organizer", select: "username fullName profileImage" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName profileImage" },
    ]);

    const tournamentData = tournament.toObject ? tournament.toObject() : tournament;
    await loadAndApplyProjectedTournamentData(id, tournamentData);

    if (
      tournament.matchType === "doubles" &&
      Array.isArray(doublesPairs) &&
      doublesPairs.length > 0 &&
      Array.isArray(tournamentData.groups)
    ) {
      const populatedPairs = await ensureDoublesPairsPopulated(doublesPairs);
      tournamentData.groups = resolveDoublesGroups(tournamentData.groups, populatedPairs);
    } else if (Array.isArray(tournamentData.groups)) {
      const participantById = new Map<string, any>(
        (tournamentData.participants || [])
          .filter(
            (participant: any) =>
              participant && typeof participant === "object" && participant._id
          )
          .map((participant: any) => [participant._id.toString(), participant])
      );
      tournamentData.groups = resolveGroupsWithParticipantMap(
        tournamentData.groups,
        participantById
      );
    }

    return NextResponse.json({
      message: "Groups updated successfully",
      tournament: tournamentData,
    });
  } catch (err: any) {
    console.error("Error updating groups:", err);
    return NextResponse.json(
      { error: "Failed to update groups", details: err.message },
      { status: 500 }
    );
  }
}

