import Match from '@/models/Match';
import { User } from '@/models/user.model';
import { NextRequest, NextResponse } from 'next/server';

// Clean match data structure with simple IDs
interface CleanMatchData {
  matchId: string;
  player1: string;        // User ID string
  player2: string;        // User ID string
  winner: string;         // User ID string
  bestOf: number;
  startTime: number;
  endTime: number;
  games: {
    gameNumber: number;
    player1Score: number;
    player2Score: number;
    winner: string | null; // User ID string
    startTime: number;
    endTime: number;
    shots: {
      shotName: string;
      player: string;      // User ID string
      timestamp: number;
      pointNumber: number;
    }[];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const matchData: CleanMatchData = await request.json();

    // Basic validation
    if (!matchData.matchId || !matchData.player1 || !matchData.player2) {
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

    // Validate that users exist
    const [player1Exists, player2Exists, winnerExists] = await Promise.all([
      User.findById(matchData.player1),
      User.findById(matchData.player2),
      User.findById(matchData.winner)
    ]);

    if (!player1Exists || !player2Exists || !winnerExists) {
      return NextResponse.json(
        { success: false, message: 'Invalid player IDs' },
        { status: 400 }
      );
    }

    // Save match with simple ID structure - no transformation
    const savedMatch = await Match.create(matchData);

    return NextResponse.json({
      success: true,
      matchId: savedMatch._id,
      message: 'Match saved successfully!',
    });

  } catch (error: any) {
    console.error('Error saving match:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query for user's matches
    let query = {};
    if (userId) {
      query = {
        $or: [
          { player1: userId },
          { player2: userId }
        ]
      };
    }

    // Get matches and populate user details using the string references
    const matches = await Match.find(query)
      .populate('player1', 'username displayName email')
      .populate('player2', 'username displayName email') 
      .populate('winner', 'username displayName email')
      .populate('games.winner', 'username displayName email')
      .populate('games.shots.player', 'username displayName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      matches: matches,
      total: matches.length
    });

  } catch (error: any) {
    console.error('Error retrieving matches:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve matches: ' + error.message },
      { status: 500 }
    );
  }
}

// Optional: Get single match by ID
export async function GET_SINGLE_MATCH(matchId: string) {
  try {
    const match = await Match.findById(matchId)
      .populate('player1', 'username displayName email')
      .populate('player2', 'username displayName email')
      .populate('winner', 'username displayName email')
      .populate('games.winner', 'username displayName email')
      .populate('games.shots.player', 'username displayName email')
      .lean();

    if (!match) {
      return { success: false, message: 'Match not found' };
    }

    return { success: true, match };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}