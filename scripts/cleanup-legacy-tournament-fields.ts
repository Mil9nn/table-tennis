import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import Tournament from "../models/Tournament";
import TournamentStandings from "../models/TournamentStandings";
import TournamentGroups from "../models/TournamentGroups";

const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

function normalizeId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return value._id.toString();
  if (value?.toString) return value.toString();
  return String(value);
}

async function hasProjectionParity(tournament: any): Promise<boolean> {
  const standingsDocs = await TournamentStandings.find({ tournament: tournament._id }).lean();
  const groupsDoc = await TournamentGroups.findOne({ tournament: tournament._id }).lean();

  const overall = standingsDocs.find((doc: any) => doc.groupId === "__overall__");
  const expectedOverall = Array.isArray(tournament.standings) ? tournament.standings.length : 0;
  const actualOverall = Array.isArray(overall?.rows) ? overall.rows.length : 0;
  if (expectedOverall !== actualOverall) return false;

  const expectedGroups = Array.isArray(tournament.groups) ? tournament.groups : [];
  const actualGroups = Array.isArray(groupsDoc?.groups) ? groupsDoc.groups : [];
  if (expectedGroups.length !== actualGroups.length) return false;

  const expectedGroupMap = new Map<string, any>();
  for (const group of expectedGroups) {
    if (group?.groupId) expectedGroupMap.set(group.groupId, group);
  }

  for (const projected of actualGroups) {
    const expected = expectedGroupMap.get(projected.groupId);
    if (!expected) return false;

    const expectedParticipants = (expected.participants || []).map((p: any) => normalizeId(p)).sort();
    const actualParticipants = (projected.participantIds || []).map((p: any) => normalizeId(p)).sort();
    if (expectedParticipants.join(",") !== actualParticipants.join(",")) return false;

    const expectedRounds = Array.isArray(expected.rounds) ? expected.rounds : [];
    const actualRounds = Array.isArray(projected.rounds) ? projected.rounds : [];
    if (expectedRounds.length !== actualRounds.length) return false;
    for (let i = 0; i < expectedRounds.length; i++) {
      const expectedRound = expectedRounds[i];
      const actualRound = actualRounds[i];
      const expectedMatches = Array.isArray(expectedRound?.matches) ? expectedRound.matches : [];
      const actualMatches = Array.isArray(actualRound?.matches) ? actualRound.matches : [];
      if (expectedMatches.length !== actualMatches.length) return false;
    }

    const expectedRows = Array.isArray(expected.standings) ? expected.standings.length : 0;
    const projectedRows = standingsDocs.find((doc: any) => doc.groupId === projected.groupId)?.rows || [];
    if (expectedRows !== projectedRows.length) return false;
  }

  return true;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing in environment.");

  await mongoose.connect(mongoUri);
  try {
    let query = Tournament.find({}).sort({ _id: 1 });
    if (limit && Number.isFinite(limit) && limit > 0) query = query.limit(limit);
    const tournaments = await query.lean();

    const eligibleIds: string[] = [];
    const skipped: string[] = [];

    for (const tournamentRaw of tournaments) {
      const tournament = tournamentRaw as any;
      const parity = await hasProjectionParity(tournament);
      if (parity) {
        eligibleIds.push(tournament._id.toString());
      } else {
        skipped.push(tournament._id.toString());
      }
    }

    console.log(`Total tournaments scanned: ${tournaments.length}`);
    console.log(`Eligible for cleanup (parity ok): ${eligibleIds.length}`);
    console.log(`Skipped (parity mismatch): ${skipped.length}`);

    if (skipped.length > 0) {
      console.log("Skipped tournament IDs:");
      skipped.forEach((id) => console.log(`- ${id}`));
    }

    if (!apply) {
      console.log("Dry run complete. Re-run with --apply to remove legacy fields.");
      return;
    }

    if (eligibleIds.length === 0) {
      console.log("No eligible tournaments to clean.");
      return;
    }

    const result = await Tournament.updateMany(
      { _id: { $in: eligibleIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { $unset: { standings: "", groups: "" } }
    );

    console.log(`Cleanup complete. Modified documents: ${result.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Legacy cleanup script failed:", error);
  process.exit(1);
});
