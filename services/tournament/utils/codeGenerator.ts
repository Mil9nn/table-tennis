// services/tournament/utils/codeGenerator.ts
import Tournament from "@/models/Tournament";

/**
 * Generate a unique 6-character alphanumeric join code for tournaments
 * Format: XXXXXX (uppercase letters and numbers)
 */
export async function generateUniqueJoinCode(): Promise<string> {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const codeLength = 6;
  const maxAttempts = 100; // Prevent infinite loops

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random code
    let code = "";
    for (let i = 0; i < codeLength; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code is unique
    const existingTournament = await Tournament.findOne({ joinCode: code });
    if (!existingTournament) {
      return code;
    }
  }

  // Fallback: add timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let code = "";
  for (let i = 0; i < codeLength - 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code + timestamp;
}

/**
 * Validate join code format
 */
export function isValidJoinCodeFormat(code: string): boolean {
  // 6 characters, alphanumeric only
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(code);
}

/**
 * Generate a tournament-specific identifier for matches/rounds
 */
export function generateMatchIdentifier(
  tournamentId: string,
  roundNumber: number,
  matchIndex: number
): string {
  return `${tournamentId}_R${roundNumber}_M${matchIndex}`;
}

/**
 * Generate group identifier
 */
export function generateGroupIdentifier(index: number): {
  groupId: string;
  groupName: string;
} {
  const groupLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const label = groupLabels[index];

  return {
    groupId: label,
    groupName: `Group ${label}`,
  };
}
