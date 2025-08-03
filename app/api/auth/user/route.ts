import { NextResponse } from 'next/server';
import { getUser, getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user's team information
    const team = await getTeamForUser();

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      team: team ? {
        id: team.id,
        name: team.name,
        planName: team.planName,
        subscriptionStatus: team.subscriptionStatus,
        memberCount: team.teamMembers?.length || 0
      } : null
    }, { status: 200 });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}