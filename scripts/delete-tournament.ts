/**
 * Script to delete a seeded tournament and all its related matches
 * 
 * Usage: npx tsx scripts/delete-tournament.ts
 */

// Load environment variables first - MUST be before any other imports
const dotenv = require("dotenv");
const path = require("path");

// Load .env files from project root
const projectRoot = process.cwd();
const envLocalPath = path.resolve(projectRoot, ".env.local");
const envPath = path.resolve(projectRoot, ".env");

// Try .env.local first, then fallback to .env
dotenv.config({ path: envLocalPath });
dotenv.config({ path: envPath });

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Connect directly to MongoDB without going through env validation
import mongoose from "mongoose";

// Now import models
import TournamentIndividual from "../models/TournamentIndividual";
import TournamentTeam from "../models/TournamentTeam";
import IndividualMatch from "../models/IndividualMatch";
import TeamMatch from "../models/TeamMatch";
import BracketState from "../models/BracketState";

// Custom connect function that bypasses env validation
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(process.env.MONGODB_URI!);
  return mongoose.connection;
};

async function deleteTournamentAndMatches() {
  try {
    // Connect to database
    await connectDB();
    console.log("✅ Connected to database\n");

    // List all tournaments first
    const allIndividualTournaments = await TournamentIndividual.find({}).select("name format status seedingMethod seeding").lean();
    const allTeamTournaments = await TournamentTeam.find({}).select("name format status seedingMethod seeding").lean();
    
    console.log("📋 All tournaments in database:\n");
    
    if (allIndividualTournaments.length > 0) {
      console.log("Individual Tournaments:");
      allIndividualTournaments.forEach((t, i) => {
        const hasSeeding = t.seeding && t.seeding.length > 0;
        const seedingInfo = t.seedingMethod !== "none" && hasSeeding ? ` (${t.seedingMethod} seeding)` : "";
        console.log(`  ${i + 1}. "${t.name}" - ${t.format} - ${t.status}${seedingInfo}`);
        console.log(`     ID: ${t._id}`);
      });
      console.log();
    }
    
    if (allTeamTournaments.length > 0) {
      console.log("Team Tournaments:");
      allTeamTournaments.forEach((t, i) => {
        const hasSeeding = t.seeding && t.seeding.length > 0;
        const seedingInfo = t.seedingMethod !== "none" && hasSeeding ? ` (${t.seedingMethod} seeding)` : "";
        console.log(`  ${i + 1}. "${t.name}" - ${t.format} - ${t.status}${seedingInfo}`);
        console.log(`     ID: ${t._id}`);
      });
      console.log();
    }

    if (allIndividualTournaments.length === 0 && allTeamTournaments.length === 0) {
      console.log("❌ No tournaments found in database");
      return;
    }

    // Find the seeded tournament
    // Check TournamentIndividual first - look for any tournament with seeding data
    let tournament = await TournamentIndividual.findOne({
      $or: [
        { seedingMethod: { $ne: "none" } },
        { seeding: { $exists: true, $ne: [] } }
      ]
    });

    let tournamentType = "individual";
    
    // If not found, check TournamentTeam
    if (!tournament) {
      tournament = await TournamentTeam.findOne({
        $or: [
          { seedingMethod: { $ne: "none" } },
          { seeding: { $exists: true, $ne: [] } }
        ]
      });
      tournamentType = "team";
    }

    // If still not found, just get the first tournament
    if (!tournament) {
      const leanTournament = allIndividualTournaments[0] || allTeamTournaments[0];
      if (leanTournament) {
        tournamentType = allIndividualTournaments.length > 0 ? "individual" : "team";
        // Need to fetch the full document
        if (tournamentType === "individual") {
          tournament = await TournamentIndividual.findById(leanTournament._id);
        } else {
          tournament = await TournamentTeam.findById(leanTournament._id);
        }
      }
    }

    if (!tournament) {
      console.log("❌ No tournament found to delete");
      return;
    }

    const tournamentId = tournament._id.toString();
    console.log(`\n📋 Found tournament: "${tournament.name}"`);
    console.log(`   ID: ${tournamentId}`);
    console.log(`   Type: ${tournamentType}`);
    console.log(`   Format: ${tournament.format}`);
    console.log(`   Status: ${tournament.status}`);
    console.log(`   Seeding Method: ${tournament.seedingMethod}`);

    // Find all matches related to this tournament
    const individualMatches = await IndividualMatch.find({ tournament: tournamentId });
    const teamMatches = await TeamMatch.find({ tournament: tournamentId });
    
    const totalMatches = individualMatches.length + teamMatches.length;
    console.log(`\n🎾 Found ${totalMatches} matches:`);
    console.log(`   - ${individualMatches.length} individual matches`);
    console.log(`   - ${teamMatches.length} team matches`);

    // Check for BracketState if it's a knockout tournament
    let bracketState = null;
    if (tournament.format === "knockout" || tournament.format === "hybrid") {
      bracketState = await BracketState.findOne({ tournament: tournamentId });
      if (bracketState) {
        console.log(`   - 1 bracket state`);
      }
    }

    // Confirm deletion
    console.log(`\n⚠️  This will delete:`);
    console.log(`   - Tournament: "${tournament.name}"`);
    console.log(`   - ${totalMatches} matches`);
    if (bracketState) {
      console.log(`   - Bracket state`);
    }
    console.log(`\n🗑️  Starting deletion...\n`);

    // Delete matches first
    if (individualMatches.length > 0) {
      const deleteResult = await IndividualMatch.deleteMany({ tournament: tournamentId });
      console.log(`✅ Deleted ${deleteResult.deletedCount} individual matches`);
    }

    if (teamMatches.length > 0) {
      const deleteResult = await TeamMatch.deleteMany({ tournament: tournamentId });
      console.log(`✅ Deleted ${deleteResult.deletedCount} team matches`);
    }

    // Delete bracket state if it exists
    if (bracketState) {
      await BracketState.deleteOne({ tournament: tournamentId });
      console.log(`✅ Deleted bracket state`);
    }

    // Delete the tournament
    if (tournamentType === "individual") {
      await TournamentIndividual.findByIdAndDelete(tournamentId);
    } else {
      await TournamentTeam.findByIdAndDelete(tournamentId);
    }
    console.log(`✅ Deleted tournament: "${tournament.name}"`);

    console.log(`\n✨ Successfully deleted tournament and all related data!`);

    // Verify deletion
    console.log(`\n🔍 Verifying deletion...`);
    const remainingMatches = await IndividualMatch.countDocuments({ tournament: tournamentId }) + 
                            await TeamMatch.countDocuments({ tournament: tournamentId });
    const remainingTournament = await TournamentIndividual.findById(tournamentId) || 
                                await TournamentTeam.findById(tournamentId);
    const remainingBracket = await BracketState.findOne({ tournament: tournamentId });

    if (remainingMatches === 0 && !remainingTournament && !remainingBracket) {
      console.log(`✅ Verification successful - all data deleted`);
    } else {
      console.log(`⚠️  Warning: Some data may still exist:`);
      if (remainingMatches > 0) console.log(`   - ${remainingMatches} matches still exist`);
      if (remainingTournament) console.log(`   - Tournament still exists`);
      if (remainingBracket) console.log(`   - Bracket state still exists`);
    }
  } catch (error) {
    console.error("❌ Error deleting tournament:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
deleteTournamentAndMatches();

