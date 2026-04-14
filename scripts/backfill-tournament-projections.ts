import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import Tournament from "../models/Tournament";
import TournamentStandings from "../models/TournamentStandings";
import TournamentGroups from "../models/TournamentGroups";
import { syncTournamentProjections } from "../models/utils/tournamentProjectionSync";

const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

interface ParityIssue {
  tournamentId: string;
  checks: string[];
}

function normalizeId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return value._id.toString();
  if (value?.toString) return value.toString();
  return String(value);
}

async function checkTournamentParity(tournament: any): Promise<ParityIssue | null> {
  const checks: string[] = [];
  const tournamentId = normalizeId(tournament._id);
  const hasLegacyStandings = Object.prototype.hasOwnProperty.call(tournament, "standings");
  const hasLegacyGroups = Object.prototype.hasOwnProperty.call(tournament, "groups");

  const standingsDocs = await TournamentStandings.find({ tournament: tournament._id }).lean();
  const groupsDoc = await TournamentGroups.findOne({ tournament: tournament._id }).lean();

  if (hasLegacyStandings) {
    const overall = standingsDocs.find((doc: any) => doc.groupId === "__overall__");
    const expectedOverallCount = Array.isArray(tournament.standings) ? tournament.standings.length : 0;
    const actualOverallCount = Array.isArray(overall?.rows) ? overall.rows.length : 0;
    if (expectedOverallCount !== actualOverallCount) {
      checks.push(`overall standings mismatch: expected=${expectedOverallCount} actual=${actualOverallCount}`);
    }
  }

  if (hasLegacyGroups) {
    const expectedGroups = Array.isArray(tournament.groups) ? tournament.groups : [];
    const actualGroups = Array.isArray(groupsDoc?.groups) ? groupsDoc.groups : [];
    if (expectedGroups.length !== actualGroups.length) {
      checks.push(`group count mismatch: expected=${expectedGroups.length} actual=${actualGroups.length}`);
    }

    const expectedGroupMap = new Map<string, any>();
    for (const group of expectedGroups) {
      if (group?.groupId) expectedGroupMap.set(group.groupId, group);
    }

    for (const projectedGroup of actualGroups) {
      const expected = expectedGroupMap.get(projectedGroup.groupId);
      if (!expected) {
        checks.push(`unexpected projected group: ${projectedGroup.groupId}`);
        continue;
      }

      const expectedParticipants = (expected.participants || []).map((p: any) => normalizeId(p)).sort();
      const actualParticipants = (projectedGroup.participantIds || []).map((p: any) => normalizeId(p)).sort();
      if (expectedParticipants.join(",") !== actualParticipants.join(",")) {
        checks.push(`participant mismatch in group ${projectedGroup.groupId}`);
      }

      const expectedRounds = Array.isArray(expected.rounds) ? expected.rounds.length : 0;
      const actualRounds = Array.isArray(projectedGroup.rounds) ? projectedGroup.rounds.length : 0;
      if (expectedRounds !== actualRounds) {
        checks.push(`round count mismatch in group ${projectedGroup.groupId}: expected=${expectedRounds} actual=${actualRounds}`);
      }

      const projectedStandingDoc = standingsDocs.find((doc: any) => doc.groupId === projectedGroup.groupId);
      const expectedStandingRows = Array.isArray(expected.standings) ? expected.standings.length : 0;
      const actualStandingRows = Array.isArray(projectedStandingDoc?.rows) ? projectedStandingDoc.rows.length : 0;
      if (expectedStandingRows !== actualStandingRows) {
        checks.push(`group standings mismatch in ${projectedGroup.groupId}: expected=${expectedStandingRows} actual=${actualStandingRows}`);
      }
    }
  }

  return checks.length > 0 ? { tournamentId, checks } : null;
}

async function main() {
  const verifyOnly = process.argv.includes("--verify-only");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in environment.");
  }

  await mongoose.connect(mongoUri);

  try {
    const query = Tournament.find({}).sort({ _id: 1 });
    if (limit && Number.isFinite(limit) && limit > 0) {
      query.limit(limit);
    }
    const tournaments = await query.lean();

    let synced = 0;
    const parityIssues: ParityIssue[] = [];

    for (const tournament of tournaments) {
      if (!verifyOnly) {
        await syncTournamentProjections(tournament);
        synced += 1;
      }

      const issue = await checkTournamentParity(tournament);
      if (issue) parityIssues.push(issue);
    }

    if (!verifyOnly) {
      console.log(`Synced projection documents for ${synced} tournament(s).`);
    }
    console.log(`Checked parity for ${tournaments.length} tournament(s).`);

    if (parityIssues.length === 0) {
      console.log("Parity check passed: projections match tournament source data.");
      return;
    }

    console.error(`Parity check found ${parityIssues.length} tournament(s) with mismatches.`);
    for (const issue of parityIssues) {
      console.error(`- ${issue.tournamentId}`);
      for (const check of issue.checks) {
        console.error(`  * ${check}`);
      }
    }

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Backfill/parity script failed:", error);
  process.exit(1);
});
