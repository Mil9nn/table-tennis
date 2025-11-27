export function getDisplayName(player: { username?: string; fullName?: string }): string {
  return player.fullName || player.username || "Unknown";
}

export function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}
