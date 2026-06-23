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
import Tournament from "@/models/Tournament";
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

    // CRITICAL: Deduplicate pairs by canonical player combination BEFORE saving
    // This prevents duplicate pairs (same players, different IDs) from being stored
    const uniquePairsMap = new Map<string, any>(); // Map: canonicalKey -> pairData
    
    for (const pair of pairs) {
      const player1Id = pair.player1?.toString() || '';
      const player2Id = pair.player2?.toString() || '';
      
      if (!player1Id || !player2Id) {
        continue; // Skip invalid pairs
      }
      
      // Create canonical key (order-independent player combination)
      const canonicalKey = player1Id < player2Id 
        ? `${player1Id}:${player2Id}` 
        : `${player2Id}:${player1Id}`;
      
      // Only keep the first occurrence of each canonical pair
      if (!uniquePairsMap.has(canonicalKey)) {
        const pairData: any = {
          player1: new mongoose.Types.ObjectId(player1Id),
          player2: new mongoose.Types.ObjectId(player2Id),
        };
        
        // Preserve _id if it exists and is a valid ObjectId
        if (pair._id && mongoose.Types.ObjectId.isValid(pair._id)) {
          // Only preserve if it's not a temporary ID (starting with 'pair-')
          const pairIdStr = pair._id.toString();
          if (!pairIdStr.startsWith('pair-')) {
            pairData._id = new mongoose.Types.ObjectId(pair._id);
          }
        }
        
        uniquePairsMap.set(canonicalKey, pairData);
      } else {
        console.warn(`[doubles-pairs] Duplicate pair detected (same players, different ID): ${canonicalKey}, skipping`);
      }
    }
    
    const doublesPairsData = Array.from(uniquePairsMap.values());
    
    // Validate we have the expected number of unique pairs
    const expectedPairs = participantIds.length / 2;
    if (doublesPairsData.length !== expectedPairs) {
      throw ApiError.badRequest(
        `Expected ${expectedPairs} unique pairs for ${participantIds.length} participants, but found ${doublesPairsData.length} after deduplication. This suggests duplicate pairs were provided.`
      );
    }

    // Update tournament doubles pairs
    (tournament as any).doublesPairs = doublesPairsData;
    (tournament as any).markModified("doublesPairs");
    
    
    
    await tournament.save();
    
    // Reload tournament to get the saved pairs with their _id values
    const savedTournament = await Tournament.findById(id);

    // Use the saved tournament's pairs (they have proper _id values from database)
    const savedPairs = savedTournament ? (savedTournament as any).doublesPairs || [] : (tournament as any).doublesPairs || [];
    
    // Manually populate doubles pairs for response
    const playerIds = savedPairs.flatMap((pair: any) => [
      pair.player1,
      pair.player2,
    ]);
    const users = await User.find({ _id: { $in: playerIds } }).select(
      "username fullName profileImage"
    );
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const populatedPairs = savedPairs.map((pair: any) => ({
      _id: pair._id?.toString() || pair._id,
      player1: userMap.get(pair.player1?.toString() || pair.player1),
      player2: userMap.get(pair.player2?.toString() || pair.player2),
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
