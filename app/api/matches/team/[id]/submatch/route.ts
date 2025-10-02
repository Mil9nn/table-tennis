// import { NextRequest, NextResponse } from "next/server";
// import TeamMatch from "@/models/TeamMatch";
// import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
// import { connectDB } from "@/lib/mongodb";

// export async function POST(
//   request: NextRequest,
//   context: { params: Promise<{ id: string }> }
// ) {
//   try {
//     await connectDB();
//     const { id } = await context.params;
//     const body = await request.json();

//     // Auth check
//     const token = getTokenFromRequest(request);
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const decoded = verifyToken(token);
//     if (!decoded) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const match = await TeamMatch.findById(id);
//     if (!match) {
//       return NextResponse.json({ error: "Match not found" }, { status: 404 });
//     }

//     // Only scorer can update
//     if (match.scorer?.toString() !== decoded.userId) {
//       return NextResponse.json(
//         { error: "Forbidden: only the assigned scorer can update" },
//         { status: 403 }
//       );
//     }

//     const { subMatchNumber, side1Score, side2Score, gameNumber = 1 } = body;

//     // Find the submatch
//     const subMatch = match.subMatches.find(
//       (sm: any) => sm.subMatchNumber === subMatchNumber
//     );

//     if (!subMatch) {
//       return NextResponse.json(
//         { error: "SubMatch not found" },
//         { status: 404 }
//       );
//     }

//     // Find or create current game
//     let currentGame = subMatch.games.find(
//       (g: any) => g.gameNumber === gameNumber
//     );

//     if (!currentGame) {
//       subMatch.games.push({
//         gameNumber,
//         team1Score: 0,
//         team2Score: 0,
//         shots: [],
//         winnerSide: null,
//         completed: false,
//       });
//       currentGame = subMatch.games.find(
//         (g: any) => g.gameNumber === gameNumber
//       );
//     }

//     // Update scores
//     if (typeof side1Score === "number") {
//       currentGame.team1Score = side1Score;
//     }
//     if (typeof side2Score === "number") {
//       currentGame.team2Score = side2Score;
//     }

//     // Check if game is won
//     const isGameWon =
//       (currentGame.team1Score >= 11 || currentGame.team2Score >= 11) &&
//       Math.abs(currentGame.team1Score - currentGame.team2Score) >= 2;

//     if (isGameWon && !currentGame.winnerSide) {
//       currentGame.winnerSide =
//         currentGame.team1Score > currentGame.team2Score ? "team1" : "team2";
//       currentGame.completed = true;

//       // Update set counts
//       if (currentGame.winnerSide === "team1") {
//         subMatch.finalScore.team1Sets += 1;
//       } else {
//         subMatch.finalScore.team2Sets += 1;
//       }

//       // Check if submatch is won
//       const setsNeeded = Math.ceil(match.numberOfSetsPerSubMatch / 2);
//       const isSubMatchWon =
//         subMatch.finalScore.team1Sets >= setsNeeded ||
//         subMatch.finalScore.team2Sets >= setsNeeded;

//       if (isSubMatchWon) {
//         subMatch.completed = true;
//         subMatch.winnerSide =
//           subMatch.finalScore.team1Sets >= setsNeeded ? "team1" : "team2";

//         // Update overall match score
//         if (subMatch.winnerSide === "team1") {
//           match.finalScore.team1Matches += 1;
//         } else {
//           match.finalScore.team2Matches += 1;
//         }

//         // Check if team match is won
//         const totalSubMatches = match.subMatches.length;
//         const matchesNeeded = Math.ceil(totalSubMatches / 2);

//         if (
//           match.finalScore.team1Matches >= matchesNeeded ||
//           match.finalScore.team2Matches >= matchesNeeded
//         ) {
//           match.status = "completed";
//           match.winnerTeam =
//             match.finalScore.team1Matches >= matchesNeeded
//               ? "team1"
//               : "team2";
//         }
//       } else {
//         // Prepare next game
//         subMatch.currentGame = gameNumber + 1;
//       }
//     }

