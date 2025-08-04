import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 30;

// Simple language detection based on Chinese characters
function detectLanguageFromMessages(messages: any[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage?.content) return 'en';
  
  // Check if the message contains Chinese characters
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(lastUserMessage.content) ? 'zh' : 'en';
}

export async function POST(req: Request) {
  console.log('Simple Chat: Request received');
  
  try {
    const { messages, language } = await req.json();
    console.log('Simple Chat: Messages:', messages?.length);
    console.log('Simple Chat: Language preference:', language);
    
    if (!messages || messages.length === 0) {
      return new Response('No messages', { status: 400 });
    }

    // Detect language from messages if not provided
    const detectedLanguage = language || detectLanguageFromMessages(messages);
    console.log('Simple Chat: Using language:', detectedLanguage);

    console.log('Simple Chat: Calling OpenAI...');
    
    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      system: `You are a helpful grocery shopping assistant. ${
        detectedLanguage === 'zh' 
          ? 'ALWAYS respond in Chinese (中文). Keep responses short and helpful.' 
          : 'ALWAYS respond in English. Keep responses short and helpful.'
      }`,
    });

    console.log('Simple Chat: Returning stream response');
    return result.toDataStreamResponse();
    
  } catch (error: any) {
    console.error('Simple Chat Error Details:', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      full: error
    });
    
    // Return detailed error information
    const errorMessage = error?.status === 429 
      ? 'OpenAI API quota exceeded. Please check your billing and usage limits.'
      : error?.message || 'Unknown error occurred';
      
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: error?.status,
        type: error?.type || 'unknown'
      }),
      { 
        status: error?.status || 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}