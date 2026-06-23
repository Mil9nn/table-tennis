import mongoose from "mongoose";

async function run() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database connection not ready");
  const coll = db.collection("matches");

  // Remove legacy fields from individual matches
  const individualRes = await coll.updateMany(
    { matchCategory: "individual" },
    {
      $unset: {
        currentServer: "",
        winnerSide: "",
        "finalScore.side1Sets": "",
        "finalScore.side2Sets": "",
        "finalScore.sets": "",
        "serverConfig.firstServer": "",
        "serverConfig.firstReceiver": "",
        "serverConfig.serverOrder": "",
        "games.$[].side1Score": "",
        "games.$[].side2Score": "",
        "games.$[].winnerSide": "",
        "games.$[].winnerPlayerId": "",
        "games.$[].scores": "",
        "games.$[].completed": "",
      } as any,
    }
  );

  // Remove legacy fields from team matches
  const teamRes = await coll.updateMany(
    { matchCategory: "team" },
    {
      $unset: {
        winnerTeam: "",
        "finalScore.team1Matches": "",
        "finalScore.team2Matches": "",
        "serverConfig.firstServer": "",
        "serverConfig.firstReceiver": "",
        "serverConfig.serverOrder": "",
        "subMatches.$[].winnerSide": "",
        "subMatches.$[].currentServer": "",
        "subMatches.$[].finalScore.team1Games": "",
        "subMatches.$[].finalScore.team2Games": "",
        "subMatches.$[].serverConfig.firstServer": "",
        "subMatches.$[].serverConfig.firstReceiver": "",
        "subMatches.$[].serverConfig.serverOrder": "",
        "subMatches.$[].games.$[].team1Score": "",
        "subMatches.$[].games.$[].team2Score": "",
        "subMatches.$[].games.$[].winnerSide": "",
        "subMatches.$[].games.$[].completed": "",
        "subMatches.$[].completed": "",
      } as any,
    }
  );

  console.log(
    `Individual: matched ${individualRes.matchedCount}, modified ${individualRes.modifiedCount}`
  );
  console.log(`Team: matched ${teamRes.matchedCount}, modified ${teamRes.modifiedCount}`);

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});

