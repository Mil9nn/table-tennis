/**
 * Script to clean up matches with invalid tournament references
 * Run with: npx tsx scripts/cleanup-invalid-tournaments.ts
 */

import mongoose from "mongoose";
import IndividualMatch from "../models/IndividualMatch";
import TeamMatch from "../models/TeamMatch";
import Tournament from "../models/Tournament";
import { connectDB } from "../lib/mongodb";

async function cleanupInvalidTournaments() {
  try {
    console.log("Connecting to database...");
    await connectDB();

    // Ensure Tournament model is registered
    Tournament;

    // Find all individual matches with tournament references
    const individualMatches = await IndividualMatch.find({
      tournament: { $ne: null },
    });

    console.log(
      `Found ${individualMatches.length} individual matches with tournament references`
    );

    let invalidIndividualCount = 0;

    for (const match of individualMatches) {
      // Check if tournament actually exists
      const tournamentExists = await Tournament.findById(match.tournament);

      if (!tournamentExists) {
        console.log(
          `Match ${match._id} references non-existent tournament ${match.tournament}`
        );
        // Set tournament to null
        await IndividualMatch.updateOne(
          { _id: match._id },
          { $set: { tournament: null } }
        );
        invalidIndividualCount++;
      }
    }

    // Find all team matches with tournament references
    const teamMatches = await TeamMatch.find({
      tournament: { $ne: null },
    });

    console.log(
      `Found ${teamMatches.length} team matches with tournament references`
    );

    let invalidTeamCount = 0;

    for (const match of teamMatches) {
      // Check if tournament actually exists
      const tournamentExists = await Tournament.findById(match.tournament);

      if (!tournamentExists) {
        console.log(
          `Team match ${match._id} references non-existent tournament ${match.tournament}`
        );
        // Set tournament to null
        await TeamMatch.updateOne(
          { _id: match._id },
          { $set: { tournament: null } }
        );
        invalidTeamCount++;
      }
    }

    console.log("\n=== Cleanup Complete ===");
    console.log(
      `Fixed ${invalidIndividualCount} individual matches with invalid tournament references`
    );
    console.log(
      `Fixed ${invalidTeamCount} team matches with invalid tournament references`
    );
    console.log(
      `Total fixed: ${invalidIndividualCount + invalidTeamCount} matches`
    );

    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanupInvalidTournaments();
