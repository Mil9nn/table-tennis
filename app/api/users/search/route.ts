// /api/users/search/route.js
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/user.model';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    
    if (!username || username.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username is required' 
      });
    }
    
    await connectDB();
    
    // Simple exact lookup since usernames are unique
    const user = await User.findOne({ 
      username: username.trim() 
    }).select('username email');
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        displayName: user.username, // Using username as displayName since your model doesn't have it
        totalMatches: 0, // Will be calculated from matches
        wins: 0, // Will be calculated from matches  
        losses: 0 // Will be calculated from matches
      }
    });
    
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error during search' 
    });
  }
}