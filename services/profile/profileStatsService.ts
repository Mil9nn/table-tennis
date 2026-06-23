import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import IndividualMatch from "@/models/IndividualMatch";
import TeamMatch from "@/models/TeamMatch";
import Team from "@/models/Team";
import { User } from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import mongoose from "mongoose";
import {
  hydrateIndividualMatchesWithPoints,
  hydrateTeamMatchesWithPoints,
} from "@/services/match/embeddedShotService";

export const toIdString = (value: any): string =>
  typeof value === "object" && value?._id
    ? value._id.toString()
    : value?.toString?.() || "";

export const mapLikeToRecord = (value: any): Record<string, number> => {
  if (!value) return {};
  if (value instanceof Map)
    return Object.fromEntries(value) as Record<string, number>;
  return value as Record<string, number>;
};

export async function validateProfileRequest(
  request: NextRequest,
  id: string
): Promise<NextResponse | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json(
      { success: false, message: "Invalid user id" },
      { status: 400 }
    );
  }

  const user = await User.findById(id)
    .select("username fullName profileImage")
    .lean();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "User not found" },
      { status: 404 }
    );
  }

  const token = getTokenFromRequest(request);
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const decoded = verifyToken(token);
  if (!decoded?.userId) {
    return NextResponse.json(
      { success: false, message: "Invalid token" },
      { status: 401 }
    );
  }

  return null;
}

export async function fetchUserIndividualMatches(userId: string) {
  const matches = await IndividualMatch.find({
    participants: userId,
    status: "completed",
  })
    .populate("participants", "username fullName profileImage")
    .lean();

  await hydrateIndividualMatchesWithPoints(
    matches as Record<string, unknown>[]
  );
  return matches;
}

export async function fetchUserTeamMatches(userId: string) {
  const matches = await TeamMatch.find({
    status: "completed",
    $or: [
      { "team1.players.user": userId },
      { "team2.players.user": userId },
    ],
  })
    .populate(
      "team1.players.user team2.players.user",
      "username fullName profileImage"
    )
    .lean();

  await hydrateTeamMatchesWithPoints(matches as Record<string, unknown>[]);
  return matches;
}


export function buildHeadToHead(individualMatches: any[], userId: string) {
  const headToHead: Record<
    string,
    { wins: number; losses: number; opponent: any }
  > = {};

  individualMatches.forEach((match: any) => {
    const hasTeams = match.teams && Array.isArray(match.teams) && match.teams.length === 2;

    let userTeamIdx: number;
    let oppPlayers: any[];

    if (hasTeams) {
      const t0Ids = (match.teams[0].players || []).map((p: any) => toIdString(p));
      userTeamIdx = t0Ids.includes(userId) ? 0 : 1;
      const oppIdx = userTeamIdx === 0 ? 1 : 0;
      const oppTeamIds = new Set((match.teams[oppIdx].players || []).map((p: any) => toIdString(p)));
      oppPlayers = (match.participants || []).filter((p: any) => oppTeamIds.has(toIdString(p)));
    } else {
      const pIds = (match.participants || []).map((p: any) => toIdString(p));
      const isDoubles = match.matchType === "doubles";
      userTeamIdx = isDoubles
        ? ([pIds[0], pIds[1]].includes(userId) ? 0 : 1)
        : (pIds[0] === userId ? 0 : 1);
      oppPlayers = (match.participants || []).filter((p: any) => toIdString(p) !== userId);
    }

    let isWin = false;
    if (match.winnerTeamIndex != null) {
      isWin = match.winnerTeamIndex === userTeamIdx;
    } else {
      const winnerId = toIdString(match.winnerId);
      if (hasTeams) {
        const userTeamIds = (match.teams[userTeamIdx].players || []).map((p: any) => toIdString(p));
        isWin = userTeamIds.includes(winnerId);
      } else {
        const pIds = (match.participants || []).map((p: any) => toIdString(p));
        const isDoubles = match.matchType === "doubles";
        const team0Ids = isDoubles ? [pIds[0], pIds[1]] : [pIds[0]];
        isWin = userTeamIdx === 0 ? team0Ids.includes(winnerId) : !team0Ids.includes(winnerId);
      }
    }

    oppPlayers.forEach((opponent: any) => {
      const oppId = toIdString(opponent);
      if (!oppId) return;
      if (!headToHead[oppId]) {
        headToHead[oppId] = { wins: 0, losses: 0, opponent };
      }
      if (isWin) headToHead[oppId].wins++;
      else headToHead[oppId].losses++;
    });
  });

  return Object.values(headToHead)
    .map((h) => ({
      opponent: h.opponent,
      wins: h.wins,
      losses: h.losses,
      total: h.wins + h.losses,
      winRate: ((h.wins / (h.wins + h.losses)) * 100).toFixed(1),
    }))
    .sort((a, b) => b.total - a.total);
}

