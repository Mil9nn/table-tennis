// app/api/match/save-enhanced/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Match from '@/models/match.model';
import { User } from '@/models/user.model';
import { nanoid } from 'nanoid';

// Interface for the enhanced match creation
interface EnhancedMatchData {
  matchCategory: 'individual' | 'team';
  
  // Individual match fields
  matchType?: 'singles' | 'doubles';
  player1?: string;
  player2?: string;
  player3?: string;
  player4?: string;
  
  // Team match fields
  teamFormat?: 'format1' | 'format2' | 'format3';
  team1Name?: string;
  team2Name?: string;
  team1Players?: string[];
  team2Players?: string[];
  team1Captain?: string;
  team2Captain?: string;
  
  // Common fields
  bestOf: number;
  scorer: string;
  venue?: {
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    placeId?: string;
  };
}

// Team format configurations
const TEAM_FORMAT_CONFIGS = {
  format1: {
    name: 'A,B,C,A,B vs X,Y,Z,Y,X',
    matches: [
      { matchNumber: 1, type: 'singles', team1PlayerIndex: 0, team2PlayerIndex: 0 },
      { matchNumber: 2, type: 'singles', team1PlayerIndex: 1, team2PlayerIndex: 1 },
      { matchNumber: 3, type: 'singles', team1PlayerIndex: 2, team2PlayerIndex: 2 },
      { matchNumber: 4, type: 'singles', team1PlayerIndex: 0, team2PlayerIndex: 1 },
      { matchNumber: 5, type: 'singles', team1PlayerIndex: 1, team2PlayerIndex: 0 },
    ]
  },
  format2: {
    name: 'A, AB, B vs X, XY, Y',
    matches: [
      { matchNumber: 1, type: 'singles', team1PlayerIndex: 0, team2PlayerIndex: 0 },
      { matchNumber: 2, type: 'doubles', team1PlayerIndex: [0, 1], team2PlayerIndex: [0, 1] },
      { matchNumber: 3, type: 'singles', team1PlayerIndex: 1, team2PlayerIndex: 1 },
    ]
  },
  format3: {
    name: 'A, B, C vs X, Y, Z',
    matches: [
      { matchNumber: 1, type: 'singles', team1PlayerIndex: 0, team2PlayerIndex: 0 },
      { matchNumber: 2, type: 'singles', team1PlayerIndex: 1, team2PlayerIndex: 1 },
      { matchNumber: 3, type: 'singles', team1PlayerIndex: 2, team2PlayerIndex: 2 },
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const matchData: EnhancedMatchData = await request.json();

    // Basic validation
    if (!matchData.matchCategory || !matchData.bestOf || !matchData.scorer) {
      return NextResponse.json(
        { success: false, message: 'Missing required match data' },
        { status: 400 }
      );
    }

    // Validate scorer exists
    const scorerExists = await User.findById(matchData.scorer);
    if (!scorerExists) {
      return NextResponse.json(
        { success: false, message: 'Invalid scorer ID' },
        { status: 400 }
      );
    }

    const matchId = nanoid(10);
    const startTime = Date.now();

    if (matchData.matchCategory === 'individual') {
      // Handle individual match creation
      return await createIndividualMatch(matchData, matchId, startTime);
    } else {
      // Handle team match creation
      return await createTeamMatch(matchData, matchId, startTime);
    }

  } catch (error: any) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

async function createIndividualMatch(
  matchData: EnhancedMatchData, 
  matchId: string, 
  startTime: number
) {
  // Validate players exist
  const playerIds = [matchData.player1, matchData.player2];
  if (matchData.matchType === 'doubles') {
    playerIds.push(matchData.player3!, matchData.player4!);
  }

  const players = await User.find({ _id: { $in: playerIds.filter(Boolean) } });
  if (players.length !== playerIds.filter(Boolean).length) {
    return NextResponse.json(
      { success: false, message: 'One or more players not found' },
      { status: 400 }
    );
  }

  // Create individual match
  const savedMatch = await Match.create({
    matchId,
    matchCategory: 'individual',
    player1: matchData.player1,
    player2: matchData.player2,
    player3: matchData.player3,
    player4: matchData.player4,
    bestOf: matchData.bestOf,
    scorer: matchData.scorer,
    venue: matchData.venue,
    startTime,
    status: 'scheduled',
    games: [] // Will be populated during gameplay
  });

  return NextResponse.json({
    success: true,
    matchId: savedMatch._id,
    message: 'Individual match created successfully!',
    match: savedMatch
  });
}

async function createTeamMatch(
  matchData: EnhancedMatchData, 
  matchId: string, 
  startTime: number
) {
  if (!matchData.teamFormat || !matchData.team1Players || !matchData.team2Players) {
    return NextResponse.json(
      { success: false, message: 'Team format and players are required for team matches' },
      { status: 400 }
    );
  }

  // Validate all team players exist
  const allPlayerIds = [...matchData.team1Players, ...matchData.team2Players].filter(Boolean);
  const players = await User.find({ _id: { $in: allPlayerIds } });
  if (players.length !== allPlayerIds.length) {
    return NextResponse.json(
      { success: false, message: 'One or more team players not found' },
      { status: 400 }
    );
  }

  // Get format configuration
  const formatConfig = TEAM_FORMAT_CONFIGS[matchData.teamFormat as keyof typeof TEAM_FORMAT_CONFIGS];
  if (!formatConfig) {
    return NextResponse.json(
      { success: false, message: 'Invalid team format' },
      { status: 400 }
    );
  }

  // Create sub-matches based on format
  const subMatches = formatConfig.matches.map((matchConfig) => {
    let player1, player2, player3, player4;

    if (matchConfig.type === 'singles') {
      player1 = matchData.team1Players![matchConfig.team1PlayerIndex as number];
      player2 = matchData.team2Players![matchConfig.team2PlayerIndex as number];
    } else if (matchConfig.type === 'doubles') {
      const team1Indices = matchConfig.team1PlayerIndex as number[];
      const team2Indices = matchConfig.team2PlayerIndex as number[];
      
      player1 = matchData.team1Players![team1Indices[0]];
      player3 = matchData.team1Players![team1Indices[1]];
      player2 = matchData.team2Players![team2Indices[0]];
      player4 = matchData.team2Players![team2Indices[1]];
    }

    return {
      subMatchNumber: matchConfig.matchNumber,
      matchType: matchConfig.type,
      player1,
      player2,
      player3,
      player4,
      status: 'pending',
      games: []
    };
  });

  // Create team match
  const savedMatch = await Match.create({
    matchId,
    matchCategory: 'team',
    team1: {
      teamName: matchData.team1Name,
      players: matchData.team1Players,
      captain: matchData.team1Captain
    },
    team2: {
      teamName: matchData.team2Name,
      players: matchData.team2Players,
      captain: matchData.team2Captain
    },
    teamFormat: matchData.teamFormat,
    subMatches,
    bestOf: matchData.bestOf,
    scorer: matchData.scorer,
    venue: matchData.venue,
    startTime,
    status: 'scheduled'
  });

  return NextResponse.json({
    success: true,
    matchId: savedMatch._id,
    message: 'Team match created successfully!',
    match: savedMatch,
    subMatches: subMatches.length
  });
}

// GET method to retrieve matches (enhanced to handle both types)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const matchCategory = searchParams.get('category'); // 'individual' | 'team' | 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    let query: any = {};

    if (matchCategory && matchCategory !== 'all') {
      query.matchCategory = matchCategory;
    }

    if (userId) {
      query.$or = [
        // Individual matches
        { player1: userId },
        { player2: userId },
        { player3: userId },
        { player4: userId },
        // Team matches
        { 'team1.players': userId },
        { 'team2.players': userId },
        // Scorer
        { scorer: userId }
      ];
    }

    const matches = await Match.find(query)
      .populate('player1 player2 player3 player4', 'username fullName email')
      .populate('team1.players team2.players', 'username fullName email')
      .populate('scorer', 'username fullName email')
      .populate('subMatches.player1 subMatches.player2 subMatches.player3 subMatches.player4', 'username fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      matches,
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