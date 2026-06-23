import { NextRequest, NextResponse } from "next/server";
import Tournament from "@/models/Tournament";
import TournamentIndividual from "@/models/TournamentIndividual";
import TournamentTeam from "@/models/TournamentTeam";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rate-limit/middleware";
import {
  requireAuth,
  loadTournament,
  jsonOk,
  jsonError,
  ApiError,
} from "@/lib/api";
import { connectDB } from "@/lib/mongodb";

const MAX_SCORERS = 10;

/**
 * Add a scorer to a tournament (organizer only)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    // Rate limit check
    const rateLimitResponse = await rateLimit(
      req,
      "POST",
      `/api/tournaments/${id}/scorers`
    );
    if (rateLimitResponse) return rateLimitResponse;

    const { userId: authUserId } = await requireAuth(req);
    const { userId } = await req.json();

    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const { tournament } = await loadTournament(id, authUserId, {
      requireOrganizer: true,
      skipConnect: true,
    });

    // Check if user exists
    const user = await User.findById(userId).select("_id username fullName");
    if (!user) {
      throw ApiError.notFound("User");
    }

    // Check if user is already the organizer
    if (tournament.organizer.toString() === userId) {
      throw ApiError.badRequest(
        "The organizer is already an admin and can score matches"
      );
    }

    // Check if user is already a scorer
    const isAlreadyScorer = tournament.scorers?.some(
      (scorerId: any) => scorerId.toString() === userId
    );
    if (isAlreadyScorer) {
      throw ApiError.badRequest("User is already a scorer for this tournament");
    }

    // Check max scorers limit
    if ((tournament.scorers?.length || 0) >= MAX_SCORERS) {
      throw ApiError.badRequest(
        `Maximum ${MAX_SCORERS} scorers allowed per tournament`
      );
    }

    // Use findByIdAndUpdate with $addToSet for atomic array update
    // This is more reliable than load + modify + save
    const mongoose = await import("mongoose");
    const scorerObjectId = new mongoose.Types.ObjectId(userId);
    
    // Determine which model to use based on tournament category
    const isTeamTournament = tournament.category === "team";
    const TournamentModel = isTeamTournament ? TournamentTeam : TournamentIndividual;
    
    // Build update operation
    // If scorers array doesn't exist, we need to set it first, otherwise use $addToSet
    const updateOperation: any = {};
    
    if (!tournament.scorers || tournament.scorers.length === 0) {
      // If array doesn't exist or is empty, set it directly
      updateOperation.$set = { scorers: [scorerObjectId] };
    } else {
      // If array exists, use $addToSet to add without duplicates
      updateOperation.$addToSet = { scorers: scorerObjectId };
    }
    
    const updatedTournament = await (TournamentModel as any).findByIdAndUpdate(
      id,
      updateOperation,
      { 
        new: true, // Return updated document
        runValidators: true
      }
    );
    
    if (!updatedTournament) {
      throw ApiError.notFound("Tournament");
    }

    // Reload tournament using the same model type to ensure consistency
    // Use loadTournament to get the correct model (TournamentIndividual or TournamentTeam)
    const { tournament: reloadedTournament } = await loadTournament(id, authUserId, {
      requireOrganizer: true,
      skipConnect: true,
      populateScorers: true,
    });

    return jsonOk({
      message: "Scorer added successfully",
      tournament: reloadedTournament,
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * Get scorers for a tournament
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await context.params;

    const tournament = await Tournament.findById(id)
      .select("organizer scorers")
      .populate("organizer", "username fullName profileImage")
      .populate("scorers", "username fullName profileImage");

    if (!tournament) {
      throw ApiError.notFound("Tournament");
    }

    return jsonOk({
      organizer: tournament.organizer,
      scorers: tournament.scorers || [],
      maxScorers: MAX_SCORERS,
    });
  } catch (error) {
    return jsonError(error);
  }
}
