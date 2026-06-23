/**
 * Generate a Dicebear avatar URL for team logos
 */
export function generateTeamLogo(teamName: string): string {
  // Clean team name for URL (remove special characters, spaces)
  const seed = teamName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20); // Limit length for URL
  
  // Use Dicebear 'glass' style with consistent colors
  const backgroundColors = 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c7f9cc';
  
  return `https://api.dicebear.com/9.x/glass/svg?seed=${seed}&backgroundColor=${backgroundColors}&radius=10`;
}