//     match.markModified("subMatches");
//     await match.save();

//     await match.populate([
//       { path: "team1.players", select: "username fullName" },
//       { path: "team2.players", select: "username fullName" },
//     ]);

//     return NextResponse.json({
//       match,
//       message: match.status === "completed" ? "Match completed!" : "Score updated",
//     });
//   } catch (err) {
//     console.error("SubMatch score update error:", err);
//     return NextResponse.json(
//       { error: "Failed to update score", details: (err as Error).message },
//       { status: 500 }
//     );
//   }
// }

// app/api/matches/team/[id]/submatch/route.ts
import { NextRequest, NextResponse } from "next/server";
import TeamMatch from "@/models/TeamMatch";
import { getTokenFromRequest, verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/mongodb";

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

    const match = await TeamMatch.findById(id);
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Only scorer can update
    if (match.scorer?.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "Forbidden: only the assigned scorer can update" },
        { status: 403 }
      );
    }

    const { subMatchNumber, side1Score, side2Score, gameNumber = 1 } = body;

    // Find the submatch
    const subMatch = match.subMatches.find(
      (sm: any) => sm.subMatchNumber === subMatchNumber
    );

    if (!subMatch) {
      return NextResponse.json(
        { error: "SubMatch not found" },
        { status: 404 }
      );
    }

    // Find or create current game
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
      currentGame = subMatch.games.find(
        (g: any) => g.gameNumber === gameNumber
      );
    }

    // Update scores
    if (typeof side1Score === "number") {
      currentGame.team1Score = side1Score;
    }
    if (typeof side2Score === "number") {
      currentGame.team2Score = side2Score;
    }

    // Check if game is won
    const isGameWon =
      (currentGame.team1Score >= 11 || currentGame.team2Score >= 11) &&
      Math.abs(currentGame.team1Score - currentGame.team2Score) >= 2;

    if (isGameWon && !currentGame.winnerSide) {
      currentGame.winnerSide =
        currentGame.team1Score > currentGame.team2Score ? "team1" : "team2";
      currentGame.completed = true;

      // Update set counts
      if (currentGame.winnerSide === "team1") {
        subMatch.finalScore.team1Sets += 1;
      } else {
        subMatch.finalScore.team2Sets += 1;
      }

      // Check if submatch is won
      const setsNeeded = Math.ceil(match.numberOfSetsPerSubMatch / 2);
      const isSubMatchWon =
        subMatch.finalScore.team1Sets >= setsNeeded ||
        subMatch.finalScore.team2Sets >= setsNeeded;

      if (isSubMatchWon) {
        subMatch.completed = true;
        subMatch.winnerSide =
          subMatch.finalScore.team1Sets >= setsNeeded ? "team1" : "team2";

        // Update overall match score
        if (subMatch.winnerSide === "team1") {
          match.finalScore.team1Matches += 1;
        } else {
          match.finalScore.team2Matches += 1;
        }

        // Check if team match is won
        const totalSubMatches = match.subMatches.length;
        const matchesNeeded = Math.ceil(totalSubMatches / 2);

        if (
          match.finalScore.team1Matches >= matchesNeeded ||
          match.finalScore.team2Matches >= matchesNeeded
        ) {
          match.status = "completed";
          match.winnerTeam =
            match.finalScore.team1Matches >= matchesNeeded
              ? "team1"
              : "team2";
        }
      } else {
        // Prepare next game
        subMatch.currentGame = gameNumber + 1;
      }
    }

    match.markModified("subMatches");
    await match.save();

    await match.populate([
      { path: "team1.players", select: "username fullName" },
      { path: "team2.players", select: "username fullName" },
    ]);

    return NextResponse.json({
      match,
      message: match.status === "completed" ? "Match completed!" : "Score updated",
    });
  } catch (err) {
    console.error("SubMatch score update error:", err);
    return NextResponse.json(
      { error: "Failed to update score", details: (err as Error).message },
      { status: 500 }
    );
  }
}