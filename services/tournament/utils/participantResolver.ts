/**
 * Participant Resolution Utility
 * Maps participant IDs to full participant objects for display
 */

interface ParticipantBase {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}

/**
 * Create a lookup map for quick participant resolution
 */
export function createParticipantMap(
  participants: ParticipantBase[]
): Map<string, ParticipantBase> {
  const map = new Map<string, ParticipantBase>();
  participants.forEach((p) => {
    map.set(p._id.toString(), p);
  });
  return map;
}

/**
 * Resolve a participant ID to its full object
 */
export function resolveParticipant(
  participantId: string | null,
  participantMap: Map<string, ParticipantBase>
): ParticipantBase | null {
  if (!participantId) return null;
  return participantMap.get(participantId.toString()) || null;
}

/**
 * Resolve multiple participant IDs
 */
export function resolveParticipants(
  participantIds: (string | null)[],
  participantMap: Map<string, ParticipantBase>
): (ParticipantBase | null)[] {
  return participantIds.map((id) => resolveParticipant(id, participantMap));
}

/**
 * Get participant display name
 */
export function getParticipantDisplayName(participant: ParticipantBase | null): string {
  if (!participant) return "TBD";
  return participant.fullName || participant.username || "Unknown";
}

/**
 * Get participant initials for avatars
 */
export function getParticipantInitials(participant: ParticipantBase | null): string {
  if (!participant) return "?";
  const name = participant.fullName || participant.username || "?";
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
