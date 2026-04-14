/**
 * Remove legacy embedded `games[].shots` after data lives in `matchpoints`.
 *
 * Usage: npx tsx scripts/unset-embedded-match-shots.ts
 */
import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";

const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
}

async function main() {
  await connect();
  const db = mongoose.connection.db;
  if (!db) throw new Error("No db");

  const coll = db.collection("matches");
  let individualUpdated = 0;
  let teamUpdated = 0;

  const indivCursor = coll.find({ matchCategory: "individual" });
  for await (const doc of indivCursor) {
    const games = (doc as { games?: { shots?: unknown[] }[] }).games;
    if (!Array.isArray(games)) continue;
    let changed = false;
    for (const g of games) {
      if (Array.isArray(g.shots) && g.shots.length > 0) {
        g.shots = [];
        changed = true;
      }
    }
    if (changed) {
      await coll.updateOne(
        { _id: doc._id as mongoose.Types.ObjectId },
        { $set: { games } }
      );
      individualUpdated += 1;
    }
  }

  const teamCursor = coll.find({ matchCategory: "team" });
  for await (const doc of teamCursor) {
    const subMatches = (doc as { subMatches?: { games?: { shots?: unknown[] }[] }[] }).subMatches;
    if (!Array.isArray(subMatches)) continue;
    let changed = false;
    for (const sm of subMatches) {
      if (!Array.isArray(sm.games)) continue;
      for (const g of sm.games) {
        if (Array.isArray(g.shots) && g.shots.length > 0) {
          g.shots = [];
          changed = true;
        }
      }
    }
    if (changed) {
      await coll.updateOne(
        { _id: doc._id as mongoose.Types.ObjectId },
        { $set: { subMatches } }
      );
      teamUpdated += 1;
    }
  }

  console.log(
    `Cleared embedded shots on individual match documents: ${individualUpdated}, team match documents: ${teamUpdated}`
  );

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
