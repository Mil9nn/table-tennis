import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch, { ITeamMatch } from "@/models/TeamMatch"; // ✅ make sure this model exports a TypeScript interface
import { FlattenMaps } from "mongoose";

type Params = {
  matchId: string;
};

export async function GET(
  req: Request,
  context: { params: Promise<Params> }
) {
  await connectDB();

  try {
    const { matchId } = await context.params;

    // ✅ Explicitly type `match` as a LeanDocument of ITeamMatch or null
    const match: FlattenMaps<ITeamMatch> | null = await TeamMatch.findById(matchId)
      .populate([
        {
          path: "team1",
          select: "name players assignments",
          populate: {
            path: "players.user",
            select: "username fullName profileImage _id",
          },
        },
        {
          path: "team2",
          select: "name players assignments",
          populate: {
            path: "players.user",
            select: "username fullName profileImage _id",
          },
        },
        { path: "scorer", select: "username fullName profileImage _id" },
        {
          path: "subMatches.team1Players",
          select: "username fullName profileImage _id",
        },
        {
          path: "subMatches.team2Players",
          select: "username fullName profileImage _id",
        },
        {
          path: "subMatches.games.shots.player",
          select: "username fullName profileImage _id",
        },
      ])
      .lean();

    if (!match) {
      return NextResponse.json(
        { error: "Team match not found" },
        { status: 404 }
      );
    }

    // ✅ Safe handling of possibly undefined nested assignments
    const normalizeAssignments = (
      assignments: ITeamMatch["team1"]["assignments"]
    ): Record<string, string> => {
      if (assignments instanceof Map) {
        return Object.fromEntries(assignments);
      }
      if (typeof assignments === "object" && assignments !== null) {
        return assignments as Record<string, string>;
      }
      return {};
    };

    if (match.team1) {
      match.team1.assignments = normalizeAssignments(match.team1.assignments);
    }
    if (match.team2) {
      match.team2.assignments = normalizeAssignments(match.team2.assignments);
    }

    console.log("✅ Team1 assignments:", match.team1?.assignments);
    console.log("✅ Team2 assignments:", match.team2?.assignments);

    return NextResponse.json({ success: true, match });
  } catch (err) {
    console.error("❌ Failed to fetch team match:", err);
    return NextResponse.json(
      { error: "Failed to fetch match details" },
      { status: 500 }
    );
  }
}
