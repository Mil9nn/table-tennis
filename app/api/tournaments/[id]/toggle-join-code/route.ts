import Tournament from "@/models/Tournament";
import {
  withDBAndErrorHandling,
  requireAuth,
  loadTournament,
  jsonOk,
  ApiError,
} from "@/lib/api";

/**
 * Generate a unique 6-character join code
 */
function generateJoinCode(): string {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Toggle join by code feature for a tournament
 * Generates a unique join code if enabling
 */
export const POST = withDBAndErrorHandling(async (req, context) => {
  const { userId } = await requireAuth(req);
  const { id } = await context.params;

  const { tournament } = await loadTournament(id, userId, {
    requireOrganizer: true,
    skipConnect: true,
  });

  const { enable } = await req.json();

  if (enable) {
    // Generate a unique join code
    let joinCode: string = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      joinCode = generateJoinCode();
      const existing = await Tournament.findOne({ joinCode });
      if (!existing) {
        isUnique = true;
        tournament.joinCode = joinCode;
      }
      attempts++;
    }

    if (!isUnique) {
      throw ApiError.internal(
        "Failed to generate unique join code. Please try again."
      );
    }

    tournament.allowJoinByCode = true;
  } else {
    // Disable join by code (but keep the code for reference)
    tournament.allowJoinByCode = false;
  }

  await tournament.save();

  return jsonOk({
    message: enable ? "Join by code enabled" : "Join by code disabled",
    joinCode: tournament.joinCode,
    allowJoinByCode: tournament.allowJoinByCode,
  });
});
