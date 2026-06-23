// services/tournament/utils/codeGenerator.ts
import Tournament from "@/models/Tournament";
import Team from "@/models/Team";

const JOIN_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const JOIN_CODE_LENGTH = 6;

function randomJoinCode(): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_CHARACTERS.charAt(
      Math.floor(Math.random() * JOIN_CODE_CHARACTERS.length)
    );
  }
  return code;
}

async function isJoinCodeTaken(code: string): Promise<boolean> {
  const [existingTournament, existingTeam] = await Promise.all([
    Tournament.findOne({ joinCode: code }).select("_id").lean(),
    Team.findOne({ joinCode: code }).select("_id").lean(),
  ]);
  return !!(existingTournament || existingTeam);
}

/**
 * Generate a unique 6-character alphanumeric join code (tournaments and teams share namespace).
 */
export async function generateUniqueJoinCode(): Promise<string> {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = randomJoinCode();
    if (!(await isJoinCodeTaken(code))) {
      return code;
    }
  }

  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH - 4; i++) {
    code += JOIN_CODE_CHARACTERS.charAt(
      Math.floor(Math.random() * JOIN_CODE_CHARACTERS.length)
    );
  }
  return code + timestamp;
}

/** Alias for team invite flows — same global join-code namespace as tournaments. */
export const generateUniqueTeamJoinCode = generateUniqueJoinCode;

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
