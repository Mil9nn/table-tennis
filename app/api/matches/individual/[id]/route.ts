import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { withAuth } from "@/lib/api-utils";
import { populateIndividualMatch, populateIndividualMatchBasic } from "@/services/match/populationService";
import { applyShotsToLoadedMatch, deleteAllPointsForIndividualMatch } from "@/services/match/embeddedShotService";
import { validateRequest, updateIndividualMatchSchema } from "@/lib/validations";
import { normalizeForApi } from "@/lib/api/normalizeForApi";

// CRITICAL: Import models in correct order to ensure discriminators are registered
import Match from "@/models/MatchBase";
import IndividualMatch from "@/models/IndividualMatch";

type MatchView = "legacy" | "summary" | "details" | "stats";

function stripRedundantIdAliases(input: any): any {
  if (Array.isArray(input)) {
    return input.map((item) => stripRedundantIdAliases(item));
  }
  if (!input || typeof input !== "object") return input;

  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === "id" && Object.prototype.hasOwnProperty.call(input, "_id")) {
      continue;
    }
    out[key] = stripRedundantIdAliases(value);
  }
  return out;
}

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

function normalizeIndividualMatchResponse(match: any, view: MatchView): any {
  if (!match || match.matchCategory !== "individual") return match;
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

  for (const g of games) {
    const byId = g?.scoresById && typeof g.scoresById === "object" ? g.scoresById : {};
    if (!Array.isArray(g?.scoresByTeam) || g.scoresByTeam.length < 2) {
      const left =
        leftId && Object.prototype.hasOwnProperty.call(byId, leftId)
          ? Number(byId[leftId] ?? 0)
          : Number(Object.values(byId)[0] ?? g?.side1Score ?? g?.team1Score ?? 0);
      const right =
        rightId && Object.prototype.hasOwnProperty.call(byId, rightId)
          ? Number(byId[rightId] ?? 0)
          : Number(Object.values(byId)[1] ?? g?.side2Score ?? g?.team2Score ?? 0);
      g.scoresByTeam = [left, right];
    }

    if (typeof g?.winnerTeamIndex === "number") {
      if (g.winnerTeamIndex === 0) winsLeft += 1;
      if (g.winnerTeamIndex === 1) winsRight += 1;
    } else {
      const w = asId(g?.winnerId ?? g?.winner);
      if (w && leftId && w === leftId) winsLeft += 1;
      else if (w && rightId && w === rightId) winsRight += 1;
      else if (g?.winnerSide === "side1") winsLeft += 1;
      else if (g?.winnerSide === "side2") winsRight += 1;
      else {
        const a = Number(g?.scoresByTeam?.[0] ?? 0);
        const b = Number(g?.scoresByTeam?.[1] ?? 0);
        if (a > b) winsLeft += 1;
        else if (b > a) winsRight += 1;
      }
    }
  }

  if (!match.finalScore || typeof match.finalScore !== "object") {
    match.finalScore = {};
  }
  const fs = match.finalScore as Record<string, any>;
  const byId = fs.setsById && typeof fs.setsById === "object" ? fs.setsById : {};
  const hasGameWinners = winsLeft + winsRight > 0;
  if (hasGameWinners) {
    // Source of truth for displayed set score: completed game winners.
    fs.setsByTeam = [winsLeft, winsRight];
  } else if (!Array.isArray(fs.setsByTeam) || fs.setsByTeam.length < 2) {
    // Fallback only when winners are not available.
    const leftSets = leftId ? Number(byId[leftId] ?? 0) : 0;
    const rightSets = rightId ? Number(byId[rightId] ?? 0) : 0;
    fs.setsByTeam = [leftSets, rightSets];
  }

  // In simple tracking mode, hide detailed shot metadata and zero-filled shot stats
  // to keep payload semantically aligned with "score-only" tracking.
  if (match.shotTrackingMode === "simple") {
    if (match.statistics && typeof match.statistics === "object") {
      delete match.statistics.playerStats;
      if (Object.keys(match.statistics).length === 0) {
        delete match.statistics;
      }
    }
    delete match.playerStatsWithRatio;

    for (const g of games) {
      const shots = Array.isArray(g?.shots) ? g.shots : [];
      for (const shot of shots) {
        if (shot && typeof shot === "object") {
          delete shot.stroke;
          delete shot.serveType;
          delete shot.originX;
          delete shot.originY;
          delete shot.landingX;
          delete shot.landingY;
        }
      }
    }
  }

  if (view === "summary") {
    delete match.statistics;
    delete match.playerStatsWithRatio;
    delete match.serverConfig;
    delete match.scorer;
    delete match.tournament;
    delete match.__v;
    for (const g of games) {
      delete g.shots;
    }

    if (match.matchType === "singles") {
      delete match.teams;
      if (match.finalScore && typeof match.finalScore === "object") {
        delete match.finalScore.setsByTeam;
      }
      for (const g of games) {
        delete g.scoresByTeam;
        delete g.winnerTeamIndex;
      }
    }

    return stripRedundantIdAliases(match);
  } else if (view === "stats") {
    delete match.statistics;
    delete match.playerStatsWithRatio;
    delete match.scorer;
    if (match.tournament) {
      match.tournament = {
        _id: match.tournament._id,
        name: match.tournament.name,
      };
    }
    for (const g of games) {
      const shots = Array.isArray(g?.shots) ? g.shots : [];
      for (const shot of shots) {
        if (shot && typeof shot === "object") {
          shot.player = asId(shot.player);
          shot.server = shot.server ? asId(shot.server) : null;
        }
      }
    }
    delete match.__v;
    return stripRedundantIdAliases(match);
  } else if (view === "details") {
    // Keep detail payload rich but avoid redundant virtual blob.
    delete match.playerStatsWithRatio;
    delete match.__v;
    return stripRedundantIdAliases(match);
  }

  return match;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await context.params;
    const requestedView = (req.nextUrl.searchParams.get("view") || "details") as MatchView;
    const view: MatchView =
      requestedView === "summary" ||
      requestedView === "details" ||
      requestedView === "stats" ||
      requestedView === "legacy"
        ? requestedView
        : "details";
    const includeShotsParam = req.nextUrl.searchParams.get("includeShots");
    const includeShots =
      includeShotsParam != null
        ? includeShotsParam !== "0"
        : view === "summary"
          ? false
          : true;
    const includeTournament = view === "summary" || view === "stats" ? false : true;

    const matchDoc = await populateIndividualMatch(
      IndividualMatch.findById(id).select('+bracketPosition +roundName'),
      { includeTournament }
    ).exec();

    if (!matchDoc) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    const match = await applyShotsToLoadedMatch(matchDoc, "individual", includeShots);
    const normalized = normalizeForApi(match);
    return NextResponse.json({ match: normalizeIndividualMatchResponse(normalized, view) });
  } catch (error) {
    console.error("Error fetching individual match:", error);
    return NextResponse.json(
      { error: "Failed to fetch individual match" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;
    const body = await req.json();

    // Validate request body using Zod schema
    const validation = validateRequest(updateIndividualMatchSchema, body);
    if (!validation.success) {
      return validation.error;
    }

    const updateData = validation.data;

    // Fetch match to verify scorer authorization
    const existingMatch = await IndividualMatch.findById(id);
    if (!existingMatch) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    // Only scorer can update match
    const scorerId = existingMatch.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the scorer can update this match" },
        { status: 403 }
      );
    }

    const match = await populateIndividualMatchBasic(
      IndividualMatch.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      )
    ).exec();

    return NextResponse.json({
      match,
      message: "Individual match updated successfully",
    });
  } catch (error) {
    console.error("Error updating individual match:", error);
    return NextResponse.json(
      { error: "Failed to update individual match" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;

    const { id } = await context.params;

    // Fetch match to verify scorer authorization
    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json(
        { error: "Individual match not found" },
        { status: 404 }
      );
    }

    // Only scorer can delete match
    const scorerId = match.scorer?.toString();
    if (scorerId && scorerId !== auth.userId) {
      return NextResponse.json(
        { error: "Only the scorer can delete this match" },
        { status: 403 }
      );
    }

    await deleteAllPointsForIndividualMatch(id);
    await IndividualMatch.findByIdAndDelete(id);

    return NextResponse.json({
      message: "Individual match deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting individual match:", error);
    return NextResponse.json(
      { error: "Failed to delete individual match" },
      { status: 500 }
    );
  }
}
