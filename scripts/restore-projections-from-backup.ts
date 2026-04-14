import fs from "fs";
import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import TournamentStandings from "../models/TournamentStandings";
import TournamentGroups from "../models/TournamentGroups";

const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

function idValue(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value.$oid) return value.$oid;
  if (value._id) return idValue(value._id);
  return String(value);
}

function mapStandingRows(rows: any[] = []) {
  return rows.map((row: any) => ({
    participantId: idValue(row.participant),
    played: row.played ?? 0,
    won: row.won ?? 0,
    lost: row.lost ?? 0,
    drawn: row.drawn ?? 0,
    setsWon: row.setsWon ?? 0,
    setsLost: row.setsLost ?? 0,
    setsDiff: row.setsDiff ?? 0,
    pointsScored: row.pointsScored ?? 0,
    pointsConceded: row.pointsConceded ?? 0,
    pointsDiff: row.pointsDiff ?? 0,
    points: row.points ?? 0,
    rank: row.rank ?? 0,
    form: Array.isArray(row.form) ? row.form : [],
    headToHead: row.headToHead ?? {},
  }));
}

async function main() {
  const backupPathArg = process.argv.find((arg) => arg.startsWith("--backup="));
  const backupPath =
    backupPathArg?.split("=")[1] ||
    "C:/dev/table-tennis/backups/backup-20260407/tournaments.json";

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is missing in environment.");

  const backupRaw = fs.readFileSync(backupPath, "utf8");
  const backupTournaments = JSON.parse(backupRaw);

  await mongoose.connect(mongoUri);
  try {
    let restored = 0;
    for (const tournament of backupTournaments) {
      const tournamentId = idValue(tournament._id);
      if (!tournamentId) continue;
      const category = tournament.category === "team" ? "team" : "individual";
      const phase = tournament.currentPhase;

      const bulkStandings: any[] = [];
      bulkStandings.push({
        replaceOne: {
          filter: { tournament: tournamentId, groupId: "__overall__" },
          replacement: {
            tournament: tournamentId,
            category,
            phase,
            groupId: "__overall__",
            rows: mapStandingRows(tournament.standings || []),
          },
          upsert: true,
        },
      });

      const groups = Array.isArray(tournament.groups) ? tournament.groups : [];
      const projectedGroups = groups.map((group: any) => {
        bulkStandings.push({
          replaceOne: {
            filter: { tournament: tournamentId, groupId: group.groupId },
            replacement: {
              tournament: tournamentId,
              category,
              phase,
              groupId: group.groupId,
              rows: mapStandingRows(group.standings || []),
            },
            upsert: true,
          },
        });

        return {
          groupId: group.groupId,
          groupName: group.groupName,
          participantIds: (group.participants || []).map((p: any) => idValue(p)).filter(Boolean),
          rounds: (group.rounds || []).map((round: any) => ({
            roundNumber: round.roundNumber,
            matches: (round.matches || []).map((m: any) => idValue(m)).filter(Boolean),
            completed: !!round.completed,
            scheduledDate: round.scheduledDate ? new Date(round.scheduledDate) : undefined,
            scheduledTime: round.scheduledTime,
          })),
        };
      });

      await TournamentStandings.bulkWrite(bulkStandings);
      await TournamentGroups.findOneAndUpdate(
        { tournament: tournamentId },
        { tournament: tournamentId, category, groups: projectedGroups },
        { upsert: true }
      );
      restored += 1;
    }

    console.log(`Restored projection data for ${restored} tournament(s) from backup.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error("Restore projections failed:", error);
  process.exit(1);
});
