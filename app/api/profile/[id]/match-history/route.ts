import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
  mapLikeToRecord,
  toIdString,
  validateProfileRequest,
} from "@/services/profile/profileStatsService";
import { User } from "@/models/User";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const errorResponse = await validateProfileRequest(request, id);
    if (errorResponse) return errorResponse;

    const [individualMatches, teamMatches, user] = await Promise.all([
      IndividualMatch.find({ 
        participants: id, 
        status: 'completed' 
      })
      .select('matchType status createdAt winnerId winnerSide winnerTeamIndex finalScore.setsByTeam finalScore.setsById city matchDuration')
      .populate('participants', 'fullName username profileImage')
      .sort({ createdAt: -1 })
      .lean(),
      
      TeamMatch.find({ 
        'team1.players.user': id,
        status: 'completed'
      })
      .select('matchFormat createdAt winnerTeamId winnerTeam finalScore.matchesByTeamId city matchDuration')
      .populate('team1.players.user', 'fullName username profileImage')
      .populate('team2.players.user', 'fullName username profileImage')
      .sort({ createdAt: -1 })
      .lean(),
      
      User.findById(id).select("username fullName profileImage").lean() as Promise<{
        username?: string;
        fullName?: string;
        profileImage?: string;
      } | null>,
    ]);

    const normalizeIndividualMatch = (match: Record<string, unknown>) => ({
      ...match,
      matchCategory: "individual" as const,
      _id: toIdString(match._id),
      createdAt: match.createdAt,
      winnerId: match.winnerId ? toIdString(match.winnerId) : null,
      status: match.status ?? "completed",
      participants: Array.isArray(match.participants)
        ? match.participants.map((p: Record<string, unknown>) => ({
            ...p,
            _id: toIdString(p._id),
          }))
        : [],
      finalScore: match.finalScore
        ? {
            ...(match.finalScore as Record<string, unknown>),
            setsById: mapLikeToRecord(
              (match.finalScore as { setsById?: unknown })?.setsById
            ),
          }
        : undefined,
    });

    const normalizeTeamMatch = (match: Record<string, unknown>) => ({
      ...match,
      matchCategory: "team" as const,
      _id: toIdString(match._id),
      createdAt: match.createdAt,
      status: match.status ?? "completed",
      winnerTeamId: match.winnerTeamId
        ? toIdString(match.winnerTeamId)
        : null,
    });

    // Combine and sort matches
    const allMatches = [
      ...individualMatches.map((m) =>
        normalizeIndividualMatch(m as Record<string, unknown>)
      ),
      ...teamMatches.map((m) =>
        normalizeTeamMatch(m as Record<string, unknown>)
      ),
    ].sort(
      (a, b) =>
        new Date(String(b.createdAt)).getTime() -
        new Date(String(a.createdAt)).getTime()
    );

    return NextResponse.json({
      success: true,
      matches: allMatches,
      user: {
        _id: id,
        username: user?.username || "",
        fullName: user?.fullName || "",
        profileImage: user?.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Match history error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
