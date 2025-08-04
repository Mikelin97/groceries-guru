import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users, teams, teamMembers, activityLogs } from '@/lib/db/schema';
import { hashPassword, setSession } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    
    const newUser = await db
      .insert(users)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'member'
      })
      .returning();

    if (newUser.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create a default team for the user
    const newTeam = await db
      .insert(teams)
      .values({
        name: `${name}'s Team`
      })
      .returning();

    if (newTeam.length > 0) {
      // Add user to the team as owner
      await db.insert(teamMembers).values({
        userId: newUser[0].id,
        teamId: newTeam[0].id,
        role: 'owner'
      });
    }

    // Log the signup activity only if team was created
    if (newTeam[0]?.id) {
      await db.insert(activityLogs).values({
        teamId: newTeam[0].id,
        userId: newUser[0].id,
        action: 'SIGN_UP',
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      });
    }

    // Set session
    await setSession(newUser[0]);

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        role: newUser[0].role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}