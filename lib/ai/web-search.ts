
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const webSearch = async (query: string) => {
  try {
    // Enhance the query with grocery-specific context
    const enhancedQuery = `grocery food product ${query} reviews ratings prices nutritional information`;

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Search for current information about: ${enhancedQuery}
      
      Focus on:
      - Product availability and pricing
      - Recent reviews and ratings
      - Nutritional information
      - Brand comparisons
      - Any recalls or safety information
      - Store availability
      
      Provide specific, actionable information that would help someone make a grocery shopping decision.`,
      tools: {
        web_search_preview: openai.tools.webSearchPreview(),
      },
    });

    return {
      success: true,
      content: result.text,
      query: query,
      enhanced_query: enhancedQuery
    };

  } catch (error) {
    console.error('Web search error:', error);
    return {
      success: false,
      content: "Unable to search the web for current product information at this time.",
      query: query,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
