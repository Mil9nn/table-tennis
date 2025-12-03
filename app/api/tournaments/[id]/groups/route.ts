import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  generateRoundRobinSchedule,
  generateSeededRoundRobinSchedule,
} from "@/services/tournament";
import mongoose from "mongoose";

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
 */
async function createScheduledMatch(
  matchParticipants: any[],
  tournament: any,
  userId: string
) {
  const match = new IndividualMatch({
    matchType: tournament.matchType,
    matchCategory: "individual",
    numberOfSets: tournament.rules.setsPerMatch,
    city: tournament.city,
    venue: tournament.venue || tournament.city,
    participants: matchParticipants,
    scorer: userId,
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
    if (!tournament.useGroups) {
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
    const tournamentParticipantIds = new Set(
      tournament.participants.map((p: any) => p.toString())
    );

    for (const group of updatedGroups) {
      if (!group.groupId || !group.groupName) {
        return NextResponse.json(
          { error: "Each group must have groupId and groupName" },
          { status: 400 }
        );
      }

      for (const participantId of group.participants || []) {
        if (!tournamentParticipantIds.has(participantId.toString())) {
          return NextResponse.json(
            { error: `Participant ${participantId} is not in tournament participants` },
            { status: 400 }
          );
        }
      }
    }

    // If matches are already generated, check if any have been played
    const matchesGenerated = tournament.drawGenerated;
    const isDoubles =
      tournament.matchType === "doubles" ||
      tournament.matchType === "mixed_doubles";

    // Check if any matches have been played (not just scheduled)
    if (matchesGenerated && tournament.groups) {
      for (const group of tournament.groups) {
        if (group.rounds) {
          for (const round of group.rounds) {
            if (round.matches && round.matches.length > 0) {
              const matches = await IndividualMatch.find({
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
      for (const oldGroup of tournament.groups) {
        if (oldGroup.rounds) {
          for (const round of oldGroup.rounds) {
            if (round.matches && round.matches.length > 0) {
              await IndividualMatch.deleteMany({ _id: { $in: round.matches } });
            }
          }
        }
      }
    }

    // Update groups
    tournament.groups = updatedGroups.map((group: any) => {
      const existingGroup = existingGroupsMap.get(group.groupId);
      return {
        groupId: group.groupId,
        groupName: group.groupName,
        participants: group.participants || [],
        rounds: matchesGenerated
          ? []
          : existingGroup?.rounds || [], // Preserve if not regenerating
        standings: matchesGenerated
          ? []
          : existingGroup?.standings || [], // Preserve if not regenerating
      };
    });

    // If matches were already generated, regenerate matches for all groups
    if (matchesGenerated) {
      const seeding = tournament.seeding || [];

      // Now generate new matches for updated groups
      for (const group of tournament.groups) {
        const groupParticipantIds = group.participants.map((p: any) => p.toString());
        
        if (groupParticipantIds.length < 2) {
          // Skip groups with less than 2 participants
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
            const matchParticipants = getMatchParticipants(
              pairing,
              isDoubles,
              groupParticipantIds
            );
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
        const groupStandings = groupParticipantIds.map((pId: string) => ({
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
    }

    await tournament.save();

    // Populate and return updated tournament
    await tournament.populate([
      { path: "organizer", select: "username fullName profileImage" },
      { path: "participants", select: "username fullName profileImage" },
      { path: "groups.participants", select: "username fullName profileImage" },
      { path: "groups.standings.participant", select: "username fullName profileImage" },
      { path: "seeding.participant", select: "username fullName profileImage" },
      {
        path: "groups.rounds.matches",
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      },
    ]);

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

