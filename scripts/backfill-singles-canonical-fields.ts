/**
 * One-off: load all singles individual matches and save() to run pre-save sync
 * (fills scores / sets maps and winner from legacy side fields).
 *
 * Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/backfill-singles-canonical-fields.ts
 * Or add a package.json script if desired.
 */

import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import IndividualMatch from "../models/IndividualMatch";

async function main() {
  await connectDB();
  const cursor = IndividualMatch.find({ matchType: "singles" }).cursor();
  let n = 0;
  for await (const doc of cursor) {
    await doc.save();
    n += 1;
    if (n % 200 === 0) {
      console.log("processed", n);
    }
  }
  console.log("Done. Updated", n, "singles matches.");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
