// Create this file: app/api/matches/team/[matchId]/submatch/[submatchNumber]/score/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TeamMatch from "@/models/TeamMatch";

export async function POST(
  req: Request,
  context: { params: Promise<{ matchId: string; submatchNumber: string }> }
) {
  await connectDB();

  try {
    const body = await req.json();
    const { matchId, submatchNumber } = await context.params;
    const { gameNumber, side1Score, side2Score, gameWinner, shotData, action, side } = body;

    const teamMatch = await TeamMatch.findById(matchId);
    if (!teamMatch) {
      return NextResponse.json({ error: "Team match not found" }, { status: 404 });
    }

    const index = parseInt(submatchNumber) - 1;
    const subMatch = teamMatch.subMatches[index];
    
    if (!subMatch) {
      return NextResponse.json({ error: "Submatch not found" }, { status: 404 });
    }

    // Handle subtract action
    if (action === "subtract") {
      const game = subMatch.games?.find((g: any) => g.gameNumber === gameNumber);
      if (game) {
        if (side === "side1" && game.side1Score > 0) {
          game.side1Score -= 1;
          
          // Remove last shot if exists
          if (game.shots && game.shots.length > 0) {
            game.shots.pop();
          }
        } else if (side === "side2" && game.side2Score > 0) {
          game.side2Score -= 1;
          
          if (game.shots && game.shots.length > 0) {
            game.shots.pop();
          }
        }
      }
      
      await teamMatch.save();
      return NextResponse.json({ success: true, match: teamMatch });
    }

    // Find or create game
    let game = subMatch.games?.find((g: any) => g.gameNumber === gameNumber);
    
    if (!game) {
      if (!subMatch.games) subMatch.games = [];
      game = {
        gameNumber,
        side1Score: 0,
        side2Score: 0,
        shots: [],
        winnerSide: null,
      };
      subMatch.games.push(game);
    }

    // Update scores
    game.side1Score = side1Score;
    game.side2Score = side2Score;

    // Add shot data if provided
    if (shotData) {
      if (!game.shots) game.shots = [];
      game.shots.push({
        side: shotData.side,
        player: shotData.player,
        stroke: shotData.stroke,
        outcome: shotData.outcome,
        errorType: shotData.errorType,
        server: shotData.server,
        timestamp: new Date(),
      });
    }

    // Handle game winner
    if (gameWinner) {
      game.winnerSide = gameWinner;
      
      // Update set counts
      if (gameWinner === "side1") {
        subMatch.team1Sets = (subMatch.team1Sets || 0) + 1;
      } else {
        subMatch.team2Sets = (subMatch.team2Sets || 0) + 1;
      }

      // Check if submatch is won
      const setsNeeded = Math.ceil((teamMatch.numberOfSetsPerSubMatch || 3) / 2);
      
      if (subMatch.team1Sets >= setsNeeded || subMatch.team2Sets >= setsNeeded) {
        subMatch.completed = true;
        subMatch.winnerSide = subMatch.team1Sets > subMatch.team2Sets ? "team1" : "team2";
        
        // Update team match totals
        if (subMatch.winnerSide === "team1") {
          teamMatch.finalScore.team1Matches += 1;
        } else {
          teamMatch.finalScore.team2Matches += 1;
        }

        // Move to next submatch
        teamMatch.currentSubMatch = index + 2;

        // Check if overall match is complete
        const totalSubmatches = teamMatch.subMatches.length;
        const majority = Math.ceil(totalSubmatches / 2);

        if (
          teamMatch.finalScore.team1Matches >= majority ||
          teamMatch.finalScore.team2Matches >= majority
        ) {
          teamMatch.status = "completed";
          teamMatch.winnerTeam =
            teamMatch.finalScore.team1Matches > teamMatch.finalScore.team2Matches
              ? "team1"
              : "team2";
        }
      } else {
        // Move to next game in same submatch
        subMatch.currentGame = gameNumber + 1;
      }
    }

    await teamMatch.save();

    // Populate before returning
    await teamMatch.populate([
      {
        path: "team1",
        select: "name players assignments",
        populate: { path: "players.user", select: "username fullName profileImage _id" },
      },
      {
        path: "team2",
        select: "name players assignments",
        populate: { path: "players.user", select: "username fullName profileImage _id" },
      },
      { path: "scorer", select: "username fullName profileImage _id" },
    ]);

    return NextResponse.json({ success: true, match: teamMatch });
  } catch (err: any) {
    console.error("Error updating submatch score:", err);
    return NextResponse.json(
      { error: "Failed to update submatch score" },
      { status: 500 }
    );
  }
}