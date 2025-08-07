import { NextRequest, NextResponse } from 'next/server';
import { ChatHistoryService } from '@/lib/chat/history-service';

const chatHistoryService = new ChatHistoryService();

export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by cron jobs or internal services
    // For security, you might want to add API key authentication here
    
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.INTERNAL_API_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await chatHistoryService.syncPendingMessages();

    return NextResponse.json({
      success: true,
      processed: result.processed,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat history sync error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        success: false,
        processed: 0,
        errors: 1 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check endpoint for sync service
    return NextResponse.json({
      status: 'healthy',
      service: 'chat-history-sync',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Service check failed' },
      { status: 500 }
    );
  }
}