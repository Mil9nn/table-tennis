import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import IndividualMatch from "@/models/IndividualMatch";
import { connectDB } from "@/lib/mongodb";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import {
  generateRoundRobinSchedule,
  generateSeededRoundRobinSchedule,
  allocateGroups,
  generateRandomSeeding,
} from "@/services/tournamentService";
import {
  generateKnockoutBracket,
  processByes,
  resolveParticipantSlot,
} from "@/services/tournament/knockoutService";
import mongoose from "mongoose";
import { BracketRound } from "@/types/tournamentDraw";

/**
 * Helper: Get match participants for singles or doubles
 */
function getMatchParticipants(pairing: any, isDoubles: boolean, participantIds: string[]) {
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
 * Generate tournament matches with ITTF-compliant scheduling
 * Supports: Round Robin and Knockout formats
 * Features: seeding, groups/pools, bye allocation, bracket generation
 */
export async function POST(
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

    if (tournament.organizer.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (tournament.participants.length < 2) {
      return NextResponse.json(
        { error: "At least 2 participants required" },
        { status: 400 }
      );
    }

    if (tournament.drawGenerated) {
      return NextResponse.json(
        { error: "Draw already generated. Delete existing matches first." },
        { status: 400 }
      );
    }

    const participantIds = tournament.participants.map((p: any) =>
      p.toString()
    );

    // For doubles tournaments, validate we have correct number of participants
    const isDoubles =
      tournament.matchType === "doubles" ||
      tournament.matchType === "mixed_doubles";
    if (isDoubles && participantIds.length % 4 !== 0) {
      return NextResponse.json(
        {
          error:
            "Doubles tournaments require participants in multiples of 4 (2 players per team, 2 teams per match)",
        },
        { status: 400 }
      );
    }

    // Generate or use existing seeding
    let seeding = tournament.seeding || [];

    // If seeding is empty, initialize with registration order
    if (seeding.length === 0) {
      if (tournament.seedingMethod === "random") {
        seeding = generateRandomSeeding(participantIds);
      } else {
        // For manual or none methods, use registration order
        seeding = participantIds.map((pId: string, index: number) => ({
          participant: pId,
          seedNumber: index + 1,
        }));
      }
      tournament.seeding = seeding;
      await tournament.save();
    }

    // CASE 0: Multi-Stage Tournament (Round Robin/Group Stage → Knockout)
    if (tournament.format === "multi_stage") {
      const advanceCount =
        tournament.advancePerGroup || tournament.rules.advanceTop || 4;

      if (!tournament.useGroups) {
        // Generate round robin schedule for all participants
        const schedule =
          seeding.length > 0
            ? generateSeededRoundRobinSchedule(
                participantIds,
                seeding,
                1,
                tournament.startDate,
                60
              )
            : generateRoundRobinSchedule(
                participantIds,
                1,
                tournament.startDate,
                60
              );

        const rounds = [];

        for (const round of schedule) {
          const roundMatches = [];

          for (const pairing of round.matches) {
            const matchParticipants = getMatchParticipants(pairing, isDoubles, participantIds);
            const match = await createScheduledMatch(matchParticipants, tournament, decoded.userId);
            roundMatches.push(match._id);
          }

          rounds.push({
            roundNumber: round.roundNumber,
            matches: roundMatches,
            completed: false,
            scheduledDate: round.scheduledDate,
          });
        }

        // Initialize standings
        const standings = participantIds.map((pId: string) => ({
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

        tournament.rounds = rounds;
        tournament.standings = standings;

        // Set multi-stage configuration
        tournament.isMultiStage = true;
        tournament.currentStageNumber = 1;
        tournament.stages = [
          {
            stageNumber: 1,
            name: "Group Stage",
            format: "round_robin",
            status: "in_progress",
          },
          {
            stageNumber: 2,
            name: "Knockout Stage",
            format: "knockout",
            status: "pending",
            qualification: {
              fromStage: 1,
              qualifyingPositions: Array.from(
                { length: advanceCount },
                (_, i) => i + 1
              ),
              qualifyingMethod: "position",
            },
          },
        ];

        // Store advanceTop in rules for later reference
        tournament.rules.advanceTop = advanceCount;
      }
      // Multi-stage WITH groups
      else {
        const groupAllocations = allocateGroups(
          participantIds,
          tournament.numberOfGroups!,
          seeding.length > 0 ? seeding : undefined
        );

        const groups = [];
        const advancePerGroup = tournament.advancePerGroup || 2;

        for (const groupAlloc of groupAllocations) {
          const schedule =
            seeding.length > 0
              ? generateSeededRoundRobinSchedule(
                  groupAlloc.participants,
                  seeding,
                  1,
                  tournament.startDate,
                  60
                )
              : generateRoundRobinSchedule(
                  groupAlloc.participants,
                  1,
                  tournament.startDate,
                  60
                );

          const groupRounds = [];

          for (const round of schedule) {
            const roundMatches = [];

            for (const pairing of round.matches) {
              const matchParticipants = getMatchParticipants(pairing, isDoubles, participantIds);
              const match = await createScheduledMatch(matchParticipants, tournament, decoded.userId);
              roundMatches.push(match._id);
            }

            groupRounds.push({
              roundNumber: round.roundNumber,
              matches: roundMatches,
              completed: false,
              scheduledDate: round.scheduledDate,
            });
          }

          const groupStandings = groupAlloc.participants.map((pId: string) => ({
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
          }));

          groups.push({
            groupId: groupAlloc.groupId,
            groupName: groupAlloc.groupName,
            participants: groupAlloc.participants,
            rounds: groupRounds,
            standings: groupStandings,
          });
        }

        tournament.groups = groups;
        tournament.rounds = [];
        tournament.standings = [];

        // Set multi-stage configuration with groups
        tournament.isMultiStage = true;
        tournament.currentStageNumber = 1;
        tournament.stages = [
          {
            stageNumber: 1,
            name: "Group Stage",
            format: "round_robin",
            status: "in_progress",
            groups: groups,
          },
          {
            stageNumber: 2,
            name: "Knockout Stage",
            format: "knockout",
            status: "pending",
            qualification: {
              fromStage: 1,
              qualifyingPositions: Array.from(
                { length: advancePerGroup },
                (_, i) => i + 1
              ),
              qualifyingMethod: "position",
            },
          },
        ];

        tournament.advancePerGroup = advancePerGroup;
      }
    }
    // CASE 1: Knockout Tournament
    else if (tournament.format === "knockout") {
      // For doubles, group participants into teams
      let bracketParticipants = participantIds.map(
        (id: string) => new mongoose.Types.ObjectId(id)
      );
      let teamMappings = new Map(); // Maps team index to [player1, player2]

      if (isDoubles) {
        // Group every 2 participants into a team
        const teams = [];
        for (let i = 0; i < participantIds.length; i += 2) {
          teams.push({
            player1: new mongoose.Types.ObjectId(participantIds[i]),
            player2: new mongoose.Types.ObjectId(participantIds[i + 1]),
          });
          teamMappings.set(i / 2, {
            player1: new mongoose.Types.ObjectId(participantIds[i]),
            player2: new mongoose.Types.ObjectId(participantIds[i + 1]),
          });
        }
        // For bracket generation, use team count
        bracketParticipants = teams.map(
          (_, idx) => new mongoose.Types.ObjectId(participantIds[idx * 2])
        );
      }

      // Check for custom bracket matches
      const customMatches = tournament.customBracketMatches?.map((m: any) => ({
        participant1: new mongoose.Types.ObjectId(m.participant1.toString()),
        participant2: new mongoose.Types.ObjectId(m.participant2.toString()),
      }));

      // Generate knockout bracket
      const bracket = generateKnockoutBracket(bracketParticipants, seeding, {
        consolationBracket: tournament.rules.advanceTop === 3, // Include 3rd place match
        customMatches: customMatches && customMatches.length > 0 ? customMatches : undefined,
      });

      // Process byes (automatically advance players facing byes)
      const processedBracket = processByes(bracket);

      // Create actual matches for round 1
      const round1Matches = [];
      for (const match of processedBracket.rounds[0].matches) {
        // Skip matches that are byes
        if (match.completed) continue;

        const participant1Id = resolveParticipantSlot(
          match.participant1,
          processedBracket
        );
        const participant2Id = resolveParticipantSlot(
          match.participant2,
          processedBracket
        );

        if (!participant1Id || !participant2Id) continue;

        // For doubles, resolve team to 4 players
        let matchParticipants;
        if (isDoubles) {
          // Find team indices based on participant IDs
          const team1Idx =
            participantIds.findIndex(
              (id: any) => id === participant1Id.toString()
            ) / 2;
          const team2Idx =
            participantIds.findIndex(
              (id: any) => id === participant2Id.toString()
            ) / 2;

          const team1 = teamMappings.get(Math.floor(team1Idx));
          const team2 = teamMappings.get(Math.floor(team2Idx));

          if (!team1 || !team2) {
            console.error("Could not resolve teams for doubles match");
            continue;
          }

          matchParticipants = [
            team1.player1,
            team1.player2,
            team2.player1,
            team2.player2,
          ];
        } else {
          matchParticipants = [participant1Id, participant2Id];
        }

        const individualMatch = await createScheduledMatch(matchParticipants, tournament, decoded.userId);

        // Update bracket match with actual match ID
        match.matchId = individualMatch._id;
        round1Matches.push(individualMatch._id);
      }

      // Save bracket to tournament (store team mappings for future rounds)
      tournament.bracket = processedBracket;
      if (isDoubles) {
        // Store team mappings in tournament metadata for use in advance-winner
        tournament.bracket.teamMappings = Array.from(
          teamMappings.entries()
        ).map(([idx, team]) => ({
          teamIndex: idx,
          player1: team.player1,
          player2: team.player2,
        }));
      }

      // ✅ Knockout tournaments use bracket only, NOT rounds array
      // Rounds are for round-robin scheduling
      tournament.rounds = [];
    }
    // CASE 2: Tournament with Groups/Pools
    else if (tournament.useGroups && tournament.numberOfGroups) {
      const groupAllocations = allocateGroups(
        participantIds,
        tournament.numberOfGroups,
        seeding.length > 0 ? seeding : undefined
      );

      const groups = [];

      for (const groupAlloc of groupAllocations) {
        // Generate round-robin schedule for this group
        const schedule =
          seeding.length > 0
            ? generateSeededRoundRobinSchedule(
                groupAlloc.participants,
                seeding,
                1, // courtsAvailable
                tournament.startDate,
                60 // matchDuration
              )
            : generateRoundRobinSchedule(
                groupAlloc.participants,
                1, // courtsAvailable
                tournament.startDate,
                60 // matchDuration
              );

        const groupRounds = [];

        for (const round of schedule) {
          const roundMatches = [];

          for (const pairing of round.matches) {
            const matchParticipants = getMatchParticipants(pairing, isDoubles, participantIds);
            const match = await createScheduledMatch(matchParticipants, tournament, decoded.userId);
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
        const groupStandings = groupAlloc.participants.map((pId: string) => ({
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

        // Validate group round-robin schedule completeness
        const groupSize = groupAlloc.participants.length;
        const expectedGroupMatches = (groupSize * (groupSize - 1)) / 2;
        const actualGroupMatches = groupRounds.reduce((sum, r) => sum + r.matches.length, 0);
        if (actualGroupMatches !== expectedGroupMatches) {
          console.warn(
            `Group ${groupAlloc.groupName} schedule validation: Expected ${expectedGroupMatches} matches, got ${actualGroupMatches}`
          );
        }

        groups.push({
          groupId: groupAlloc.groupId,
          groupName: groupAlloc.groupName,
          participants: groupAlloc.participants,
          rounds: groupRounds,
          standings: groupStandings,
        });
      }

      tournament.groups = groups;
      tournament.rounds = []; // No overall rounds, only group rounds
      tournament.standings = []; // Will be filled after group stage

      // Only set multi-stage if format is multi_stage
      if (tournament.format === "multi_stage") {
        const advancePerGroup = tournament.advancePerGroup || 2;
        tournament.isMultiStage = true;
        tournament.currentStageNumber = 1;
        tournament.stages = [
          {
            stageNumber: 1,
            name: "Group Stage",
            format: "round_robin",
            status: "in_progress",
            groups: groups,
          },
          {
            stageNumber: 2,
            name: "Knockout Stage",
            format: "knockout",
            status: "pending",
            qualification: {
              fromStage: 1,
              qualifyingPositions: Array.from(
                { length: advancePerGroup },
                (_, i) => i + 1
              ),
              qualifyingMethod: "position",
            },
          },
        ];
      } else {
        // Pure round-robin with groups - no knockout stage
        tournament.isMultiStage = false;
      }
    }
    // CASE 3: Single Round-Robin (no groups)
    else if (tournament.format === "round_robin") {
      const schedule =
        seeding.length > 0
          ? generateSeededRoundRobinSchedule(
              participantIds,
              seeding,
              1, // courtsAvailable
              tournament.startDate,
              60 // matchDuration
            )
          : generateRoundRobinSchedule(
              participantIds,
              1, // courtsAvailable
              tournament.startDate,
              60 // matchDuration
            );

      const rounds = [];

      for (const round of schedule) {
        const roundMatches = [];

        for (const pairing of round.matches) {
          const matchParticipants = getMatchParticipants(pairing, isDoubles, participantIds);
          const match = await createScheduledMatch(matchParticipants, tournament, decoded.userId);
          roundMatches.push(match._id);
        }

        rounds.push({
          roundNumber: round.roundNumber,
          matches: roundMatches,
          completed: false,
          scheduledDate: round.scheduledDate,
        });
      }

      // Initialize standings with enhanced fields
      const standings = participantIds.map((pId: string) => ({
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

      tournament.rounds = rounds;
      tournament.standings = standings;

      // Validate round-robin schedule completeness
      const expectedMatches = (participantIds.length * (participantIds.length - 1)) / 2;
      const actualMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0);
      if (actualMatches !== expectedMatches) {
        console.warn(
          `Round-robin schedule validation: Expected ${expectedMatches} matches, got ${actualMatches}`
        );
      }

      // Pure round-robin format - no knockout stage
      tournament.isMultiStage = false;
    }
    // Invalid format (should not happen due to schema validation)
    else {
      return NextResponse.json(
        {
          error: `Invalid tournament format: "${tournament.format}". Supported formats: round_robin, knockout`,
        },
        { status: 400 }
      );
    }

    tournament.drawGenerated = true;
    tournament.drawGeneratedAt = new Date();
    tournament.drawGeneratedBy = decoded.userId;
    tournament.status = "upcoming";

    await tournament.save();
    await tournament.populate([
      {
        path: "organizer participants",
        select: "username fullName profileImage",
      },
      { path: "seeding.participant", select: "username fullName profileImage" },
      {
        path: "standings.participant",
        select: "username fullName profileImage",
      },
      {
        path: "groups.standings.participant",
        select: "username fullName profileImage",
      },
      {
        path: "rounds.matches",
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      },
      {
        path: "groups.participants",
        select: "username fullName profileImage",
      },
      {
        path: "groups.rounds.matches",
        populate: {
          path: "participants",
          select: "username fullName profileImage",
        },
      },
    ]);

    // Calculate stats based on tournament format
    let stats: any = {};

    if (tournament.format === "knockout") {
      const totalMatches =
        tournament.bracket?.rounds.reduce(
          (sum: number, round: BracketRound) => sum + round.matches.length,
          0
        ) || 0;
      stats = {
        totalMatches,
        totalRounds: tournament.bracket?.rounds.length || 0,
        bracketSize: tournament.bracket?.size || 0,
        format: "knockout",
      };
    } else if (tournament.format === "multi_stage") {
      if (tournament.useGroups) {
        stats = {
          totalMatches:
            tournament.groups?.reduce(
              (sum: number, g: any) =>
                sum +
                g.rounds.reduce((s: number, r: any) => s + r.matches.length, 0),
              0
            ) || 0,
          totalRounds: tournament.groups?.[0]?.rounds.length || 0,
          groups: tournament.numberOfGroups,
          advancePerGroup: tournament.advancePerGroup,
          format: "multi_stage_groups",
          currentStage: 1,
          stages: tournament.stages?.length || 2,
        };
      } else {
        stats = {
          totalMatches: tournament.rounds.reduce(
            (sum: number, r: any) => sum + r.matches.length,
            0
          ),
          totalRounds: tournament.rounds.length,
          advanceTop: tournament.rules.advanceTop,
          format: "multi_stage",
          currentStage: 1,
          stages: tournament.stages?.length || 2,
        };
      }
    } else if (tournament.useGroups) {
      stats = {
        totalMatches:
          tournament.groups?.reduce(
            (sum: number, g: any) =>
              sum +
              g.rounds.reduce((s: number, r: any) => s + r.matches.length, 0),
            0
          ) || 0,
        totalRounds: tournament.groups?.[0]?.rounds.length || 0,
        groups: tournament.numberOfGroups,
        format: "round_robin_groups",
      };
    } else {
      stats = {
        totalMatches: tournament.rounds.reduce(
          (sum: number, r: any) => sum + r.matches.length,
          0
        ),
        totalRounds: tournament.rounds.length,
        format: "round_robin",
      };
    }

    return NextResponse.json({
      message: "Tournament draw generated successfully",
      tournament,
      stats,
    });
  } catch (err: any) {
    console.error("Error generating matches:", err);
    return NextResponse.json(
      { error: "Failed to generate matches", details: err.message },
      { status: 500 }
    );
  }
}