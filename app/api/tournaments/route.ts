// app/api/tournaments/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Tournament from "@/models/Tournament";
import TournamentStandings from "@/models/TournamentStandings";
import TournamentGroups from "@/models/TournamentGroups";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { validateRequest, validateQueryParams, createTournamentSchema, getTournamentsQuerySchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";
import { applyProjectedTournamentData } from "@/lib/api/tournamentProjections";
// Plan/subscription checks removed for MVP - to be implemented in future

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, "POST", "/api/tournaments");
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    body = await request.json();

    // ✅ Validate request body with Zod
    const validation = validateRequest(createTournamentSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const {
      name,
      format,
      category,
      matchType,
      startDate,
      city,
      venue,
      participants,
      rules,
      useGroups,
      numberOfGroups,
      advancePerGroup,
      seedingMethod,
      knockoutConfig,
      hybridConfig,
      teamConfig,
      doublesPairs,
    } = validation.data;

    // Plan/subscription checks removed for MVP - all features available to all users

    // Validate participants based on category
    if (participants && participants.length > 0) {
      if (category === "team") {
        // For team tournaments, validate against Team model
        const teams = await Team.find({ _id: { $in: participants } });
        if (teams.length !== participants.length) {
          return NextResponse.json(
            { error: "Invalid participant IDs (teams)" },
            { status: 400 }
          );
        }
      } else {
        // For individual tournaments, validate against User model
        const users = await User.find({ _id: { $in: participants } });
        if (users.length !== participants.length) {
          return NextResponse.json(
            { error: "Invalid participant IDs (users)" },
            { status: 400 }
          );
        }
      }
    }

    // Initialize seeding array with registration order
    const initialSeeding = participants
      ? participants.map((pId: string, index: number) => ({
          participant: pId,
          seedNumber: index + 1,
        }))
      : [];

    // Note: Validation for groups + round-robin is now handled by Zod schema

    const tournament = new Tournament({
      name,
      format,
      category,
      matchType,
      startDate: new Date(startDate),
      city,
      venue,
      participants: participants || [],
      organizer: auth.userId,
      // Force groups to false for round-robin format
      useGroups: format === "round_robin" ? false : (useGroups || false),
      numberOfGroups: format === "round_robin" ? undefined : (numberOfGroups || undefined),
      advancePerGroup: format === "round_robin" ? undefined : (advancePerGroup || undefined),
      seedingMethod: seedingMethod || "none",
      knockoutConfig: knockoutConfig || undefined,
      hybridConfig: hybridConfig || undefined,
      // Include teamConfig for team tournaments
      teamConfig: category === "team" ? (teamConfig ? {
        ...teamConfig,
        setsPerSubMatch: Number(teamConfig.setsPerSubMatch) || 3,
      } : {
        matchFormat: "five_singles",
        setsPerSubMatch: 3,
      }) : undefined,
      currentPhase: format === "hybrid" ? "round_robin" : undefined,
      seeding: initialSeeding,
      // Include doublesPairs if provided (for doubles)
      // CRITICAL: Deduplicate pairs to prevent duplicate entries
      // Convert temporary string IDs to ObjectIds
      doublesPairs:
        category === "individual" &&
        matchType === "doubles" &&
        doublesPairs
          ? (() => {
              // Deduplicate pairs by pair ID or canonical player combination
              const uniquePairsMap = new Map<string, typeof doublesPairs[0]>();
              for (const pair of doublesPairs) {
                const pairId = pair._id?.toString() || null;
                const player1Id = pair.player1?.toString() || '';
                const player2Id = pair.player2?.toString() || '';
                const canonicalKey = player1Id < player2Id 
                  ? `${player1Id}:${player2Id}` 
                  : `${player2Id}:${player1Id}`;
                const key = pairId || canonicalKey;
                
                if (!uniquePairsMap.has(key)) {
                  uniquePairsMap.set(key, pair);
                }
              }
              return Array.from(uniquePairsMap.values()).map((pair: any) => {
                // Convert temporary string IDs (starting with 'pair-') to ObjectIds
                const pairIdStr = pair._id?.toString() || '';
                const pairId = pairIdStr.startsWith('pair-')
                  ? new mongoose.Types.ObjectId() // Generate new ObjectId for temp IDs
                  : new mongoose.Types.ObjectId(pair._id); // Use existing ObjectId
                
                return {
                  _id: pairId,
                  player1: new mongoose.Types.ObjectId(pair.player1),
                  player2: new mongoose.Types.ObjectId(pair.player2),
                };
              });
            })()
          : undefined,
      rules: {
        pointsForWin: rules?.pointsForWin || 2,
        pointsForLoss: rules?.pointsForLoss || 0,
        // Note: For team tournaments, setsPerMatch is not used. Team submatches use teamConfig.setsPerSubMatch
        setsPerMatch: rules?.setsPerMatch || 3,
        pointsPerSet: rules?.pointsPerSet || 11,
        advanceTop: rules?.advanceTop || 0,
        deuceSetting: rules?.deuceSetting || "standard",
        tiebreakRules: rules?.tiebreakRules || [
          "points",
          "head_to_head",
          "sets_ratio",
          "points_ratio",
          "sets_won",
        ],
      },
      status: "draft",
    });

    

    await tournament.save();
    
    // Populate participants based on category
    const isTeamTournament = category === "team";
    
    if (isTeamTournament) {
      await tournament.populate([
        { path: "organizer", select: "username fullName profileImage" },
        { 
          path: "participants", 
          model: Team, 
          select: "name logo city captain players",
          populate: [
            { path: "captain", select: "username fullName profileImage" },
            { path: "players.user", select: "username fullName profileImage" },
          ],
        },
        { path: "seeding.participant", model: Team, select: "name logo city captain" },
      ]);
    } else {
      await tournament.populate([
        { path: "organizer", select: "username fullName profileImage" },
        { path: "participants", select: "username fullName profileImage" },
        { path: "seeding.participant", select: "username fullName profileImage" },
      ]);
    }

    return NextResponse.json(
      { message: "Tournament created successfully", tournament },
      { status: 201 }
    );
  } catch (err: any) {
    logError(err, {
      tags: { feature: "tournament", action: "create", endpoint: "POST /api/tournaments" },
      extra: {
        userId: request.headers.get("user-id"),
        tournamentData: body,
      }
    });

    return NextResponse.json(
      {
        error: "Failed to create tournament",
        ...(process.env.NODE_ENV === "development" && {
          details: err.message,
          validationErrors: err.errors ? Object.keys(err.errors).map(key => ({
            field: key,
            message: err.errors[key].message
          })) : undefined
        })
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Ensure models are registered
    Tournament;
    Team;
    User;

    const { searchParams } = new URL(req.url);

    // ✅ Validate query parameters
    const validation = validateQueryParams(getTournamentsQuerySchema, searchParams);
    if (!validation.success) {
      return validation.error;
    }

    const { status, format, category, city, search, dateFrom, dateTo, limit, skip, sortBy, sortOrder } = validation.data;

    let query: any = {};
    if (status && status !== "all") query.status = status;
    if (format && format !== "all") query.format = format;
    if (category && category !== "all") query.category = category;
    if (city) query.city = { $regex: city, $options: "i" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter on startDate
    if (dateFrom || dateTo) {
      query.startDate = {};
      if (dateFrom) {
        query.startDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query.startDate.$lte = endDate;
      }
    }

    // Build sort object
    const sortObject: any = {};
    if (sortBy === "name") {
      sortObject.name = sortOrder === "asc" ? 1 : -1;
    } else if (sortBy === "participants") {
      sortObject.startDate = sortOrder === "asc" ? 1 : -1;
    } else {
      sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // First fetch tournaments without population to get categories
    let baseQuery = Tournament.find(query)
      .sort(sortObject)
      .skip(skip);

    if (limit > 0) {
      baseQuery = baseQuery.limit(limit);
    }

    const tournamentsRaw = await baseQuery.lean();
    const tournamentIds = tournamentsRaw.map((t: any) => t._id);

    const [projectedStandings, projectedGroups] = await Promise.all([
      tournamentIds.length
        ? TournamentStandings.find({ tournament: { $in: tournamentIds } }).lean()
        : Promise.resolve([]),
      tournamentIds.length
        ? TournamentGroups.find({ tournament: { $in: tournamentIds } }).lean()
        : Promise.resolve([]),
    ]);

    const standingsByTournament = new Map<string, any[]>();
    projectedStandings.forEach((doc: any) => {
      const key = doc.tournament?.toString();
      if (!key) return;
      if (!standingsByTournament.has(key)) standingsByTournament.set(key, []);
      standingsByTournament.get(key)!.push(doc);
    });

    const groupsByTournament = new Map<string, any>();
    projectedGroups.forEach((doc: any) => {
      const key = doc.tournament?.toString();
      if (key) groupsByTournament.set(key, doc);
    });

    const userIds = new Set<string>();
    const teamIds = new Set<string>();

    const pushId = (set: Set<string>, value: any) => {
      if (!value) return;
      set.add(value.toString());
    };

    // Collect all IDs first to avoid N+1 queries
    for (const t of tournamentsRaw as any[]) {
      const tournamentKey = t._id?.toString();
      if (tournamentKey) {
        applyProjectedTournamentData(
          t,
          standingsByTournament.get(tournamentKey) || [],
          groupsByTournament.get(tournamentKey)
        );
      }

      const isTeamTournament = t.category === "team";

      pushId(userIds, t.organizer);

      for (const participantId of t.participants || []) {
        pushId(isTeamTournament ? teamIds : userIds, participantId);
      }

      for (const standing of t.standings || []) {
        pushId(isTeamTournament ? teamIds : userIds, standing?.participant);
      }

      for (const seed of t.seeding || []) {
        pushId(isTeamTournament ? teamIds : userIds, seed?.participant);
      }

      if (!isTeamTournament && t.matchType === "doubles") {
        for (const pair of t.doublesPairs || []) {
          pushId(userIds, pair?.player1?._id || pair?.player1);
          pushId(userIds, pair?.player2?._id || pair?.player2);
        }
      }

      for (const group of t.groups || []) {
        for (const participantId of group.participants || []) {
          if (!isTeamTournament && t.matchType === "doubles") continue;
          pushId(isTeamTournament ? teamIds : userIds, participantId);
        }
        for (const standing of group.standings || []) {
          pushId(isTeamTournament ? teamIds : userIds, standing?.participant);
        }
      }
    }

    const [users, teams] = await Promise.all([
      userIds.size > 0
        ? User.find({ _id: { $in: Array.from(userIds) } })
            .select("username fullName profileImage")
            .lean()
        : Promise.resolve([]),
      teamIds.size > 0
        ? Team.find({ _id: { $in: Array.from(teamIds) } })
            .select("name logo city captain players")
            .populate("captain", "username fullName profileImage")
            .populate("players.user", "username fullName profileImage")
            .lean()
        : Promise.resolve([]),
    ]);

    const userMap = new Map<string, any>();
    users.forEach((user: any) => userMap.set(user._id.toString(), user));

    const teamMap = new Map<string, any>();
    teams.forEach((team: any) => teamMap.set(team._id.toString(), team));

    const resolveUser = (idOrUser: any) => {
      const key = idOrUser?._id?.toString?.() || idOrUser?.toString?.();
      return key ? userMap.get(key) || idOrUser : idOrUser;
    };

    // Populate each tournament from in-memory maps
    const populatedTournaments = (tournamentsRaw as any[]).map((t: any) => {
      const isTeamTournament = t.category === "team";
      const isDoublesTournament = !isTeamTournament && t.matchType === "doubles";

      if (t.organizer) {
        t.organizer = userMap.get(t.organizer.toString()) || t.organizer;
      }

      if (t.participants?.length) {
        t.participants = t.participants.map((pId: any) => {
          const key = pId.toString();
          return isTeamTournament ? teamMap.get(key) || pId : userMap.get(key) || pId;
        });
      }

      if (t.standings?.length) {
        t.standings = t.standings.map((s: any) => {
          const key = s.participant?.toString?.();
          return {
            ...s,
            participant: key
              ? (isTeamTournament ? teamMap.get(key) || s.participant : userMap.get(key) || s.participant)
              : s.participant,
          };
        });
      }

      if (t.seeding?.length) {
        t.seeding = t.seeding.map((s: any) => {
          const key = s.participant?.toString?.();
          return {
            ...s,
            participant: key
              ? (isTeamTournament ? teamMap.get(key) || s.participant : userMap.get(key) || s.participant)
              : s.participant,
          };
        });
      }

      if (t.groups?.length) {
        for (const group of t.groups) {
          if (group.participants?.length) {
            if (isTeamTournament) {
              group.participants = group.participants.map((pId: any) => {
                const key = pId.toString();
                return teamMap.get(key) || pId;
              });
            } else if (isDoublesTournament && t.doublesPairs?.length) {
              const pairMap = new Map<string, any>();
              for (const pair of t.doublesPairs) {
                if (!pair?._id) continue;
                const player1 = resolveUser(pair.player1);
                const player2 = resolveUser(pair.player2);
                pairMap.set(pair._id.toString(), {
                  _id: pair._id.toString(),
                  fullName: `${player1?.fullName || player1?.username || "Player 1"} / ${player2?.fullName || player2?.username || "Player 2"}`,
                  username: `${player1?.username || "p1"} & ${player2?.username || "p2"}`,
                  profileImage: player1?.profileImage || player2?.profileImage,
                  isPair: true,
                  player1,
                  player2,
                });
              }
              group.participants = group.participants.map((pId: any) => pairMap.get(pId.toString()) || pId);
            } else {
              group.participants = group.participants.map((pId: any) => {
                const key = pId.toString();
                return userMap.get(key) || pId;
              });
            }
          }

          if (group.standings?.length) {
            group.standings = group.standings.map((s: any) => {
              const key = s.participant?.toString?.();
              return {
                ...s,
                participant: key
                  ? (isTeamTournament ? teamMap.get(key) || s.participant : userMap.get(key) || s.participant)
                  : s.participant,
              };
            });
          }
        }
      }

      return t;
    });

    // Get total count for pagination
    const totalCount = await Tournament.countDocuments(query);

    return NextResponse.json({
      tournaments: populatedTournaments,
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore: skip + populatedTournaments.length < totalCount
      }
    }, { status: 200 });
  } catch (err: any) {
    logError(err, {
      tags: { feature: "tournament", action: "fetch", endpoint: "GET /api/tournaments" },
    });

    return NextResponse.json(
      {
        error: "Failed to fetch tournaments",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}
