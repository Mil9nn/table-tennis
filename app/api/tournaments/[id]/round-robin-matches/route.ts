import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Match from "@/models/MatchBase";
import Tournament from "@/models/Tournament";
import TournamentGroups from "@/models/TournamentGroups";
import { serializeForClient } from "@/lib/api/serializeForClient";

function asId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object") {
    const obj = raw as {
      $oid?: unknown;
      _id?: unknown;
      id?: unknown;
      toString?: () => string;
    };
    if (obj.$oid != null) return String(obj.$oid);
    if (obj._id != null) return asId(obj._id);
    if (obj.id != null) return asId(obj.id);
    if (typeof obj.toString === "function") {
      const s = obj.toString();
      return s !== "[object Object]" ? s : "";
    }
  }
  return String(raw);
}

function normalizeIndividualScore(match: any): any {
  if (!match || match.matchCategory !== "individual") return match;
  if (match.status !== "completed") return match;

  const participants = Array.isArray(match.participants) ? match.participants : [];
  const teams = Array.isArray(match.teams) ? match.teams : [];

  const leftId =
    asId(teams?.[0]?.players?.[0]?._id ?? teams?.[0]?.players?.[0]) ||
    asId(participants?.[0]?._id ?? participants?.[0]);
  const rightId =
    asId(teams?.[1]?.players?.[0]?._id ?? teams?.[1]?.players?.[0]) ||
    asId(participants?.[1]?._id ?? participants?.[1]);

  const games = Array.isArray(match.games) ? match.games : [];
  let winsLeft = 0;
  let winsRight = 0;

  for (const game of games) {
    if (typeof game?.winnerTeamIndex === "number") {
      if (game.winnerTeamIndex === 0) winsLeft += 1;
      if (game.winnerTeamIndex === 1) winsRight += 1;
      continue;
    }

    const winnerId = asId(game?.winnerId ?? game?.winner);
    if (winnerId && leftId && winnerId === leftId) {
      winsLeft += 1;
      continue;
    }
    if (winnerId && rightId && winnerId === rightId) {
      winsRight += 1;
      continue;
    }

    const byTeam = Array.isArray(game?.scoresByTeam) ? game.scoresByTeam : null;
    if (byTeam && byTeam.length >= 2) {
      const a = Number(byTeam[0] ?? 0);
      const b = Number(byTeam[1] ?? 0);
      if (a > b) winsLeft += 1;
      else if (b > a) winsRight += 1;
    }
  }

  if (!match.finalScore || typeof match.finalScore !== "object") {
    match.finalScore = {};
  }

  const hasDerived = winsLeft + winsRight > 0;
  if (hasDerived) {
    match.finalScore.setsByTeam = [winsLeft, winsRight];
    if (leftId || rightId) {
      match.finalScore.setsById = {
        ...(leftId ? { [leftId]: winsLeft } : {}),
        ...(rightId ? { [rightId]: winsRight } : {}),
      };
    }
  }

  return match;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid tournament id" }, { status: 400 });
    }

    const tournament = (await Tournament.findById(id)
      .select("category groups")
      .lean()) as any;
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const groupsDoc = await TournamentGroups.findOne({ tournament: id }).lean();
    const matchIds = new Set<string>();
    const collectMatchIds = (groups: any[] = []) => {
      groups.forEach((group: any) => {
        (group?.rounds || []).forEach((round: any) => {
          (round?.matches || []).forEach((matchId: any) => {
            const value =
              typeof matchId === "string"
                ? matchId
                : matchId?._id?.toString?.() || matchId?.toString?.() || "";
            if (value) matchIds.add(value);
          });
        });
      });
    };

    // Primary source: projection groups (fast path)
    collectMatchIds((groupsDoc?.groups || []) as any[]);

    // Fallback source: tournament document groups (source of truth)
    // Needed when projection is transiently stale right after scoring updates.
    if (matchIds.size === 0) {
      collectMatchIds((tournament?.groups || []) as any[]);
    }

    if (matchIds.size === 0) {
      return NextResponse.json({ matches: [] });
    }

    const objectIds = Array.from(matchIds)
      .filter((matchId) => mongoose.Types.ObjectId.isValid(matchId))
      .map((matchId) => new mongoose.Types.ObjectId(matchId));

    const matches = await Match.find({ _id: { $in: objectIds } }).populate(
      tournament.category === "team"
        ? [
            { path: "team1.captain", select: "username fullName profileImage" },
            { path: "team2.captain", select: "username fullName profileImage" },
            { path: "subMatches.playerTeam1", select: "username fullName profileImage" },
            { path: "subMatches.playerTeam2", select: "username fullName profileImage" },
          ]
        : [{ path: "participants", select: "username fullName profileImage _id" }]
    );

    if (process.env.NODE_ENV !== "production") {
      const sample = matches[0] as any;
      const serializedSample = sample ? serializeForClient(sample) : null;
    }

    return NextResponse.json({
      matches: matches.map((match: any) =>
        normalizeIndividualScore(serializeForClient(match))
      ),
    });
  } catch (error) {
    console.error("[GET /api/tournaments/[id]/round-robin-matches] failed:", error);
    return NextResponse.json({ error: "Failed to load round-robin matches" }, { status: 500 });
  }
}
