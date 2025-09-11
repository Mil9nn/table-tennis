import { NextRequest, NextResponse } from 'next/server';
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
    
    const user = await User.findOne({ 
      username: username.trim() 
    }).select('username email fullName');
    
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' });
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        _id: user._id,
        userId: user._id,
        username: user.username,
        email: user.email,
        displayName: user.fullName,
        fullName: user.fullName,
        totalMatches: 0,
        wins: 0,
        losses: 0
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