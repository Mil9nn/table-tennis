// app/api/tournaments/route.ts
import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { rateLimit } from "@/lib/rate-limit/middleware";
import { validateRequest, validateQueryParams, createTournamentSchema, getTournamentsQuerySchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";
import { getUserSubscription, checkLimit, checkTournamentFormatAllowed, incrementTournamentCount } from "@/lib/middleware/subscription";

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await rateLimit(request, "POST", "/api/tournaments");
  if (rateLimitResponse) return rateLimitResponse;

  let body: any;
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    body = await request.json();

    // DEBUG: Log received body
    console.log("🔵 [API POST] Received body:", {
      category: body.category,
      teamConfig: body.teamConfig,
      teamConfig_setsPerSubMatch: body.teamConfig?.setsPerSubMatch,
      rules_setsPerMatch: body.rules?.setsPerMatch,
    });

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
    } = validation.data;

    // Check subscription limits and restrictions
    const subscription = await getUserSubscription(auth.userId);
    
    // Check tournament creation limit
    const tournamentLimitCheck = await checkLimit(auth.userId, "tournaments", 0);
    if (!tournamentLimitCheck.allowed) {
      return NextResponse.json(
        { error: tournamentLimitCheck.error },
        { status: 403 }
      );
    }

    // Check participant limit if participants are provided
    if (participants && participants.length > 0) {
      const participantLimitCheck = await checkLimit(auth.userId, "participants", participants.length);
      if (!participantLimitCheck.allowed) {
        return NextResponse.json(
          { error: participantLimitCheck.error },
          { status: 403 }
        );
      }
    }

    // Check tournament format restriction
    const formatCheck = await checkTournamentFormatAllowed(auth.userId, format);
    if (!formatCheck.allowed) {
      return NextResponse.json(
        { error: formatCheck.error },
        { status: 403 }
      );
    }

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

    // Get subscription tier and features for tournament metadata
    const userTier = subscription?.tier || "free";
    const maxScorersAllowed = subscription?.features?.maxScorers || 1;

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
      createdWithTier: userTier,
      maxScorersAllowed: maxScorersAllowed,
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

    // DEBUG: Log tournament object before save
    console.log("🟢 [API POST] Tournament object created:", {
      id: tournament._id,
      category: tournament.category,
      teamConfig: tournament.teamConfig,
      teamConfig_setsPerSubMatch: tournament.teamConfig?.setsPerSubMatch,
      rules_setsPerMatch: tournament.rules?.setsPerMatch,
    });

    await tournament.save();

    // Increment tournament creation counter
    await incrementTournamentCount(auth.userId);

    // DEBUG: Log after save
    console.log("🟡 [API POST] Tournament saved:", {
      id: tournament._id,
      teamConfig: tournament.teamConfig,
      teamConfig_setsPerSubMatch: tournament.teamConfig?.setsPerSubMatch,
      rules_setsPerMatch: tournament.rules?.setsPerMatch,
    });
    
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
        { path: "standings.participant", model: Team, select: "name logo city captain" },
        { path: "groups.standings.participant", model: Team, select: "name logo city captain" },
        { path: "seeding.participant", model: Team, select: "name logo city captain" },
      ]);
    } else {
      await tournament.populate([
        { path: "organizer", select: "username fullName profileImage" },
        { path: "participants", select: "username fullName profileImage" },
        { path: "standings.participant", select: "username fullName profileImage" },
        { path: "groups.standings.participant", select: "username fullName profileImage" },
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

    // Now populate each tournament based on its category
    const populatedTournaments = await Promise.all(
      tournamentsRaw.map(async (t: any) => {
        const isTeamTournament = t.category === "team";

        // Populate organizer (always User)
        if (t.organizer) {
          const organizer = await User.findById(t.organizer)
            .select("username fullName profileImage")
            .lean();
          t.organizer = organizer;
        }

        // Populate participants based on category
        if (t.participants && t.participants.length > 0) {
          if (isTeamTournament) {
            const teams = await Team.find({ _id: { $in: t.participants } })
              .select("name logo city captain players")
              .populate("captain", "username fullName profileImage")
              .populate("players.user", "username fullName profileImage")
              .lean();
            
            // Create a map for ordering
            const teamMap = new Map();
            teams.forEach((team: any) => teamMap.set(team._id.toString(), team));
            
            t.participants = t.participants.map((pId: any) => 
              teamMap.get(pId.toString()) || pId
            );
          } else {
            const users = await User.find({ _id: { $in: t.participants } })
              .select("username fullName profileImage")
              .lean();
            
            // Create a map for ordering
            const userMap = new Map();
            users.forEach((user: any) => userMap.set(user._id.toString(), user));
            
            t.participants = t.participants.map((pId: any) => 
              userMap.get(pId.toString()) || pId
            );
          }
        }

        // Populate standings.participant
        if (t.standings && t.standings.length > 0) {
          const participantIds = t.standings.map((s: any) => s.participant).filter(Boolean);
          if (participantIds.length > 0) {
            if (isTeamTournament) {
              const teams = await Team.find({ _id: { $in: participantIds } })
                .select("name logo city captain")
                .lean();
              const teamMap = new Map();
              teams.forEach((team: any) => teamMap.set(team._id.toString(), team));
              t.standings = t.standings.map((s: any) => ({
                ...s,
                participant: teamMap.get(s.participant?.toString()) || s.participant,
              }));
            } else {
              const users = await User.find({ _id: { $in: participantIds } })
                .select("username fullName profileImage")
                .lean();
              const userMap = new Map();
              users.forEach((user: any) => userMap.set(user._id.toString(), user));
              t.standings = t.standings.map((s: any) => ({
                ...s,
                participant: userMap.get(s.participant?.toString()) || s.participant,
              }));
            }
          }
        }

        // Populate seeding.participant
        if (t.seeding && t.seeding.length > 0) {
          const participantIds = t.seeding.map((s: any) => s.participant).filter(Boolean);
          if (participantIds.length > 0) {
            if (isTeamTournament) {
              const teams = await Team.find({ _id: { $in: participantIds } })
                .select("name logo city captain")
                .lean();
              const teamMap = new Map();
              teams.forEach((team: any) => teamMap.set(team._id.toString(), team));
              t.seeding = t.seeding.map((s: any) => ({
                ...s,
                participant: teamMap.get(s.participant?.toString()) || s.participant,
              }));
            } else {
              const users = await User.find({ _id: { $in: participantIds } })
                .select("username fullName profileImage")
                .lean();
              const userMap = new Map();
              users.forEach((user: any) => userMap.set(user._id.toString(), user));
              t.seeding = t.seeding.map((s: any) => ({
                ...s,
                participant: userMap.get(s.participant?.toString()) || s.participant,
              }));
            }
          }
        }

        // Populate groups.standings.participant if groups exist
        if (t.groups && t.groups.length > 0) {
          for (const group of t.groups) {
            // Populate group participants
            if (group.participants && group.participants.length > 0) {
              if (isTeamTournament) {
                const teams = await Team.find({ _id: { $in: group.participants } })
                  .select("name logo city captain")
                  .lean();
                const teamMap = new Map();
                teams.forEach((team: any) => teamMap.set(team._id.toString(), team));
                group.participants = group.participants.map((pId: any) => 
                  teamMap.get(pId.toString()) || pId
                );
              } else {
                const users = await User.find({ _id: { $in: group.participants } })
                  .select("username fullName profileImage")
                  .lean();
                const userMap = new Map();
                users.forEach((user: any) => userMap.set(user._id.toString(), user));
                group.participants = group.participants.map((pId: any) => 
                  userMap.get(pId.toString()) || pId
                );
              }
            }

            // Populate group standings
            if (group.standings && group.standings.length > 0) {
              const participantIds = group.standings.map((s: any) => s.participant).filter(Boolean);
              if (participantIds.length > 0) {
                if (isTeamTournament) {
                  const teams = await Team.find({ _id: { $in: participantIds } })
                    .select("name logo city captain")
                    .lean();
                  const teamMap = new Map();
                  teams.forEach((team: any) => teamMap.set(team._id.toString(), team));
                  group.standings = group.standings.map((s: any) => ({
                    ...s,
                    participant: teamMap.get(s.participant?.toString()) || s.participant,
                  }));
                } else {
                  const users = await User.find({ _id: { $in: participantIds } })
                    .select("username fullName profileImage")
                    .lean();
                  const userMap = new Map();
                  users.forEach((user: any) => userMap.set(user._id.toString(), user));
                  group.standings = group.standings.map((s: any) => ({
                    ...s,
                    participant: userMap.get(s.participant?.toString()) || s.participant,
                  }));
                }
              }
            }
          }
        }

        return t;
      })
    );

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