export function buildMonthlyActivity(
  individualMatches: any[],
  teamMatches: any[]
) {
  const monthlyActivity: Record<string, number> = {};

  [...individualMatches, ...teamMatches].forEach((match: any) => {
    const month = new Date(match.createdAt).toISOString().slice(0, 7);
    monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
  });

  return Object.entries(monthlyActivity)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function buildTeamStats(teamMatches: any[], userId: string) {
  const teamStats = {
    total: 0,
    byFormat: { five_singles: 0, single_double_single: 0, custom: 0 },
    wins: 0,
    losses: 0,
    subMatchesPlayed: 0,
    subMatchesWon: 0,
  };

  teamMatches.forEach((match: any) => {
    const isTeam1 = match.team1.players.some(
      (p: any) => toIdString(p.user) === userId
    );
    const userTeamSide = isTeam1 ? "team1" : "team2";
    const userTeamId = toIdString(
      isTeam1 ? match.team1?._id : match.team2?._id
    );
    const winnerTeamId = toIdString(match.winnerTeamId);
    const isWin = winnerTeamId
      ? winnerTeamId === userTeamId
      : match.winnerTeam === userTeamSide;

    teamStats.total++;
    teamStats.byFormat[
      match.matchFormat as keyof typeof teamStats.byFormat
    ]++;
    if (isWin) teamStats.wins++;
    else teamStats.losses++;

    match.subMatches?.forEach((sub: any) => {
      const playerIds = [
        ...(Array.isArray(sub.playerTeam1)
          ? sub.playerTeam1
          : [sub.playerTeam1]),
        ...(Array.isArray(sub.playerTeam2)
          ? sub.playerTeam2
          : [sub.playerTeam2]),
      ].map((p: any) => p.toString());

      if (playerIds.includes(userId.toString())) {
        teamStats.subMatchesPlayed++;

        const userInTeam1 = (
          Array.isArray(sub.playerTeam1)
            ? sub.playerTeam1
            : [sub.playerTeam1]
        )
          .map((p: any) => p.toString())
          .includes(userId.toString());

        const subWinnerTeamId = toIdString(sub.winnerTeamId);
        const subWon = subWinnerTeamId
          ? (userInTeam1 &&
              subWinnerTeamId === toIdString(match.team1?._id)) ||
            (!userInTeam1 &&
              subWinnerTeamId === toIdString(match.team2?._id))
          : (userInTeam1 && sub.winnerSide === "team1") ||
            (!userInTeam1 && sub.winnerSide === "team2");
        if (subWon) {
          teamStats.subMatchesWon++;
        }
      }
    });
  });

  return teamStats;
}

export async function fetchUserTeams(userId: string) {
  const userTeams = await Team.find({
    "players.user": userId,
  })
    .select("name logo city captain players")
    .populate("captain", "username fullName");

  return userTeams.map((t: any) => {
    const captainId = t.captain?._id?.toString();
    const isCaptain = captainId === userId.toString();
    
    return {
      _id: t._id,
      name: t.name,
      logo: t.logo ?? null,
      city: t.city,
      role: isCaptain ? "Captain" : "Player",
      playerCount: t.players.length,
    };
  });
}
