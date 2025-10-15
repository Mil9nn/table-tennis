import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { TeamInfo } from "@/types/match.type";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { matchType, setsPerTie, team1Id, team2Id, city, venue } = body;

    // 🔐 AUTH
    const token = getTokenFromRequest(req);
    if (!token)
      return NextResponse.json(
        { error: "Unauthorized! Please login or register." },
        { status: 401 }
      );

    const decoded = verifyToken(token);
    if (!decoded?.userId)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const scorer = await User.findById(decoded.userId);
    if (!scorer)
      return NextResponse.json(
        { error: "Invalid scorer, user not found" },
        { status: 401 }
      );

    // ✅ Fetch teams
    const team1 = await Team.findById(team1Id).populate("players.user");
    const team2 = await Team.findById(team2Id).populate("players.user");

    if (!team1 || !team2)
      return NextResponse.json(
        { error: "Both teams must be selected" },
        { status: 400 }
      );

    const findBySymbol = (team: any, symbol: string) => {
      if (!team.assignments) return null;

      // Convert Map -> Array of [playerId, symbol]
      const assignments = Array.from(team.assignments.entries());

      const playerId = assignments.find(
        ([, val]) => typeof val === "string" && val.toUpperCase() === symbol
      )?.[0];

      if (!playerId) return null;

      const player = team.players.find(
        (p: any) => p.user._id.toString() === playerId
      );

      return player?.user?._id || null;
    };

    // ✅ Base match object: store only teamId
    const newMatch: any = {
      matchCategory: "team",
      format: matchType,
      numberOfSetsPerSubMatch: Number(setsPerTie),
      team1: team1._id,
      team2: team2._id,
      city,
      venue,
      status: "scheduled",
      currentSubMatch: 1,
      subMatches: [],
      scorer: scorer._id,
    };

    // ✅ Swaythling format setup
    if (matchType === "five_singles" || matchType === "swaythling_format") {
      const A = findBySymbol(team1, "A");
      const B = findBySymbol(team1, "B");
      const C = findBySymbol(team1, "C");
      const X = findBySymbol(team2, "X");
      const Y = findBySymbol(team2, "Y");
      const Z = findBySymbol(team2, "Z");

      if (!A || !B || !C || !X || !Y || !Z) {
        return NextResponse.json(
          {
            error:
              "Both teams must have players assigned A,B,C and X,Y,Z for Swaythling format.",
          },
          { status: 400 }
        );
      }

      newMatch.format = "swaythling_format";
      newMatch.subMatches = [
        {
          subMatchNumber: 1,
          type: "singles",
          team1Players: [A],
          team2Players: [X],
        },
        {
          subMatchNumber: 2,
          type: "singles",
          team1Players: [B],
          team2Players: [Y],
        },
        {
          subMatchNumber: 3,
          type: "singles",
          team1Players: [C],
          team2Players: [Z],
        },
        {
          subMatchNumber: 4,
          type: "singles",
          team1Players: [A],
          team2Players: [Y],
        },
        {
          subMatchNumber: 5,
          type: "singles",
          team1Players: [B],
          team2Players: [X],
        },
      ];
    }

    // ✅ Save match
    const teamMatch = await TeamMatch.create(newMatch);

    // ✅ Populate teams and scorer on return
    await teamMatch.populate([
      {
        path: "team1",
        select: "name players assignments",
        populate: { path: "players.user", select: "fullName username _id" },
      },
      {
        path: "team2",
        select: "name players assignments",
        populate: { path: "players.user", select: "fullName username _id" },
      },
      { path: "scorer", select: "username fullName profileImage" },
    ]);

    return NextResponse.json(
      { message: "Team match created", match: teamMatch },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("❌ Failed to create team match:", err);
    return NextResponse.json(
      { error: "Failed to create team match" },
      { status: 500 }
    );
  }
}
