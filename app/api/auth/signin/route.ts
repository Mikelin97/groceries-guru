import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, teamMembers } from '@/lib/db/schema';
import { comparePasswords, setSession } from '@/lib/auth/session';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user[0].passwordHash);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user's team
    const userTeam = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user[0].id))
      .limit(1);

    // Log the signin activity
    await db.insert(activityLogs).values({
      teamId: userTeam[0]?.teamId || null,
      userId: user[0].id,
      action: 'SIGN_IN',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    });

    // Set session
    await setSession(user[0]);

    return NextResponse.json({
      message: 'Signed in successfully',
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}