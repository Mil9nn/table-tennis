/**
 * Copy embedded games[].shots into the `matchpoints` collection.
 * Idempotent: uses upsert on (match, teamSubMatchId, gameNumber, shotNumber).
 *
 * Usage: npx tsx scripts/backfill-match-points.ts
 */
import dotenv from "dotenv";
import { resolve } from "path";
import mongoose from "mongoose";
import IndividualMatch from "../models/IndividualMatch";
import TeamMatch from "../models/TeamMatch";
import MatchPoint from "../models/MatchPoint";

const projectRoot = process.cwd();
dotenv.config({ path: resolve(projectRoot, ".env.local") });
dotenv.config({ path: resolve(projectRoot, ".env") });

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
}

function shotDocBase(shot: Record<string, unknown>) {
  return {
    side: shot.side,
    player: shot.player,
    stroke: shot.stroke ?? null,
    serveType: shot.serveType ?? null,
    server: shot.server ?? null,
    originX: shot.originX,
    originY: shot.originY,
    landingX: shot.landingX,
    landingY: shot.landingY,
    timestamp: shot.timestamp ? new Date(shot.timestamp as string | Date) : new Date(),
  };
}

async function main() {
  await connect();
  let upserted = 0;
  const warnings: string[] = [];

  const individuals = await IndividualMatch.find({}).lean();
  for (const m of individuals) {
    const mid = m._id as mongoose.Types.ObjectId;
    for (const g of m.games || []) {
      const gn = g.gameNumber as number;
      const shots = g.shots || [];
      let sn = 1;
      for (const shot of shots as Record<string, unknown>[]) {
        const shotNumber = (shot.shotNumber as number) || sn;
        sn = Math.max(sn, shotNumber + 1);
        const res = await MatchPoint.updateOne(
          {
            match: mid,
            teamSubMatchId: null,
            gameNumber: gn,
            shotNumber,
          },
          {
            $setOnInsert: {
              match: mid,
              matchCategory: "individual",
              teamSubMatchId: null,
              gameNumber: gn,
              shotNumber,
              ...shotDocBase(shot),
            },
          },
          { upsert: true }
        );
        if (res.upsertedCount) upserted += 1;
      }
    }
  }

  const teams = await TeamMatch.find({}).lean();
  for (const m of teams) {
    const mid = m._id as mongoose.Types.ObjectId;
    for (const sm of m.subMatches || []) {
      const subId = sm._id as mongoose.Types.ObjectId | undefined;
      if (!subId) {
        warnings.push(`Team match ${mid} submatch missing _id, skipped`);
        continue;
      }
      for (const g of sm.games || []) {
        const gn = g.gameNumber as number;
        const shots = g.shots || [];
        let sn = 1;
        for (const shot of shots as Record<string, unknown>[]) {
          const shotNumber = (shot.shotNumber as number) || sn;
          sn = Math.max(sn, shotNumber + 1);
          const res = await MatchPoint.updateOne(
            {
              match: mid,
              teamSubMatchId: subId,
              gameNumber: gn,
              shotNumber,
            },
            {
              $setOnInsert: {
                match: mid,
                matchCategory: "team",
                teamSubMatchId: subId,
                gameNumber: gn,
                shotNumber,
                ...shotDocBase(shot),
              },
            },
            { upsert: true }
          );
          if (res.upsertedCount) upserted += 1;
        }
      }
    }
  }

  console.log(`Backfill complete. New match point documents inserted: ${upserted}`);
  if (warnings.length) {
    console.warn("Warnings:");
    warnings.forEach((w) => console.warn(" -", w));
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
