import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  console.log('=== COOKIE TEST ===');
  console.log('User-Agent:', request.headers.get('user-agent'));
  console.log('Host:', request.headers.get('host'));
  
  const allCookies = await cookies();
  const sessionCookie = allCookies.get('session');
  
  console.log('Session cookie exists:', !!sessionCookie);
  console.log('Session cookie value length:', sessionCookie?.value?.length || 0);
  
  return NextResponse.json({
    hasCookie: !!sessionCookie,
    cookieLength: sessionCookie?.value?.length || 0,
    userAgent: request.headers.get('user-agent'),
    host: request.headers.get('host')
  });
}

export async function POST(request: NextRequest) {
  console.log('=== SETTING TEST COOKIE ===');
  
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
  };
  
  console.log('Setting test cookie with options:', cookieOptions);
  
  (await cookies()).set('test-cookie', 'test-value-' + Date.now(), cookieOptions);
  
  return NextResponse.json({
    message: 'Test cookie set',
    secure: cookieOptions.secure,
    environment: process.env.NODE_ENV
  });
}