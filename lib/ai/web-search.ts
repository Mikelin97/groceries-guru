
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export const webSearch = async (query: string) => {

  const result = await generateText({
  model: openai.responses('gpt-4o-mini'),
  prompt: query,
  tools: {
    web_search_preview: openai.tools.webSearchPreview(),
  },
});
  return result;
}
