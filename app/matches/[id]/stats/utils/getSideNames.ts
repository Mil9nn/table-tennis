/**
 * Helper function to get side names for individual matches (handles singles and doubles)
 * @param match - The match object
 * @param statsType - The stats type ("individual" or "team")
 * @returns Object with side1Name and side2Name
 */
export function getSideNames(match: any, statsType: string) {
  if (statsType !== "individual") {
    return {
      side1Name: match.team1?.name ?? "Team 1",
      side2Name: match.team2?.name ?? "Team 2",
    };
  }

  const isDoubles = match.matchType === "doubles" || match.matchType === "mixed_doubles";
  
  if (isDoubles && match.participants?.length >= 4) {
    // Doubles: participants[0] & participants[1] are side1, participants[2] & participants[3] are side2
    const p1Name = match.participants[0]?.fullName || match.participants[0]?.username || "Player 1";
    const p2Name = match.participants[1]?.fullName || match.participants[1]?.username || "Player 2";
    const p3Name = match.participants[2]?.fullName || match.participants[2]?.username || "Player 3";
    const p4Name = match.participants[3]?.fullName || match.participants[3]?.username || "Player 4";
    
    return {
      side1Name: `${p1Name} & ${p2Name}`,
      side2Name: `${p3Name} & ${p4Name}`,
    };
  } else {
    // Singles: participants[0] is side1, participants[1] is side2
    return {
      side1Name: match.participants?.[0]?.fullName ?? match.participants?.[0]?.username ?? "Side 1",
      side2Name: match.participants?.[1]?.fullName ?? match.participants?.[1]?.username ?? "Side 2",
    };
  }
}

