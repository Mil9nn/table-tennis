import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import { SubMatch } from "@/types/match.type";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; subMatchId: string }> }
) {
  try {
    await connectDB();
    const { id, subMatchId } = await context.params;
    const body = await req.json();

    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const subMatch = match.subMatches.id(subMatchId);
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

    // ✅ Helper: compute next server using the SAME logic as individual
    const computeNextServer = (
      t1Score: number,
      t2Score: number,
      gameNum: number
    ): string => {
      const totalPoints = t1Score + t2Score;
      const isDeuce = t1Score >= 10 && t2Score >= 10;

      if (isDoubles) {
        // Use rotation array
        const rotation = serverConfig.serverOrder || [
          "team1_main",
          "team2_main",
          "team1_partner",
          "team2_partner",
        ];

        const serveCycle = Math.floor(totalPoints / 2);
        const serverIndex = serveCycle % rotation.length;
        return rotation[serverIndex];
      } else {
        // Singles
        if (isDeuce) {
          return totalPoints % 2 === 0
            ? serverConfig.firstServer || "team1"
            : serverConfig.firstServer === "team1"
            ? "team2"
            : "team1";
        }

        const serveCycle = Math.floor(totalPoints / 2);
        const servers =
          serverConfig.firstServer === "team1"
            ? ["team1", "team2"]
            : ["team2", "team1"];
        return servers[serveCycle % 2];
      }
    };

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
      (subMatch as any).currentServer = computeNextServer(
        currentGame.team1Score,
        currentGame.team2Score,
        gameNumber
      );
    } else {
      // Normal score update
      if (
        typeof body.team1Score === "number" &&
        typeof body.team2Score === "number"
      ) {
        currentGame.team1Score = body.team1Score;
        currentGame.team2Score = body.team2Score;

        // ✅ Compute next server with NEW scores
        (subMatch as any).currentServer = computeNextServer(
          body.team1Score,
          body.team2Score,
          gameNumber
        );
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
        (subMatch as any).currentServer = computeNextServer(
          0,
          0,
          gameNumber + 1
        );
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
        timestamp: new Date(),
      };
      currentGame.shots = currentGame.shots || [];
      currentGame.shots.push(shot);
    }

    match.markModified("subMatches");
    await match.save();

    const updatedMatch = await TeamMatch.findById(match._id)
      .populate("scorer", "username fullName profileImage")
      .populate("team1.captain team2.captain", "username fullName profileImage")
      .populate(
        "team1.players.user team2.players.user",
        "username fullName profileImage"
      )
      .populate(
        "subMatches.playerTeam1 subMatches.playerTeam2",
        "username fullName profileImage"
      )
      .populate(
        "subMatches.games.shots.player",
        "username fullName profileImage"
      );

    return NextResponse.json({
      match: updatedMatch,
      message:
        match.status === "completed"
          ? "Team match completed!"
          : "Score updated",
    });
  } catch (err) {
    console.error("SubMatch score update error:", err);
    return NextResponse.json(
      { error: "Failed to update score", details: (err as Error).message },
      { status: 500 }
    );
  }
}
