import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
  ApiError,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";

/**
 * GET: Retrieve doubles pairs for a tournament
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await requireAuth(req);
    const { id } = await context.params;

    const { tournament } = await loadTournament(id, userId, {
      skipConnect: true,
    });

    // Validate this is a doubles tournament
    const matchType = (tournament as any).matchType;
    if (matchType !== "doubles") {
      throw ApiError.badRequest("This endpoint is only for doubles tournaments");
    }

    const doublesPairs = (tournament as any).doublesPairs || [];

    // Manually populate player details if pairs exist
    if (doublesPairs.length > 0) {
      const playerIds = doublesPairs.flatMap((pair: any) => [
        pair.player1,
        pair.player2,
      ]);
      const users = await User.find({ _id: { $in: playerIds } }).select(
        "username fullName profileImage"
      );

      // Create a map for quick lookup
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));

      // Populate the pairs
      const populatedPairs = doublesPairs.map((pair: any) => ({
        _id: pair._id,
        player1: userMap.get(pair.player1.toString()),
        player2: userMap.get(pair.player2.toString()),
      }));

      return jsonOk({
        pairs: populatedPairs,
        message: `Retrieved ${populatedPairs.length} pairs`,
      });
    }

    return jsonOk({
      pairs: doublesPairs,
      message: `Retrieved ${doublesPairs.length} pairs`,
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST: Save/update doubles pairs for a tournament
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { userId } = await requireAuth(req);
    const { id } = await context.params;

    const { tournament } = await loadTournament(id, userId, {
      requireOrganizer: true,
      skipConnect: true,
    });

    // Validate this is a doubles tournament
    const matchType = (tournament as any).matchType;
    if (matchType !== "doubles") {
      throw ApiError.badRequest("This endpoint is only for doubles tournaments");
    }

    // Validate draw not generated
    if (tournament.drawGenerated) {
      throw ApiError.badRequest(
        "Cannot modify pairs after draw has been generated"
      );
    }

    const { pairs } = await req.json();

    if (!Array.isArray(pairs)) {
      throw ApiError.badRequest("Pairs must be an array");
    }

    // Validate pairs structure
    for (const pair of pairs) {
      if (!pair.player1 || !pair.player2) {
        throw ApiError.badRequest("Each pair must have player1 and player2");
      }

      // Validate both players are valid ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(pair.player1) ||
        !mongoose.Types.ObjectId.isValid(pair.player2)
      ) {
        throw ApiError.badRequest("Invalid player ID format");
      }
    }

    // Get all participant IDs as strings for comparison
    const participantIds = tournament.participants.map((p: any) => p.toString());

    // Validate all players exist in tournament participants
    const allPlayerIds = pairs.flatMap((p) => [p.player1, p.player2]);
    for (const playerId of allPlayerIds) {
      if (!participantIds.includes(playerId)) {
        throw ApiError.badRequest(
          `Player ${playerId} is not a participant in this tournament`
        );
      }
    }

    // Validate each player appears exactly once
    const playerCounts = new Map<string, number>();
    for (const playerId of allPlayerIds) {
      playerCounts.set(playerId, (playerCounts.get(playerId) || 0) + 1);
    }

    for (const [playerId, count] of playerCounts.entries()) {
      if (count > 1) {
        const player = await User.findById(playerId).select("username fullName");
        const playerName = player?.fullName || player?.username || playerId;
        throw ApiError.badRequest(
          `Player "${playerName}" appears in multiple pairs`
        );
      }
    }

    // Validate all participants are paired (must be even number and all paired)
    if (pairs.length * 2 !== participantIds.length) {
      throw ApiError.badRequest(
        `Expected ${participantIds.length / 2} pairs for ${participantIds.length} participants, got ${pairs.length}`
      );
    }

    // Convert pairs to the format expected by the schema
    const doublesPairsData = pairs.map((pair) => ({
      player1: new mongoose.Types.ObjectId(pair.player1),
      player2: new mongoose.Types.ObjectId(pair.player2),
    }));

    // Update tournament doubles pairs
    (tournament as any).doublesPairs = doublesPairsData;
    (tournament as any).markModified("doublesPairs");
    await tournament.save();

    // Reload and populate for response
    await (tournament as any).populate("organizer");
    await (tournament as any).populate("participants");

    // Manually populate doubles pairs for response
    const playerIds = doublesPairsData.flatMap((pair) => [
      pair.player1,
      pair.player2,
    ]);
    const users = await User.find({ _id: { $in: playerIds } }).select(
      "username fullName profileImage"
    );
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const populatedPairs = doublesPairsData.map((pair, index) => ({
      _id: (tournament as any).doublesPairs[index]._id,
      player1: userMap.get(pair.player1.toString()),
      player2: userMap.get(pair.player2.toString()),
    }));

    return jsonOk({
      message: "Doubles pairs saved successfully",
      pairs: populatedPairs,
      tournament,
    });
  } catch (error) {
    return jsonError(error);
  }
}
