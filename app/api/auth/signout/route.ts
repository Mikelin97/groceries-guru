import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/drizzle';
import { activityLogs, teamMembers } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    // Get current user before clearing session
    const user = await getUser();
    
    if (user) {
      // Get user's team
      const userTeam = await db
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, user.id))
        .limit(1);

      // Log the signout activity
      await db.insert(activityLogs).values({
        teamId: userTeam[0]?.teamId || null,
        userId: user.id,
        action: 'SIGN_OUT',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      });
    }

    // Clear session cookie
    (await cookies()).set('session', '', {
      expires: new Date(0),
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    });

    return NextResponse.json({
      message: 'Signed out successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}