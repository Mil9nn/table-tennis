import { NextRequest, NextResponse } from "next/server";
import IndividualMatch from "@/models/IndividualMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";
import {
  flipDoublesRotationForNextGame,
  getNextServer,
} from "@/components/live-scorer/individual/helpers";
import { statsService } from "@/services/statsService";
import Tournament from "@/models/Tournament";
import { calculateStandings } from "@/services/tournamentService";
import {
  advanceWinnerInBracket,
  isTournamentComplete,
} from "@/services/tournament/knockoutService";
import mongoose from "mongoose";
import { emitToMatchRoom } from "@/lib/socketEmitter";

/**
 * Update tournament standings and status after a match completes
 */
async function updateTournamentAfterMatch(match: any) {
  const tournament = await Tournament.findById(match.tournament);
  if (!tournament) {
    
    return;
  }

  

  // Check if this match is in the knockout bracket
  const isKnockoutMatch = tournament.bracket?.rounds?.some((round: any) =>
    round.matches.some((m: any) => m.matchId?.toString() === match._id.toString())
  );

  if (isKnockoutMatch) {
    
    await updateKnockoutBracket(tournament, match);
  } else if (tournament.format === "round_robin" || tournament.format === "multi_stage") {
    
    await updateRoundRobinStandings(tournament);
  } else if (tournament.format === "knockout") {
    // Pure knockout tournament
    await updateKnockoutBracket(tournament, match);
  }
}

/**
 * Update standings for Round Robin tournaments
 */
async function updateRoundRobinStandings(tournament: any) {
  

  const participantIds = tournament.participants.map((p: any) => p.toString());

  // CASE 1: Tournament with Groups
  if (tournament.useGroups && tournament.groups && tournament.groups.length > 0) {
    for (const group of tournament.groups) {
      // Fetch all matches for this group
      const groupMatchIds = group.rounds.flatMap((r: any) => r.matches);
      const matches = await IndividualMatch.find({
        _id: { $in: groupMatchIds },
      }).lean();

      // Calculate standings using ITTF rules
      const standingsData = calculateStandings(
        group.participants.map((p: any) => p.toString()),
        matches as any,
        tournament.rules
      );

      // Update group standings
      group.standings = standingsData.map((s) => ({
        participant: s.participant,
        played: s.played,
        won: s.won,
        lost: s.lost,
        drawn: s.drawn,
        setsWon: s.setsWon,
        setsLost: s.setsLost,
        setsDiff: s.setsDiff,
        pointsScored: s.pointsScored,
        pointsConceded: s.pointsConceded,
        pointsDiff: s.pointsDiff,
        points: s.points,
        rank: s.rank,
        form: s.form,
      }));

      
    }

    // Generate overall standings from group winners
    const advancePerGroup = tournament.advancePerGroup || 2;
    const qualifiers: any[] = [];

    tournament.groups.forEach((group: any) => {
      const topN = group.standings.slice(0, advancePerGroup);
      qualifiers.push(...topN);
    });

    tournament.standings = qualifiers.map((q: any, idx: number) => ({
      ...q,
      rank: idx + 1,
    }));

    
  }
  // CASE 2: Single Round Robin (no groups)
  else {
    const roundMatchIds = tournament.rounds.flatMap((r: any) => r.matches);
    const matches = await IndividualMatch.find({
      _id: { $in: roundMatchIds },
    }).lean();

    

    // Log first match structure for debugging
    if (matches.length > 0) {
      const firstMatch = matches[0];
      
    }

    const standingsData = calculateStandings(
      participantIds,
      matches as any,
      tournament.rules
    );

    

    tournament.standings = standingsData.map((s) => ({
      participant: s.participant,
      played: s.played,
      won: s.won,
      lost: s.lost,
      drawn: s.drawn,
      setsWon: s.setsWon,
      setsLost: s.setsLost,
      setsDiff: s.setsDiff,
      pointsScored: s.pointsScored,
      pointsConceded: s.pointsConceded,
      pointsDiff: s.pointsDiff,
      points: s.points,
      rank: s.rank,
      form: s.form,
      headToHead: s.headToHead ? Object.fromEntries(s.headToHead) : {},
    }));
  }

  // Check if all rounds are completed and update tournament status
  const allMatchIds = tournament.useGroups
    ? tournament.groups.flatMap((g: any) => g.rounds.flatMap((r: any) => r.matches))
    : tournament.rounds.flatMap((r: any) => r.matches);

  const matches = await IndividualMatch.find({
    _id: { $in: allMatchIds },
  });

  const allCompleted = matches.every((m: any) => m.status === "completed");
  const anyInProgress = matches.some((m: any) => m.status === "in_progress");

  if (allCompleted && tournament.status !== "completed") {
    tournament.status = "completed";
    
  } else if (anyInProgress && tournament.status === "upcoming") {
    tournament.status = "in_progress";
    
  }

  await tournament.save();
  
}

