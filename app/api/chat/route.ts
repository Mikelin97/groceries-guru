
import { openai } from '@ai-sdk/openai';
import { streamText, Message, tool } from 'ai';
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { webSearch } from '@/lib/ai/web-search';
import { findRelevantContent } from '@/lib/ai/embedding';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: Message[] } = await req.json();

  // check if user has sent a PDF
  const messagesHavePDF = messages.some(message =>
    message.experimental_attachments?.some(
      a => a.contentType === 'application/pdf',
    ),
  );

  const result = streamText({
    model: messagesHavePDF
      ? anthropic('claude-3-5-sonnet-latest')
      : openai('gpt-4o'),
    system: `You are a helpful assistant with access to two tools: a knowledge base and a web search.

    Tool selection guidelines:
    1. If the user explicitly asks for web search, use the webSearch tool.
    2. If the user explicitly asks about your knowledge base, use the getInformation tool.
    3. For general questions, first check your knowledge base using the getInformation tool.
    4. Only if relevant information isn't found in your knowledge base, fall back to using webSearch.
    5. If neither tool provides useful information, respond with "Sorry, I don't know."
    
    Always cite your sources appropriately, whether from your knowledge base or web search results.`,
    messages,
    tools: {
      webSearch: tool({
        description: `search the web for information to answer questions.`,
        parameters: z.object({
          query: z.string().describe('the users search query'),
        }),
        execute: async ({ query }) => webSearch(query),
      }),
      getInformation: tool({
        description: `get information from your knowledge base to answer questions.`,
        parameters: z.object({
          question: z.string().describe('the users question'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
  });

  return result.toDataStreamResponse();
}