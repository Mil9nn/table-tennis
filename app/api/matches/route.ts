import { NextRequest, NextResponse } from "next/server";
import Match from "@/models/Match";
import { User } from "@/models/User";
import Team from "@/models/Team";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";

function normalizeParticipants(raw: any): string[] {
  if (!raw) return [];

  // If someone passed object with players arrays in body.team1Players etc, caller should pass already
  // For quick test, accept a stringified JSON array
  if (typeof raw === "string") {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.map((p) => String(p).trim()).filter(Boolean);
    } catch {
      // fallback: comma split
      return raw
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map((p) =>
        p && typeof p === "object"
          ? String(p.name ?? p.username ?? p)
          : String(p)
      )
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Otherwise return as single string element
  return [String(raw).trim()];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const scorer = await User.findById(decoded.userId);
    if (!scorer) {
      return NextResponse.json({ error: "Invalid user" }, { status: 401 });
    }

    // Basic required fields
    if (
      !body.matchCategory ||
      !body.matchType ||
      !body.numberOfSets ||
      !body.city
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const matchData: any = {
      matchCategory: body.matchCategory,
      matchType: body.matchType,
      numberOfSets: Number(body.numberOfSets),
      city: body.city,
      venue: body.venue || body.city,
      scorer: scorer._id,
      status: "scheduled",
    };

    if (body.matchCategory === "individual") {
      const p = normalizeParticipants(
        body.participants ?? [body.player1, body.player2]
      );
      if (!p || p.length < 2) {
        return NextResponse.json(
          { error: "Player names are required for individual matches" },
          { status: 400 }
        );
      }

      // Lookup users by username
      const users = await User.find({ username: { $in: p } }).select(
        "_id username fullName"
      );
      if (users.length < p.length) {
        return NextResponse.json(
          { error: "One or more player usernames are invalid" },
          { status: 400 }
        );
      }
      matchData.participants = users.map((u) => u._id);

      // Also populate players object for legacy UI logic (fills available fields)
      matchData.players = {
        player1: {
          _id: users[0]._id,
          name: users[0].fullName ?? users[0].username,
        },
        player2: {
          _id: users[1]._id,
          name: users[1].fullName ?? users[1].username,
        },
      };

      // Doubles: expect 4 players
      if (body.matchType === "doubles" || body.matchType === "mixed_doubles") {
        if (users.length < 4) {
          return NextResponse.json(
            { error: "All four players are required for doubles matches" },
            { status: 400 }
          );
        }

        matchData.players.player3 = {
          _id: users[2]._id,
          name: users[2].fullName ?? users[2].username,
        };
        matchData.players.player4 = {
          _id: users[3]._id,
          name: users[3].fullName ?? users[3].username,
        };
      }
    }

    // Team match: validate team ids and attach them (expect body.team1 and body.team2 to be IDs)
    if (body.matchCategory === "team") {
      const team1Id = body.team1 ?? body.team1Id ?? body.team1_id;
      const team2Id = body.team2 ?? body.team2Id ?? body.team2_id;

      if (!team1Id || !team2Id) {
        return NextResponse.json(
          { error: "Both teams are required for a team match" },
          { status: 400 }
        );
      }

      // Validate teams exist
      const [team1Doc, team2Doc] = await Promise.all([
        Team.findById(team1Id).lean(),
        Team.findById(team2Id).lean(),
      ]);
      if (!team1Doc || !team2Doc) {
        return NextResponse.json(
          { error: "One or both team ids are invalid" },
          { status: 400 }
        );
      }

      // Attach refs (ObjectId strings)
      matchData.team1 = team1Doc._id;
      matchData.team2 = team2Doc._id;

      // Optionally: also set team names and players snapshot (useful for quick read)
      matchData.team1Snapshot = {
        name: team1Doc.name,
        players: team1Doc.players ?? [],
      };
      matchData.team2Snapshot = {
        name: team2Doc.name,
        players: team2Doc.players ?? [],
      };
    }

    const newMatch = new Match(matchData);
    await newMatch.save();

    // populate scorer and teams so frontend receives usable objects
    await newMatch.populate("scorer", "username fullName");
    await newMatch.populate("team1", "name city players");
    await newMatch.populate("team2", "name city players");

    return NextResponse.json(
      { success: true, match: newMatch, message: "Match created successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating match:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate entry detected. Please check your data." },
        { status: 400 }
      );
    }

    if (error.name === "ValidationError") {
      // surface the underlying message for debugging
      return NextResponse.json(
        { error: "Invalid match data provided", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const query: any = {};
    if (status) query.status = status;

    const matches = await Match.find(query)
      .populate("scorer", "username fullName")
      .populate("participants", "username fullName")
      .populate("team1", "name city players")
      .populate("team2", "name city players")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const total = await Match.countDocuments(query);

    return NextResponse.json({
      matches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
}
