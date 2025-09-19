// app/api/matches/[id]/score/route.ts
import { NextRequest, NextResponse } from "next/server";
import Match from "@/models/Match";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Missing match id" }, { status: 400 });

    const match = await Match.findById(id);
    if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

    const side1Score = Number(body.side1Score ?? body.player1Score ?? 0);
    const side2Score = Number(body.side2Score ?? body.player2Score ?? 0);
    const { tieNumber, gameNumber = 1, shotData, gameWinner } = body;

    let currentGame: any;

    // 🏓 TEAM MATCH: update inside ties[tieNumber].games[]
    if (match.matchCategory === "team" && tieNumber) {
      const tieIndex = Number(tieNumber) - 1;
      const tie = match.ties?.[tieIndex];
      if (!tie) {
        return NextResponse.json({ error: "Invalid tie number" }, { status: 400 });
      }

      currentGame = tie.games.find((g: any) => Number(g.gameNumber) === Number(gameNumber));
      if (!currentGame) {
        currentGame = {
          gameNumber: Number(gameNumber),
          side1Score: 0,
          side2Score: 0,
          shots: [],
          startTime: new Date(),
        };

        if (body.currentPlayers) {
          const cp = body.currentPlayers;
          currentGame.participants = {
            team1: cp.team1 ?? [],
            team2: cp.team2 ?? [],
          };
        }

        tie.games.push(currentGame);
      }

      currentGame.side1Score = side1Score;
      currentGame.side2Score = side2Score;

      // optional update of participants
      if (body.currentPlayers) {
        const cp = body.currentPlayers;
        currentGame.participants = {
          team1: cp.team1 ?? currentGame.participants?.team1 ?? [],
          team2: cp.team2 ?? currentGame.participants?.team2 ?? [],
        };
      }

    } else {
      // 👤 INDIVIDUAL MATCH: update inside match.games[]
      currentGame = match.games.find((g: any) => Number(g.gameNumber) === Number(gameNumber));
      if (!currentGame) {
        currentGame = {
          gameNumber: Number(gameNumber),
          side1Score: 0,
          side2Score: 0,
          shots: [],
          startTime: new Date(),
        };

        if (body.currentPlayers) {
          const cp = body.currentPlayers;
          currentGame.currentPlayers = {
            side1: cp.side1 ?? cp.player1 ?? cp.team1 ?? "",
            side2: cp.side2 ?? cp.player2 ?? cp.team2 ?? "",
          };
        }

        match.games.push(currentGame);
      }

      currentGame.side1Score = side1Score;
      currentGame.side2Score = side2Score;

      if (body.currentPlayers) {
        const cp = body.currentPlayers;
        currentGame.currentPlayers = {
          side1: cp.side1 ?? currentGame.currentPlayers?.side1 ?? "",
          side2: cp.side2 ?? currentGame.currentPlayers?.side2 ?? "",
        };
      }
    }

    // 🎯 SHOT TRACKING
    if (shotData) {
      const shotEntry: any = {
        shotNumber: (currentGame.shots?.length ?? 0) + 1,
        side:
          shotData.side ??
          (shotData.player === "player1" ? "side1" : shotData.player === "player2" ? "side2" : undefined),
        player: shotData.playerId ?? shotData.playerUserId ?? null,
        shotType: shotData.shotType ?? "unknown",
        result: shotData.result ?? "in_play",
        timestamp: shotData.timestamp ? new Date(shotData.timestamp) : new Date(),
      };
      if (shotData.playerName) shotEntry.playerName = shotData.playerName;

      currentGame.shots.push(shotEntry);

      match.statistics.totalShots = (match.statistics.totalShots || 0) + 1;

      const playerKey = shotData.playerId?.toString() || shotData.playerName || shotEntry.side;
      if (playerKey) {
        if (!match.statistics.playerStats) match.statistics.playerStats = new Map();
        if (!match.statistics.playerStats.get(playerKey)) {
          match.statistics.playerStats.set(playerKey, {
            winners: 0,
            unForcedErrors: 0,
            aces: 0,
            detailedShots: {},
          });
        }
        const stats = match.statistics.playerStats.get(playerKey);

        if (shotData.shotType) {
          stats.detailedShots[shotData.shotType] =
            (stats.detailedShots[shotData.shotType] || 0) + 1;
        }
        if (shotData.result === "winner") stats.winners++;
        if (shotData.result === "unforcedError") stats.unforcedError++;
        if (shotData.shotType === "serve_point") stats.aces++;

        match.statistics.playerStats.set(playerKey, stats);
      }
    }

    // 🏆 HANDLE GAME WINNER
    if (gameWinner && !currentGame.winner) {
      let normalizedWinner: "side1" | "side2" | null = null;
      const gw = String(gameWinner).toLowerCase();
      if (["player1", "side1", "team1"].includes(gw)) normalizedWinner = "side1";
      if (["player2", "side2", "team2"].includes(gw)) normalizedWinner = "side2";

      currentGame.winner = normalizedWinner;
      currentGame.endTime = new Date();
      currentGame.duration = currentGame.startTime
        ? Math.floor((+currentGame.endTime - +currentGame.startTime) / 1000)
        : undefined;

      if (normalizedWinner === "side1") match.finalScore.side1Sets++;
      if (normalizedWinner === "side2") match.finalScore.side2Sets++;

      const setsToWin = Math.ceil((match.numberOfSets ?? 3) / 2);
      if (match.finalScore.side1Sets >= setsToWin) {
        match.winner = "side1";
        match.status = "completed";
      } else if (match.finalScore.side2Sets >= setsToWin) {
        match.winner = "side2";
        match.status = "completed";
      }
    }

    // ⏱️ MATCH DURATION
    if (match.status === "completed") {
      const allGames =
        match.matchCategory === "team"
          ? match.ties.flatMap((t: any) => t.games)
          : match.games;

      if (allGames.length > 0) {
        const firstGame = allGames[0];
        const lastGame = allGames[allGames.length - 1];
        if (firstGame.startTime && lastGame.endTime) {
          match.matchDuration = Math.floor((+lastGame.endTime - +firstGame.startTime) / 1000);
        }
      }
    }

    await match.save();
    await match.populate([
      { path: "scorer", select: "username fullName" },
      { path: "participants", select: "username fullName" },
      { path: "team1", populate: { path: "players.user", select: "username fullName" } },
      { path: "team2", populate: { path: "players.user", select: "username fullName" } },
    ]);

    return NextResponse.json({ match, message: "Score updated successfully" });
  } catch (error) {
    console.error("Error updating score:", error);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
