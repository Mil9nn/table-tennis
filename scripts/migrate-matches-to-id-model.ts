import mongoose from "mongoose";

function toId(v: any): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object" && v._id) return String(v._id);
  return String(v);
}

async function migrateIndividual(doc: any, force: boolean): Promise<boolean> {
  const participants = (doc.participants || []).map((p: any) => toId(p)).filter(Boolean);
  let changed = false;

  // Match winner
  if ((force || !doc.winnerId) && doc.winnerSide && participants.length >= 2) {
    const nextWinnerId = doc.winnerSide === "side1" ? participants[0] : participants[1];
    if (String(doc.winnerId || "") !== String(nextWinnerId)) {
      doc.winnerId = nextWinnerId;
      changed = true;
    }
  }

  // Server pointer
  if ((force || !doc.currentServerPlayerId) && doc.currentServer && participants.length >= 2) {
    const nextServer =
      doc.currentServer === "side1"
        ? participants[0]
        : doc.currentServer === "side2"
          ? participants[1]
          : null;
    if (nextServer && String(doc.currentServerPlayerId || "") !== String(nextServer)) {
      doc.currentServerPlayerId = nextServer;
      changed = true;
    }
  }

  // Final sets map
  const setsById = new Map<string, number>();
  if (doc.finalScore?.setsById instanceof Map) {
    for (const [k, v] of doc.finalScore.setsById.entries()) setsById.set(String(k), Number(v || 0));
  } else if (doc.finalScore?.setsById && typeof doc.finalScore.setsById === "object") {
    for (const [k, v] of Object.entries(doc.finalScore.setsById)) setsById.set(String(k), Number(v || 0));
  }
  if ((force || setsById.size === 0) && participants.length >= 2) {
    setsById.set(participants[0], Number(doc.finalScore?.side1Sets || 0));
    setsById.set(participants[1], Number(doc.finalScore?.side2Sets || 0));
    changed = true;
  }
  doc.finalScore = doc.finalScore || {};
  doc.finalScore.setsById = setsById;

  // Games
  for (const g of doc.games || []) {
    const gameScores = new Map<string, number>();
    if (g.scoresById instanceof Map) {
      for (const [k, v] of g.scoresById.entries()) gameScores.set(String(k), Number(v || 0));
    } else if (g.scoresById && typeof g.scoresById === "object") {
      for (const [k, v] of Object.entries(g.scoresById)) gameScores.set(String(k), Number(v || 0));
    } else if (participants.length >= 2) {
      gameScores.set(participants[0], Number(g.side1Score || 0));
      gameScores.set(participants[1], Number(g.side2Score || 0));
      changed = true;
    }
    g.scoresById = gameScores;

    if (force || !g.winnerId) {
      if (g.winnerSide && participants.length >= 2) {
        const nextWinner = g.winnerSide === "side1" ? participants[0] : participants[1];
        if (String(g.winnerId || "") !== String(nextWinner)) {
          g.winnerId = nextWinner;
          changed = true;
        }
      } else {
        const rows = [...gameScores.entries()].sort((a, b) => b[1] - a[1]);
        if (rows.length >= 2 && rows[0][1] >= 11 && rows[0][1] - rows[1][1] >= 2) {
          if (String(g.winnerId || "") !== String(rows[0][0])) {
            g.winnerId = rows[0][0];
            changed = true;
          }
        }
      }
    }
    if (g.completed && !g.status) {
      g.status = "completed";
      changed = true;
    } else if (!g.status) {
      g.status = "in_progress";
      changed = true;
    }
  }

  return changed;
}

async function migrateTeam(doc: any, force: boolean): Promise<boolean> {
  let changed = false;
  const team1Id = toId(doc.team1?._id);
  const team2Id = toId(doc.team2?._id);
  const byTeam = new Map<string, number>();
  if (doc.finalScore?.matchesByTeamId instanceof Map) {
    for (const [k, v] of doc.finalScore.matchesByTeamId.entries()) byTeam.set(String(k), Number(v || 0));
  } else if (doc.finalScore?.matchesByTeamId && typeof doc.finalScore.matchesByTeamId === "object") {
    for (const [k, v] of Object.entries(doc.finalScore.matchesByTeamId)) byTeam.set(String(k), Number(v || 0));
  }
  if ((force || byTeam.size === 0) && team1Id && team2Id) {
    byTeam.set(team1Id, Number(doc.finalScore?.team1Matches || 0));
    byTeam.set(team2Id, Number(doc.finalScore?.team2Matches || 0));
    changed = true;
  }
  doc.finalScore = doc.finalScore || {};
  doc.finalScore.matchesByTeamId = byTeam;

  if ((force || !doc.winnerTeamId) && doc.winnerTeam && team1Id && team2Id) {
    const nextWinnerTeamId = doc.winnerTeam === "team1" ? team1Id : team2Id;
    if (String(doc.winnerTeamId || "") !== String(nextWinnerTeamId)) {
      doc.winnerTeamId = nextWinnerTeamId;
      changed = true;
    }
  }
  return changed;
}

async function run() {
  const force = process.argv.includes("--force");
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to run migration");
  }
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not ready");
  }
  const coll = db.collection("matches");
  const cursor = coll.find({});
  let total = 0;
  let updated = 0;
  for await (const doc of cursor) {
    total++;
    let changed = false;
    if ((doc as any).matchCategory === "individual") {
      changed = await migrateIndividual(doc as any, force);
    } else if ((doc as any).matchCategory === "team") {
      changed = await migrateTeam(doc as any, force);
    }
    if (changed) {
      const { _id, ...rest } = doc as any;
      await coll.updateOne({ _id }, { $set: rest });
      updated++;
    }
    if (total % 200 === 0) {
      console.log(`Processed ${total}, updated ${updated}`);
    }
  }
  console.log(`Done. Processed ${total}, updated ${updated}${force ? " (force mode)" : ""}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

