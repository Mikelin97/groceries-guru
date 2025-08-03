import { openai } from '@ai-sdk/openai';
import { streamText, Message } from 'ai';

// Simple chat without tools for debugging
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log('Simple Chat API: Received request');
    const { messages }: { messages: Message[] } = await req.json();
    console.log('Simple Chat API: Messages:', messages.length);

    if (!messages || messages.length === 0) {
      throw new Error('No messages provided');
    }

    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: `You are Groceries Guru, a friendly AI assistant that helps with grocery shopping. 
      
      Provide helpful advice about:
      - Product recommendations
      - Nutritional information
      - Shopping tips
      - Dietary alternatives
      
      Keep responses concise and helpful. Always suggest 2-3 specific products when relevant.`,
      messages,
    });

    console.log('Simple Chat API: Streaming response started');
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Simple Chat API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Chat API error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}