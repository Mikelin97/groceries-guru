
import { openai } from '@ai-sdk/openai';
import { streamText, Message, tool } from 'ai';
import { z } from 'zod';
import { anthropic } from '@ai-sdk/anthropic';
import { webSearch } from '@/lib/ai/web-search';
import { findRelevantContent } from '@/lib/ai/embedding';
import { ChatHistoryService } from '@/lib/chat/history-service';
import { getUser } from '@/lib/db/queries';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const chatHistoryService = new ChatHistoryService();

// Simple language detection based on Chinese characters
function detectLanguageFromMessages(messages: Message[]): string {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (!lastUserMessage?.content) return 'en';
  
  // Check if the message contains Chinese characters
  const chineseRegex = /[\u4e00-\u9fff]/;
  return chineseRegex.test(lastUserMessage.content) ? 'zh' : 'en';
}

export async function POST(req: Request) {
  try {
    console.log('Chat API: Received request');
    const body = await req.json();
    console.log('Full request body:', JSON.stringify(body, null, 2));
    const { messages, language, conversationId }: { 
      messages: Message[]; 
      language?: string;
      conversationId?: number;
    } = body;
    console.log('Chat API: Messages received:', messages.length);
    console.log('Chat API: Language preference:', language);
    console.log('Chat API: Conversation ID:', conversationId);

    // Get authenticated user
    const user = await getUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }


  // check if user has sent a PDF
  const messagesHavePDF = messages.some(message =>
    message.experimental_attachments?.some(
      a => a.contentType === 'application/pdf',
    ),
  );

  // Detect language from messages if not provided
  const detectedLanguage = language || detectLanguageFromMessages(messages);
  console.log('Chat API: Using language:', detectedLanguage);

  // Handle conversation persistence
  let currentConversationId = conversationId;
  
  // If no conversation ID provided and we have messages, create a new conversation
  if (!currentConversationId && messages.length > 0) {
    try {
      const conversation = await chatHistoryService.createConversation(
        user.id,
        undefined, // teamId - can be added later for team features
        detectedLanguage
      );
      currentConversationId = conversation.id;
      console.log('Created new conversation:', currentConversationId);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      // Continue without persistence rather than failing the chat
    }
  }

  // Store user message to Redis only during chat
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  if (currentConversationId && lastUserMessage) {
    try {
      await chatHistoryService.addMessageToRedis(currentConversationId, {
        role: lastUserMessage.role,
        content: lastUserMessage.content,
        attachments: lastUserMessage.experimental_attachments,
        metadata: { timestamp: new Date() }
      });
    } catch (error) {
      console.error('Failed to store user message to Redis:', error);
    }
  }

  const result = streamText({
    model: messagesHavePDF
      ? anthropic('claude-3-5-sonnet-latest')
      : openai('gpt-4o'),
    system: `You are Groceries Guru, an expert AI shopping assistant specializing in grocery and food products. Your goal is to help users make informed purchasing decisions by providing personalized recommendations based on their preferences, dietary restrictions, and needs.

    ## Language Instructions:
    - The user's preferred language is: ${detectedLanguage === 'zh' ? 'Chinese (中文)' : 'English'}
    - ${detectedLanguage === 'zh' 
        ? 'ALWAYS respond in Chinese (中文). Provide product names in both Chinese and English when helpful. Include Chinese brand names when available.'
        : 'ALWAYS respond in English. You may include Chinese product names in parentheses when relevant for Chinese products.'
    }
    - Be natural and conversational in the target language

    ## Your Role & Personality:
    - You are a friendly, knowledgeable grocery expert who has extensive knowledge of food products, brands, ingredients, and nutrition
    - You provide helpful, practical advice like a trusted friend who knows about grocery shopping
    - You're enthusiastic about helping people find the best products for their specific needs
    - You support both English and Chinese languages naturally

    ## Core Capabilities:
    1. **Product Recommendations**: Suggest specific products with brands, prices, and key benefits
    2. **Ingredient Analysis**: Help users understand nutritional information and ingredients
    3. **Dietary Assistance**: Provide alternatives for dietary restrictions (gluten-free, vegan, low-sodium, etc.)
    4. **Price Comparison**: Help users find value for money options
    5. **Health & Nutrition**: Offer guidance on healthier choices and nutritional benefits

    ## Tool Usage Guidelines:
    1. **Product Queries**: Use getInformation tool first to check your knowledge base for product information, reviews, and recommendations
       - **IMPORTANT**: When using getInformation, ALWAYS provide the query in Chinese characters for best results
       - Examples: Use "魔芋爽" instead of "konjac snacks", "燕麦奶" instead of "oat milk", "健康零食" instead of "healthy snacks"
       - The knowledge base is optimized for Chinese product names and terms
    2. **Current Info**: Use webSearch for latest prices, new products, recalls, or current market information
    3. **Specific Brands**: Use webSearch if asked about very specific or new brands not in your knowledge base
    4. **Always prioritize your knowledge base first, then supplement with web search if needed**

    ## Response Format:
    - Always provide 3-5 specific product recommendations when asked about a category
    - Include: Product name, brand, estimated price range, key highlights (2-3 benefits)
    - Mention ratings or review insights when available
    - Suggest alternatives for different budgets or dietary needs
    - Keep responses conversational and helpful

    ## Important Guidelines:
    - Never recommend products that could be harmful or inappropriate
    - Always mention if you don't have recent pricing information
    - Encourage users to check current prices and availability at their local stores
    - If asked about non-grocery items, politely redirect to grocery and food products
    - Be transparent about your limitations and always prioritize user safety

    Remember: You're here to make grocery shopping easier and more informed for every user!`,
      messages,
    tools: {
      webSearch: tool({
        description: `Search the web for current grocery product information, prices, availability, recalls, or new product launches. Use this for up-to-date information not in your knowledge base.`,
        parameters: z.object({
          query: z.string().describe('the grocery-related search query (e.g., "organic oat milk brands 2024", "gluten free bread recalls")'),
        }),
        execute: async ({ query }) => webSearch(query),
      }),
      getInformation: tool({
        description: `Search your grocery product knowledge base for product information, reviews, nutritional data, and user recommendations. Use this first for most grocery product queries. IMPORTANT: Always use Chinese product names/terms for best search results (e.g., "魔芋爽" for konjac snacks, "燕麦奶" for oat milk).`,
        parameters: z.object({
          question: z.string().describe('the grocery product question in Chinese characters for optimal results (e.g., "魔芋爽", "健康零食", "燕麦奶")'),
        }),
        execute: async ({ question }) => findRelevantContent(question),
      }),
    },
    onFinish: async (result) => {
      // Store assistant's response to Redis only during chat
      if (currentConversationId && result.text) {
        try {
          await chatHistoryService.addMessageToRedis(currentConversationId, {
            role: 'assistant',
            content: result.text,
            toolInvocations: result.toolCalls,
            metadata: { 
              timestamp: new Date(),
              usage: result.usage,
              finishReason: result.finishReason
            }
          });
          console.log('Stored assistant response to Redis for conversation:', currentConversationId);
        } catch (error) {
          console.error('Failed to store assistant response to Redis:', error);
        }
      }
    }
  });

    console.log('Chat API: Streaming response started');
    
    // Add conversation ID to the response headers for client tracking
    const response = result.toDataStreamResponse();
    if (currentConversationId) {
      response.headers.set('X-Conversation-Id', currentConversationId.toString());
    }
    
    return response;
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}