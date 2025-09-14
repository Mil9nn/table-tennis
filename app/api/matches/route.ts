import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Match from '@/models/Match';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Create new match
export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const scorer = await User.findById(decoded.userId);
    
    if (!scorer) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 401 });
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
      matchData.players = {
        player1: { name: body.player1 },
        player2: { name: body.player2 }
      };
      
      // For doubles matches
      if (body.matchType === 'doubles' || body.matchType === 'mixed_doubles') {
        matchData.players.player3 = { name: body.player3 };
        matchData.players.player4 = { name: body.player4 };
      }
    }
    
    // Handle team matches
    if (body.matchCategory === 'team') {
      matchData.team1 = {
        name: body.team1Name,
        players: body.team1Players?.map((name, index) => ({
          name: name,
          role: ['A', 'B', 'C'][index]
        })) || []
      };
      
      matchData.team2 = {
        name: body.team2Name,
        players: body.team2Players?.map((name, index) => ({
          name: name,
          role: ['X', 'Y', 'Z'][index]
        })) || []
      };
    }
    
    const newMatch = new Match(matchData);
    await newMatch.save();
    
    return NextResponse.json({ 
      success: true, 
      match: newMatch,
      message: 'Match created successfully'
    });
    
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}

// Get all matches
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    
    let query = {};
    if (status) query.status = status;
    
    const matches = await Match.find(query)
      .populate('scorer', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
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