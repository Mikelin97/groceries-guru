import { NextRequest, NextResponse } from 'next/server';
import { findRelevantContent } from '@/lib/ai/embedding';
import { webSearch } from '@/lib/ai/web-search';

// Test endpoint for AI functions
export async function POST(req: NextRequest) {
  try {
    const { query, testType } = await req.json();
    
    if (!query || !testType) {
      return NextResponse.json(
        { error: 'Missing query or testType parameter' },
        { status: 400 }
      );
    }

    let result;
    const startTime = Date.now();

    switch (testType) {
      case 'milvus':
        console.log(`Testing Milvus search for: "${query}"`);
        result = await findRelevantContent(query);
        break;
        
      case 'websearch':
        console.log(`Testing web search for: "${query}"`);
        result = await webSearch(query);
        break;
        
      case 'both':
        console.log(`Testing both Milvus and web search for: "${query}"`);
        const [milvusResult, webResult] = await Promise.all([
          findRelevantContent(query),
          webSearch(query)
        ]);
        result = {
          milvus: milvusResult,
          webSearch: webResult
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid testType. Use: milvus, websearch, or both' },
          { status: 400 }
        );
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      query,
      testType,
      result,
      duration,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for simple health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Groceries Guru AI Test API is running',
    timestamp: new Date().toISOString(),
    availableTests: ['milvus', 'websearch', 'both']
  });
}