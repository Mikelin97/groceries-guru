import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      openai_key: !!process.env.OPENAI_API_KEY,
      anthropic_key: !!process.env.ANTHROPIC_API_KEY,
      node_env: process.env.NODE_ENV,
    },
    services: {
      postgres: !!process.env.POSTGRES_URL,
      redis: !!process.env.REDIS_URL,
    }
  };

  return NextResponse.json(health);
}