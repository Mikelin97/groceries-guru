# Groceries Guru Testing Guide

## Overview
This document outlines the testing approach for the Groceries Guru AI shopping assistant application.

## Testing Architecture

### 1. AI Function Tests
Location: `lib/ai/test-utils.ts`

**Tests Include:**
- Milvus vector database search functionality
- Web search integration
- Multiple grocery query handling
- Error handling and edge cases

**Run Tests:**
```bash
npm run test:ai
```

### 2. API Endpoint Tests
Location: `app/api/test-chat/route.ts`

**Features:**
- Individual function testing (Milvus, Web Search)
- Combined testing (both functions)
- Performance timing
- Error reporting

**Test Endpoint:**
```
POST /api/test-chat
{
  "query": "healthy breakfast cereals",
  "testType": "milvus" | "websearch" | "both"
}
```

### 3. Interactive Testing (Debug Panel)
Location: Chat page debug panel

**Features:**
- Real-time testing through UI
- Quick test buttons for common queries
- Live result display
- Error visualization

**Access:** Navigate to `/chat` and click "Show Debug"

## Test Categories

### Grocery Product Queries
- Breakfast cereals
- Dairy products
- Snacks and bars
- Beverages
- Organic products
- Dietary restriction alternatives

### Edge Cases
- Empty queries
- Non-food related queries
- Very specific brand requests
- Multiple dietary restrictions
- Price-focused queries

### Performance Tests
- Response time measurement
- Concurrent query handling
- Large result set processing
- Error recovery

## Sample Test Queries

### Basic Product Categories
```
- "healthy breakfast cereals"
- "gluten free bread"
- "organic oat milk"
- "high protein snacks"
- "low sodium soup"
```

### Dietary Restrictions
```
- "vegan protein bars"
- "keto-friendly snacks"
- "dairy-free ice cream"
- "sugar-free beverages"
- "paleo breakfast options"
```

### Specific Needs
```
- "budget-friendly organic vegetables"
- "high fiber cereals under $5"
- "plant-based milk alternatives"
- "probiotic yogurt options"
```

## Expected Results

### Milvus Search
- Should return structured product data
- Include: product_name, brand, category, price_range, rating
- Handle errors gracefully when database is unavailable

### Web Search
- Should return current market information
- Include: pricing, availability, reviews, comparisons
- Enhanced with grocery-specific context

### Combined Results
- Prioritize knowledge base, supplement with web data
- Provide comprehensive product recommendations
- Include both historical data and current market info

## Debugging

### Common Issues
1. **Milvus Connection**: Check if vector database is running
2. **API Rate Limits**: Web search may be rate-limited
3. **Model Availability**: Ensure OpenAI/Anthropic APIs are accessible
4. **Network Issues**: Check connectivity for web searches

### Debug Information
- Check browser console for detailed error messages
- Use debug panel for real-time testing
- Monitor network tab for API response details
- Review server logs for backend errors

## Future Enhancements

### Planned Tests
- Unit tests for individual components
- Integration tests for full chat flow
- Load testing for concurrent users
- A/B testing for recommendation quality

### Metrics to Track
- Response accuracy
- User satisfaction with recommendations
- Query processing time
- Error rates by query type

## Contributing

When adding new features:
1. Add corresponding tests to `test-utils.ts`
2. Update test queries in the debug panel
3. Document expected behavior
4. Include edge case handling