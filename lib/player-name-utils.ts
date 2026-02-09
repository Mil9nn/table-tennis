/**
 * Format player names for display, especially for doubles matches
 * to prevent overflow and improve readability
 */

export function formatPlayerName(playerName: string): string {
  if (playerName.includes(' & ')) {
    // For doubles, shorten to "First1 & First2" format
    const players = playerName.split(' & ');
    const firstNames = players.map(player => {
      const parts = player.trim().split(' ');
      return parts[0]; // Take first name only
    });
    return firstNames.join(' & ');
  }
  
  // For individual players, take first name only
  const parts = playerName.trim().split(' ');
  return parts[0];
}
