import { connectDB } from '@/lib/mongodb';
import Match from '@/models/Match';
import { NextRequest, NextResponse } from 'next/server';

interface Shot {
  shotName: string;
  timestamp: number;
  player: number;
  scoreP1: number;
  scoreP2: number;
}

interface Game {
  gameNumber: number;
  player1Score: number;
  player2Score: number;
  winner: number;
  shots: Shot[];
  startTime: number;
  endTime: number;
}

interface Player {
  userId: string;
  username: string;
  displayName: string;
}

interface MatchData {
  id: string;
  player1: Player;
  player2: Player;
  bestOf: number;
  games: Game[];
  winner: Player;
  startTime: number;
  endTime: number;
}

interface MatchStats {
  totalPoints: number;
  totalShots: number;
  averageGameDuration: number;
  longestGame: Game | null;
  shotBreakdown: { [shotName: string]: number };
  playerStats: {
    [playerName: string]: {
      totalPoints: number;
      gamesWon: number;
      favoriteShot: string;
      shotCount: { [shotName: string]: number };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const matchData: MatchData = await request.json();

    // Validate the match data - updated for object structure
    if (!matchData.id || !matchData.player1 || !matchData.player2) {
      return NextResponse.json(
        { success: false, message: 'Missing required match data' },
        { status: 400 }
      );
    }

    if (!matchData.winner) {
      return NextResponse.json(
        { success: false, message: 'Match must be completed to save' },
        { status: 400 }
      );
    }

    await connectDB();

    const stats = calculateMatchStats(matchData);
    
    // Create match document for the new schema
    const matchDocument = {
      matchId: matchData.id,
      player1: matchData.player1,
      player2: matchData.player2,
      winner: matchData.winner,
      bestOf: matchData.bestOf,
      games: matchData.games,
      startTime: matchData.startTime,
      endTime: matchData.endTime,
      stats: stats,
    };

    const savedMatch = await Match.create(matchDocument);

    // Calculate winner message
    const winnerGames = matchData.games.filter(g => 
      g.winner === (matchData.winner.userId === matchData.player1.userId ? 1 : 2)
    ).length;
    const loserGames = matchData.games.length - winnerGames;

    return NextResponse.json({
      success: true,
      matchId: matchData.id,
      message: `Match saved successfully! ${matchData.winner.displayName} wins ${winnerGames}-${loserGames}`,
      stats: stats,
    });
  } catch (error) {
    console.error('Error saving match:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

function calculateMatchStats(matchData: MatchData): MatchStats {
  let totalPoints = 0;
  let totalShots = 0;
  let totalGameDuration = 0;
  let longestGame: Game | null = null;
  let longestGameDuration = 0;
  const shotBreakdown: { [shotName: string]: number } = {};
  
  const playerStats = {
    [matchData.player1.displayName]: {
      totalPoints: 0,
      gamesWon: 0,
      favoriteShot: '',
      shotCount: {} as { [shotName: string]: number }
    },
    [matchData.player2.displayName]: {
      totalPoints: 0,
      gamesWon: 0,
      favoriteShot: '',
      shotCount: {} as { [shotName: string]: number }
    }
  };

  // Analyze each game
  matchData.games.forEach(game => {
    // Points and games
    totalPoints += game.player1Score + game.player2Score;
    playerStats[matchData.player1.displayName].totalPoints += game.player1Score;
    playerStats[matchData.player2.displayName].totalPoints += game.player2Score;
    
    if (game.winner === 1) {
      playerStats[matchData.player1.displayName].gamesWon++;
    } else {
      playerStats[matchData.player2.displayName].gamesWon++;
    }

    // Game duration
    const gameDuration = game.endTime - game.startTime;
    totalGameDuration += gameDuration;
    
    if (gameDuration > longestGameDuration) {
      longestGameDuration = gameDuration;
      longestGame = game;
    }

    // Shot analysis
    game.shots.forEach(shot => {
      totalShots++;
      
      // Overall shot breakdown
      shotBreakdown[shot.shotName] = (shotBreakdown[shot.shotName] || 0) + 1;
      
      // Player-specific shot counts
      const playerName = shot.player === 1 ? matchData.player1.displayName : matchData.player2.displayName;
      const playerShotCount = playerStats[playerName].shotCount;
      playerShotCount[shot.shotName] = (playerShotCount[shot.shotName] || 0) + 1;
    });
  });

  // Calculate favorite shots for each player
  Object.keys(playerStats).forEach(playerName => {
    const shotCounts = playerStats[playerName].shotCount;
    let maxCount = 0;
    let favoriteShot = 'None';
    
    Object.entries(shotCounts).forEach(([shotName, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteShot = shotName;
      }
    });
    
    playerStats[playerName].favoriteShot = favoriteShot;
  });

  const averageGameDuration = matchData.games.length > 0 ? totalGameDuration / matchData.games.length : 0;

  return {
    totalPoints,
    totalShots,
    averageGameDuration,
    longestGame,
    shotBreakdown,
    playerStats
  };
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = {};
    
    // Filter by userId if provided - works with object schema
    if (userId) {
      query = {
        $or: [
          { 'player1.userId': userId },
          { 'player2.userId': userId }
        ]
      };
    }

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      matches: matches
    });

  } catch (error) {
    console.error('Error retrieving matches:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve matches' },
      { status: 500 }
    );
  }
}