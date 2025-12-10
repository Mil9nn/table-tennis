import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { withAuth } from "@/lib/api-utils";
import { SubMatch } from "@/types/match.type";
import { getNextServerForTeamMatch } from "@/services/match/serverCalculationService";
import { populateTeamMatch } from "@/services/match/populationService";
import { rateLimit } from "@/lib/rate-limit/middleware";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  // Rate limiting
  const { id, subMatchId } = await context.params;
  const rateLimitResponse = await rateLimit(req, "POST", `/api/matches/team/${id}/submatch/${subMatchId}/score`);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const auth = await withAuth(req);
    if (!auth.success) return auth.response;
    const body = await req.json();

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subMatchIdNum = parseInt(subMatchId);
    const subMatch = match.subMatches.find((sm: any) => sm.matchNumber === subMatchIdNum);
    if (!subMatch) {
      return NextResponse.json(
        { error: "SubMatch not found" },
        { status: 404 }
      );
    }

    const gameNumber = body.gameNumber || subMatch.games.length + 1;
    let currentGame = subMatch.games.find(
      (g: any) => g.gameNumber === gameNumber
    );

    if (!currentGame) {
      subMatch.games.push({
        gameNumber,
        team1Score: 0,
        team2Score: 0,
        shots: [],
        winnerSide: null,
        completed: false,
      });
      currentGame = subMatch.games[subMatch.games.length - 1];
    }

    const isDoubles = (subMatch as any).matchType === "doubles";
    const serverConfig = (subMatch as any).serverConfig || {};

    // Handle subtract action
    if (body.action === "subtract" && body.side) {
      if (body.side === "team1" && currentGame.team1Score > 0) {
        currentGame.team1Score -= 1;
      }
      if (body.side === "team2" && currentGame.team2Score > 0) {
        currentGame.team2Score -= 1;
      }

      const lastIndex = [...(currentGame.shots || [])]
        .reverse()
        .findIndex((s: any) => s.side === body.side);

      if (lastIndex !== -1) {
        currentGame.shots.splice(currentGame.shots.length - 1 - lastIndex, 1);
      }

      // ✅ Recompute server with NEW scores
      const serverResult = getNextServerForTeamMatch(
        currentGame.team1Score,
        currentGame.team2Score,
        isDoubles,
        serverConfig,
        gameNumber
      );
      (subMatch as any).currentServer = serverResult.server;
    } else {
      // Normal score update
      if (
        typeof body.team1Score === "number" &&
        typeof body.team2Score === "number"
      ) {
        // Validate: If score is increasing, shotData must be provided
        const scoreIncreased = 
          body.team1Score > currentGame.team1Score || 
          body.team2Score > currentGame.team2Score;
        
        if (scoreIncreased && (!body.shotData || !body.shotData.player)) {
          return NextResponse.json(
            { 
              error: "Shot data is required when incrementing score. Every point must have a recorded shot.",
              details: "Score increased but no shot was provided"
            },
            { status: 400 }
          );
        }

        currentGame.team1Score = body.team1Score;
        currentGame.team2Score = body.team2Score;

        // ✅ Compute next server with NEW scores
        const serverResult = getNextServerForTeamMatch(
          body.team1Score,
          body.team2Score,
          isDoubles,
          serverConfig,
          gameNumber
        );
        (subMatch as any).currentServer = serverResult.server;
      }
    }

    // Check if game is won
    const isGameWon =
      (currentGame.team1Score >= 11 || currentGame.team2Score >= 11) &&
      Math.abs(currentGame.team1Score - currentGame.team2Score) >= 2;

    if (isGameWon && !currentGame.winnerSide) {
      currentGame.winnerSide =
        currentGame.team1Score > currentGame.team2Score ? "team1" : "team2";
      currentGame.completed = true;

      if (!subMatch.finalScore)
        subMatch.finalScore = { team1Sets: 0, team2Sets: 0 };
      if (currentGame.winnerSide === "team1")
        subMatch.finalScore.team1Sets += 1;
      else subMatch.finalScore.team2Sets += 1;

      const setsNeeded = Math.ceil((subMatch.numberOfSets || 5) / 2);
      const isSubMatchWon =
        subMatch.finalScore.team1Sets >= setsNeeded ||
        subMatch.finalScore.team2Sets >= setsNeeded;

      if (isSubMatchWon) {
        subMatch.winnerSide =
          subMatch.finalScore.team1Sets >= setsNeeded ? "team1" : "team2";
        subMatch.status = "completed";
        subMatch.completed = true;

        if (subMatch.winnerSide === "team1") match.finalScore.team1Matches += 1;
        else match.finalScore.team2Matches += 1;

        const matchesNeeded = Math.ceil((match.numberOfSubMatches || match.subMatches.length) / 2);

        const isTeamMatchWon =
          match.finalScore.team1Matches >= matchesNeeded ||
          match.finalScore.team2Matches >= matchesNeeded;

        if (isTeamMatchWon) {
          match.status = "completed";
          match.winnerTeam =
            match.finalScore.team1Matches >= matchesNeeded
              ? "team1"
              : "team2";
        } else {
          const nextSubIndex = match.subMatches.findIndex(
            (sm: SubMatch) => !sm.completed
          );
          match.currentSubMatch =
            nextSubIndex !== -1 ? nextSubIndex + 1 : match.currentSubMatch;
        }
      } else {
        // ✅ Reset server for next game (0-0)
        const serverResult = getNextServerForTeamMatch(
          0,
          0,
          isDoubles,
          serverConfig,
          gameNumber + 1
        );
        (subMatch as any).currentServer = serverResult.server;
      }
    }

    // Add shot data if provided
    if (body.shotData?.player) {
      const shot = {
        shotNumber: (currentGame.shots?.length || 0) + 1,
        side: body.shotData.side,
        player: body.shotData.player,
        stroke: body.shotData.stroke || null,
        server: body.shotData.server || null,
        originX: body.shotData.originX,
        originY: body.shotData.originY,
        landingX: body.shotData.landingX,
        landingY: body.shotData.landingY,
        timestamp: new Date(),
      };
      currentGame.shots = currentGame.shots || [];
      currentGame.shots.push(shot);
    }

    match.markModified("subMatches");
    await match.save();

    const updatedMatch = await populateTeamMatch(
      TeamMatch.findById(match._id)
    ).exec();

    return NextResponse.json({
      match: updatedMatch,
      message:
        match.status === "completed"
          ? "Team match completed!"
          : "Score updated",
    });
  } catch (err: any) {
    console.error("[matches/team/[id]/submatch/[subMatchId]/score] Error:", err);
    return NextResponse.json(
      { 
        error: "Failed to update score",
        ...(process.env.NODE_ENV === "development" && { details: err.message })
      },
      { status: 500 }
    );
  }
}