/**
 * Update knockout bracket and advance winner
 */
async function updateKnockoutBracket(tournament: any, match: any) {

  if (!tournament.bracket) {
    return;
  }

  // Find winner and loser from match
  const winnerId = match.winnerSide === "side1"
    ? match.participants[0]
    : match.participants[1];
  const loserId = match.winnerSide === "side1"
    ? match.participants[1]
    : match.participants[0];

  // Find the bracket match position for this match
  let bracketPosition: number | null = null;
  let currentRound: any = null;

  for (const round of tournament.bracket.rounds) {
    const bracketMatch = round.matches.find(
      (m: any) => m.matchId?.toString() === match._id.toString()
    );
    if (bracketMatch) {
      bracketPosition = bracketMatch.bracketPosition;
      currentRound = round;
      break;
    }
  }

  if (bracketPosition === null) {
    
    return;
  }

  

  // Update bracket with winner
  const updatedBracket = advanceWinnerInBracket(
    tournament.bracket,
    bracketPosition,
    new mongoose.Types.ObjectId(winnerId),
    new mongoose.Types.ObjectId(loserId)
  );

  tournament.bracket = updatedBracket;

  // Check if tournament is complete
  if (isTournamentComplete(updatedBracket)) {
    tournament.status = "completed";
    
    // Note: Standings are NOT updated - they remain frozen at round robin results
  } else if (tournament.status === "upcoming") {
    tournament.status = "in_progress";
    
  }

  // Create next round matches if current round is complete
  if (currentRound?.completed && currentRound.roundNumber < updatedBracket.rounds.length) {
    const nextRound = updatedBracket.rounds[currentRound.roundNumber];
   
    for (const bracketMatch of nextRound.matches) {
      // Skip if match already exists
      if (bracketMatch.matchId) continue;

      // Check if both participants are determined
      const p1Id = bracketMatch.participant1.participantId;
      const p2Id = bracketMatch.participant2.participantId;

      if (!p1Id || !p2Id) {
       
        continue;
      }

      // Create the match
      const newMatch = await IndividualMatch.create({
        tournament: tournament._id,
        matchCategory: "individual",
        matchType: tournament.matchType,
        numberOfSets: tournament.rules.setsPerMatch,
        participants: [p1Id, p2Id],
        status: "scheduled",
        games: [],
      });

      bracketMatch.matchId = newMatch._id;
    }
  }

  await tournament.save();
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const match = await IndividualMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can update
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can update the score" },
        { status: 403 }
      );
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { error: "Match is already completed" },
        { status: 400 }
      );
    }

    const gameNumber = Number(body.gameNumber ?? match.currentGame ?? 1);

    // Find or create current game
    let currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    if (!currentGame) {
      match.games.push({
        gameNumber,
        side1Score: 0,
        side2Score: 0,
        shots: [],
        winnerSide: null,
        completed: false,
      });
      currentGame = match.games.find((g: any) => g.gameNumber === gameNumber);
    }

    // Handle subtract action
    if (body.action === "subtract" && body.side) {
      if (body.side === "side1" && currentGame.side1Score > 0) {
        currentGame.side1Score -= 1;
      }
      if (body.side === "side2" && currentGame.side2Score > 0) {
        currentGame.side2Score -= 1;
      }

      // Remove last shot for that side
      const lastIndex = [...(currentGame.shots || [])]
        .reverse()
        .findIndex((s: any) => s.side === body.side);

      if (lastIndex !== -1) {
        currentGame.shots.splice(
          (currentGame.shots?.length || 0) - 1 - lastIndex,
          1
        );
      }

      // ✅ Compute server after subtraction
      const serverResult = getNextServer(
        currentGame.side1Score,
        currentGame.side2Score,
        match.matchType !== "singles",
        match.serverConfig || {},
        gameNumber
      );
      match.currentServer = serverResult.server as any;
    }

    // Handle normal score update
    if (
      typeof body.side1Score === "number" &&
      typeof body.side2Score === "number"
    ) {
      currentGame.side1Score = body.side1Score;
      currentGame.side2Score = body.side2Score;

      // ✅ Compute server after score update
      const serverResult = getNextServer(
        body.side1Score,
        body.side2Score,
        match.matchType !== "singles",
        match.serverConfig || {},
        gameNumber
      );
      match.currentServer = serverResult.server as any;

      // Emit server change event
      emitToMatchRoom(id, "server:change", {
        matchId: id,
        matchCategory: "individual",
        currentServer: match.currentServer,
        reason: "score_update",
        timestamp: new Date().toISOString(),
      });
    }

    // Check if game is won
    const isGameWon =
      (currentGame.side1Score >= 11 || currentGame.side2Score >= 11) &&
      Math.abs(currentGame.side1Score - currentGame.side2Score) >= 2;

    if (isGameWon && !currentGame.winnerSide) {
      currentGame.winnerSide =
        currentGame.side1Score > currentGame.side2Score ? "side1" : "side2";
      currentGame.completed = true;

      // Update set counts
      if (currentGame.winnerSide === "side1") {
        match.finalScore.side1Sets += 1;
      } else {
        match.finalScore.side2Sets += 1;
      }

      // Emit game completed event
      emitToMatchRoom(id, "game:completed", {
        matchId: id,
        matchCategory: "individual",
        gameNumber,
        winnerSide: currentGame.winnerSide,
        finalScore: {
          side1Score: currentGame.side1Score,
          side2Score: currentGame.side2Score,
        },
        newSetScore: {
          side1Sets: match.finalScore.side1Sets,
          side2Sets: match.finalScore.side2Sets,
        },
        timestamp: new Date().toISOString(),
      });

      // Check if match is won
      const setsNeeded = Math.ceil(match.numberOfSets / 2);
      const isMatchWon =
        match.finalScore.side1Sets >= setsNeeded ||
        match.finalScore.side2Sets >= setsNeeded;



      if (isMatchWon) {
        match.status = "completed";
        match.winnerSide =
          match.finalScore.side1Sets >= setsNeeded ? "side1" : "side2";
        match.matchDuration =
          Date.now() - (match.createdAt?.getTime() || Date.now());

        // Save match first before triggering dependent updates
        await match.save();

        // Emit match completed event
        emitToMatchRoom(id, "match:completed", {
          matchId: id,
          matchCategory: "individual",
          winnerSide: match.winnerSide,
          finalScore: {
            side1Sets: match.finalScore.side1Sets,
            side2Sets: match.finalScore.side2Sets,
          },
          timestamp: new Date().toISOString(),
        });

        

        // Trigger stats update when match completes
        try {
          await statsService.updateIndividualMatchStats(id);
        } catch (statsError) {
          console.error("Error updating stats:", statsError);
          // Don't fail the request if stats update fails
        }

        

        if (match.tournament) {
          try {
            
            await updateTournamentAfterMatch(match);
            
          } catch (tournamentError) {
            console.error("[SCORE] ❌ Error updating tournament:", tournamentError);
            // Don't fail the request if tournament update fails
          }
        } else {
          
        }
      } else {
        // Prepare next game
        match.currentGame = gameNumber + 1;

        if (match.matchType !== "singles") {
          // Ensure serverConfig object exists
          match.serverConfig = match.serverConfig || {};

          // Determine current server order
          let currentOrder = match.serverConfig.serverOrder;
          if (!Array.isArray(currentOrder) || currentOrder.length !== 4) {
            currentOrder = match.serverConfig.serverOrder || [];
          }

          // Flip rotation for next game
          if (Array.isArray(currentOrder) && currentOrder.length === 4) {
            const newOrder = flipDoublesRotationForNextGame(currentOrder);
            match.serverConfig.serverOrder = newOrder;
            match.currentServer = newOrder[0] || null;
          } else {
            match.currentServer = null;
          }
        } else {
          // ✅ Singles: compute server for next game (0-0)
          const serverResult = getNextServer(
            0,
            0,
            false,
            match.serverConfig || {},
            gameNumber + 1
          );
          match.currentServer = serverResult.server as any;
        }
      }
    }

    // Add shot data if provided
    if (body.shotData?.player && body.shotData?.stroke) {
      const shot = {
        shotNumber: (currentGame.shots?.length || 0) + 1,
        side: body.shotData.side,
        player: body.shotData.player,
        stroke: body.shotData.stroke,
        server: body.shotData.server || null,
        originX: body.shotData.originX,
        originY: body.shotData.originY,
        landingX: body.shotData.landingX,
        landingY: body.shotData.landingY,
        timestamp: new Date(),
      };

      currentGame.shots = currentGame.shots || [];
      currentGame.shots.push(shot);

      // Emit shot recorded event
      emitToMatchRoom(id, "shot:recorded", {
        matchId: id,
        matchCategory: "individual",
        gameNumber,
        shot,
        timestamp: new Date().toISOString(),
      });

      // Update statistics
      const stats = match.statistics || {};
      const playerId = body.shotData.player.toString();

      if (!stats.playerStats) stats.playerStats = new Map();
      if (!stats.playerStats.get(playerId)) {
        stats.playerStats.set(playerId, {
          detailedShots: {},
        });
      }

      const playerStats = stats.playerStats.get(playerId);

      match.statistics = stats;
      match.markModified("games");
      match.markModified("statistics");
    }

    // Save match if not already saved (when match completes, it's saved earlier to trigger tournament updates)
    if (match.status !== "completed") {
      await match.save();
    }

    // Emit score update event (for both completed and in-progress matches)
    emitToMatchRoom(id, "score:update", {
      matchId: id,
      matchCategory: "individual",
      gameNumber,
      side1Score: currentGame.side1Score,
      side2Score: currentGame.side2Score,
      currentServer: match.currentServer,
      finalScore: {
        side1Sets: match.finalScore.side1Sets,
        side2Sets: match.finalScore.side2Sets,
      },
      gameCompleted: currentGame.completed || false,
      gameWinner: currentGame.winnerSide || null,
      timestamp: new Date().toISOString(),
    });

    const updatedMatchDoc = await IndividualMatch.findById(match._id).populate([
      { path: "participants", select: "username fullName profileImage" },
      { path: "games.shots.player", select: "username fullName profileImage" },
    ]);

    // ✅ Convert to plain object safely and include all schema-defined fields
    const updatedMatch = updatedMatchDoc.toObject({
      virtuals: true,
      getters: true,
    });

    // ✅ Guarantee these keys exist even if null
    if (updatedMatch.currentServer === undefined) {
      updatedMatch.currentServer = updatedMatchDoc.currentServer ?? null;
    }
    if (updatedMatch.serverConfig === undefined) {
      updatedMatch.serverConfig = updatedMatchDoc.serverConfig ?? null;
    }

    return NextResponse.json({
      match: updatedMatch,
      message:
        match.status === "completed" ? "Match completed!" : "Score updated",
    });
  } catch (err) {
    console.error("Score update error:", err);
    return NextResponse.json(
      { error: "Failed to update score", details: (err as Error).message },
      { status: 500 }
    );
  }
}
