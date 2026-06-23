import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import { withAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/mongodb";
import { matchRepository } from "@/services/tournament/repositories/MatchRepository";
import { validateRequest, validateQueryParams, createIndividualMatchSchema, getMatchesQuerySchema } from "@/lib/validations";
import { logError } from "@/lib/error-logger";
import { serializeForClient } from "@/lib/api/serializeForClient";
import {
  buildMatchIdListFilter,
  parseMatchListSearch,
} from "@/lib/match/matchListSearch";

function asId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    const obj = raw as { $oid?: unknown; _id?: unknown; toString?: () => string };
    if (obj.$oid != null) return String(obj.$oid);
    if (obj._id != null) return asId(obj._id);
    if (typeof obj.toString === "function") return obj.toString();
  }
  return String(raw);
}

function normalizeIndividualMatchListItem(match: any): any {
  if (!match || match.matchCategory !== "individual") return match;
  const participants = Array.isArray(match.participants) ? match.participants : [];
  const teams = Array.isArray(match.teams) ? match.teams : [];
  const leftId =
    asId(teams?.[0]?.players?.[0]?._id ?? teams?.[0]?.players?.[0]) ||
    asId(participants?.[0]?._id ?? participants?.[0]);
  const rightId =
    asId(teams?.[1]?.players?.[0]?._id ?? teams?.[1]?.players?.[0]) ||
    asId(participants?.[1]?._id ?? participants?.[1]);

  if (!match.finalScore || typeof match.finalScore !== "object") match.finalScore = {};
  const fs = match.finalScore as Record<string, any>;
  const byId = fs.setsById && typeof fs.setsById === "object" ? fs.setsById : {};
  const games = Array.isArray(match.games) ? match.games : [];
  let winsLeft = 0;
  let winsRight = 0;
  for (const g of games) {
    if (typeof g?.winnerTeamIndex === "number") {
      if (g.winnerTeamIndex === 0) winsLeft += 1;
      if (g.winnerTeamIndex === 1) winsRight += 1;
      continue;
    }
    const w = asId(g?.winnerId ?? g?.winner);
    if (w && leftId && w === leftId) winsLeft += 1;
    else if (w && rightId && w === rightId) winsRight += 1;
    else if (g?.winnerSide === "side1") winsLeft += 1;
    else if (g?.winnerSide === "side2") winsRight += 1;
  }

  const hasGameWinners = winsLeft + winsRight > 0;
  if (hasGameWinners) {
    fs.setsByTeam = [winsLeft, winsRight];
  } else if (!Array.isArray(fs.setsByTeam) || fs.setsByTeam.length < 2) {
    const left = leftId ? Number(byId[leftId] ?? 0) : 0;
    const right = rightId ? Number(byId[rightId] ?? 0) : 0;
    fs.setsByTeam = [left, right];
  }
  return match;
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    const auth = await withAuth(request);
    if (!auth.success) return auth.response;

    body = await request.json();

    const scorer = await User.findById(auth.userId);
    if (!scorer) return NextResponse.json({ error: "invalid scorer, user not found" }, { status: 401 });

    // ✅ Validate request body with Zod
    const validation = validateRequest(createIndividualMatchSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const { matchType, numberOfSets, city, venue, teams, participants: rawParticipants, tournament } = validation.data;

    // Derive participants from teams if provided, otherwise use legacy flat array
    const participants = teams
      ? teams.flatMap(t => t.players)
      : rawParticipants!;

    const users = await User.find({ _id: { $in: participants } }).select(
      "_id username fullName profileImage"
    );

    if (users.length !== participants.length) {
      return NextResponse.json({ error: "Invalid player IDs" }, { status: 400 });
    }

    const match = await matchRepository.createIndividualMatch({
      matchType,
      numberOfSets,
      city,
      venue,
      participants,
      teams: teams ?? (matchType === "doubles"
        ? [{ players: participants.slice(0, 2) }, { players: participants.slice(2, 4) }]
        : [{ players: [participants[0]] }, { players: [participants[1]] }]),
      scorer: scorer._id.toString(),
      tournament,
    });

    // 👇 Populate with profileImage
    const populatedMatch = await matchRepository.findByIdWithParticipants(String(match._id));
    const matchObj = populatedMatch?.toObject() || match.toObject();

    return NextResponse.json(
      { message: "Individual match created", match: matchObj },
      { status: 201 }
    );
  } catch (err: any) {
    logError(err, {
      tags: { feature: "match", action: "create", endpoint: "POST /api/matches/individual" },
      extra: { matchData: body },
    });

    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    
    // Validate query parameters
    const validation = validateQueryParams(getMatchesQuerySchema, searchParams);
    if (!validation.success) {
      return validation.error;
    }

    const { context, type, status, search, dateFrom, dateTo, sortBy, sortOrder, limit, skip } = validation.data;

    const IndividualMatch = (await import("@/models/IndividualMatch")).default;

    // Build filter object
    const filter: any = {};

    // Context filter (casual/tournament)
    if (context === "casual") {
      filter.tournament = null;
    } else if (context === "tournament") {
      filter.tournament = { $ne: null };
    }

    // Match type filter
    if (type && type !== "all") {
      filter.matchType = type;
    }

    // Status filter
    if (status && status !== "all") {
      filter.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        filter.createdAt.$lte = endDate;
      }
    }

    // Build sort object
    const sortObject: any = {};
    sortObject[sortBy] = sortOrder === "asc" ? 1 : -1;

    if (search && search.trim()) {
      const parsed = parseMatchListSearch(search);

      if (parsed?.type === "exactId" || parsed?.type === "partialId") {
        Object.assign(filter, buildMatchIdListFilter(parsed));
      } else if (parsed?.type === "text") {
        const searchRegex = { $regex: parsed.query, $options: "i" };

        const matchingUsers = await User.find({
          $or: [{ fullName: searchRegex }, { username: searchRegex }],
        }).select("_id");

        const userIds = matchingUsers.map((u) => u._id);

        if (userIds.length > 0) {
          filter.participants = { $in: userIds };
        } else {
          return NextResponse.json({
            matches: [],
            pagination: {
              total: 0,
              skip,
              limit,
              hasMore: false,
            },
          });
        }
      }
    }

    // Execute query
    let query = IndividualMatch.find(filter)
      .populate("participants", "username fullName profileImage")
      .populate("scorer", "username fullName")
      .populate("tournament", "name format status")
      .sort(sortObject)
      .skip(skip);

    if (limit > 0) {
      query = query.limit(limit);
    }

    const matches = await query;

    // Get total count for pagination
    const totalCount = await IndividualMatch.countDocuments(filter);

    return NextResponse.json({
      matches: serializeForClient(matches).map((m: any) => normalizeIndividualMatchListItem(m)),
      pagination: {
        total: totalCount,
        skip,
        limit,
        hasMore: skip + matches.length < totalCount
      }
    });
  } catch (err: any) {
    logError(err, {
      tags: { feature: "match", action: "fetch", endpoint: "GET /api/matches/individual" },
    });

    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
