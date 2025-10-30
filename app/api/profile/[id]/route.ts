// app/api/profile/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { User } from "@/models/User";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { connectDB } from "@/lib/mongodb";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Fetch user basic info
    const user = await User.findById(id).select("-password -__v");
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch individual matches
    const individualMatches = await IndividualMatch.find({
      participants: id,
      status: "completed",
    })
      .populate("participants", "username fullName profileImage")
      .lean();

    // Fetch team matches
    const teamMatches = await TeamMatch.find({
      status: "completed",
      $or: [
        { "team1.players.user": id },
        { "team2.players.user": id },
      ],
    })
      .populate("team1.players.user team2.players.user", "username fullName profileImage")
      .lean();

    // Fetch teams
    const userTeams = await Team.find({
      "players.user": id,
    })
      .populate("captain", "username fullName")
      .populate("players.user", "username fullName profileImage")
      .lean();

    // Calculate stats (same logic as detailed-stats)
    const individualStats = {
      total: individualMatches.length,
      wins: 0,
      losses: 0,
    };

    individualMatches.forEach((match: any) => {
      const isSide1 = match.participants[0]._id.toString() === id;
      const userSide = isSide1 ? "side1" : "side2";
      const isWin = match.winnerSide === userSide;

      if (isWin) individualStats.wins++;
      else individualStats.losses++;
    });

    const teamStats = {
      total: teamMatches.length,
      wins: 0,
      losses: 0,
    };

    teamMatches.forEach((match: any) => {
      const isTeam1 = match.team1.players.some((p: any) => p.user._id.toString() === id);
      const userTeamSide = isTeam1 ? "team1" : "team2";
      const isWin = match.winnerTeam === userTeamSide;

      if (isWin) teamStats.wins++;
      else teamStats.losses++;
    });

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
      stats: {
        individual: individualStats,
        team: teamStats,
        overall: {
          totalMatches: individualStats.total + teamStats.total,
          totalWins: individualStats.wins + teamStats.wins,
          totalLosses: individualStats.losses + teamStats.losses,
        },
        teams: userTeams.map((t: any) => ({
          _id: t._id,
          name: t.name,
          role: t.captain.toString() === id ? "Captain" : "Player",
          playerCount: t.players.length,
        })),
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}