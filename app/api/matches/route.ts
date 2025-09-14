import { NextRequest, NextResponse } from 'next/server';
import Match from '@/models/Match';
import { User } from '@/models/User';
import { getTokenFromRequest, verifyToken } from '@/lib/jwt';

// Create new match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const decoded = verifyToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const scorer = await User.findById(decoded.userId);
    if (!scorer) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
    }
    
    // Validate required fields
    if (!body.matchCategory || !body.matchType || !body.numberOfSets || !body.city) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create match object
    const matchData = {
      matchCategory: body.matchCategory,
      matchType: body.matchType,
      numberOfSets: parseInt(body.numberOfSets),
      city: body.city,
      venue: body.venue || body.city,
      scorer: scorer._id,
      status: 'scheduled'
    };
    
    // Handle individual matches
    if (body.matchCategory === 'individual') {
      if (!body.player1 || !body.player2) {
        return NextResponse.json({ error: 'Player names are required for individual matches' }, { status: 400 });
      }
      
      matchData.players = {
        player1: { name: body.player1 },
        player2: { name: body.player2 }
      };
      
      // For doubles matches
      if (body.matchType === 'doubles' || body.matchType === 'mixed_doubles') {
        if (!body.player3 || !body.player4) {
          return NextResponse.json({ error: 'All four players are required for doubles matches' }, { status: 400 });
        }
        matchData.players.player3 = { name: body.player3 };
        matchData.players.player4 = { name: body.player4 };
      }
    }
    
    // Handle team matches
    if (body.matchCategory === 'team') {
      if (!body.team1Name || !body.team2Name || !body.team1Players || !body.team2Players) {
        return NextResponse.json({ error: 'Team names and players are required for team matches' }, { status: 400 });
      }
      
      // Filter out empty player names
      const team1Players = body.team1Players.filter(name => name && name.trim() !== '');
      const team2Players = body.team2Players.filter(name => name && name.trim() !== '');
      
      if (team1Players.length < 3 || team2Players.length < 3) {
        return NextResponse.json({ error: 'Each team must have at least 3 players' }, { status: 400 });
      }
      
      matchData.team1 = {
        name: body.team1Name,
        players: team1Players.map((name, index) => ({
          name: name.trim(),
          role: ['A', 'B', 'C', 'D', 'E'][index] || `Player${index + 1}`
        }))
      };
      
      matchData.team2 = {
        name: body.team2Name,
        players: team2Players.map((name, index) => ({
          name: name.trim(),
          role: ['X', 'Y', 'Z', 'U', 'V'][index] || `Player${index + 1}`
        }))
      };
    }
    
    // Create and save the match
    const newMatch = new Match(matchData);
    await newMatch.save();
    
    // Populate scorer information before returning
    await newMatch.populate('scorer', 'username fullName');
    
    return NextResponse.json({ 
      success: true, 
      match: newMatch,
      message: 'Match created successfully'
    });
    
  } catch (error) {
    console.error('Error creating match:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      if (error.keyValue?.matchId) {
        return NextResponse.json({ error: 'Match ID already exists. Please try again.' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Duplicate entry detected. Please check your data.' }, { status: 400 });
    }
    
    // Provide more specific error messages
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Invalid match data provided' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}

// Get all matches
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    
    let query = {};
    if (status) query.status = status;
    
    const matches = await Match.find(query)
      .populate('scorer', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Match.countDocuments(query);
    
    return NextResponse.json({
      matches,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}