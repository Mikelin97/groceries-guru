import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, activityLogs, teamMembers } from '@/lib/db/schema';
import { comparePasswords, setSession } from '@/lib/auth/session';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  console.log('=== SIGNIN API: Request received ===');
  console.log('User-Agent:', request.headers.get('user-agent'));
  console.log('Host:', request.headers.get('host'));
  console.log('Origin:', request.headers.get('origin'));
  
  try {
    const body = await request.json();
    console.log('Request body received:', { email: body.email ? 'present' : 'missing', password: body.password ? 'present' : 'missing' });
    
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      console.log('Validation failed: missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Looking up user with email:', email.toLowerCase());
    
    // Find user by email
    const user = await db
      .select()
      .from(users)
      .where(and(eq(users.email, email.toLowerCase()), isNull(users.deletedAt)))
      .limit(1);

    console.log('User found:', user.length > 0 ? 'yes' : 'no');

    if (user.length === 0) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Verifying password for user:', user[0].id);
    
    // Verify password
    const isValidPassword = await comparePasswords(password, user[0].passwordHash);
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password');
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
      teamId: userTeam[0]?.teamId || 1, // Default to team 1 if no team found
      userId: user[0].id,
      action: 'SIGN_IN',
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown'
    });

    console.log('Setting session for user:', user[0].id);
    
    // Set session
    await setSession(user[0]);

    console.log('Session set successfully');

    const response = NextResponse.json({
      message: 'Signed in successfully',
      user: {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role
      }
    }, { status: 200 });

    console.log('=== SIGNIN API: Success response sent ===');
    return response;

  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}