// Test utilities for AI functions
import { findRelevantContent } from './embedding';
import { webSearch } from './web-search';
import { initializeCloudVectorDB } from './vector-search';

interface TestResult {
  test: string;
  passed: boolean;
  result?: any;
  error?: string;
  duration: number;
}

// Test Bailian SDK initialization
export async function testBailianInit(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    if (process.env.USE_CLOUD_VECTOR_DB !== 'true') {
      return {
        test: 'Bailian SDK Initialization',
        passed: true,
        result: 'Skipped - cloud vector DB disabled',
        duration: Date.now() - startTime
      };
    }

    console.log('🚀 Testing Bailian initialization...');
    await initializeCloudVectorDB();
    const duration = Date.now() - startTime;
    
    return {
      test: 'Bailian SDK Initialization',
      passed: true,
      result: 'Bailian SDK initialized and credentials validated',
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      test: 'Bailian SDK Initialization',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Test the product search functionality
export async function testProductSearch(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const searchMode = process.env.USE_CLOUD_VECTOR_DB === 'true' ? 'Bailian' : 'Mock';
    console.log(`🔍 Testing ${searchMode} product search with grocery query...`);
    
    const result = await findRelevantContent('魔芋爽');
    const duration = Date.now() - startTime;
    
    console.log(`${searchMode} search result:`, JSON.stringify(result, null, 2));
    
    return {
      test: `Product Search (${searchMode}) - 魔芋爽`,
      passed: !!(result && result.success === true && result.results && result.results.length > 0),
      result: result,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      test: 'Product Search - Healthy Breakfast Cereals',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Test the web search integration
export async function testWebSearch(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('🌐 Testing web search with grocery query...');
    const result = await webSearch('best organic oat milk brands 2024');
    const duration = Date.now() - startTime;
    
    console.log('Web search result:', JSON.stringify(result, null, 2));
    
    return {
      test: 'Web Search - Organic Oat Milk Brands',
      passed: !!(result && result.success === true && result.content && result.content.length > 0),
      result: result,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      test: 'Web Search - Organic Oat Milk Brands',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Test multiple grocery queries
export async function testMultipleQueries(): Promise<TestResult[]> {
  const queries = [
    'gluten free bread',
    'high protein snacks',
    'organic vegetables',
    'dairy free milk alternatives',
    'low sodium soup'
  ];
  
  const results: TestResult[] = [];
  
  for (const query of queries) {
    const startTime = Date.now();
    try {
      console.log(`🔍 Testing query: "${query}"`);
      const result = await findRelevantContent(query);
      const duration = Date.now() - startTime;
      
      results.push({
        test: `Product Search - ${query}`,
        passed: !!(result && result.success === true && result.results && result.results.length > 0),
        result: result,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        test: `Product Search - ${query}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }
  
  return results;
}

// Test Bailian retrieval with multiple grocery queries
export async function testBailianRetrieval(): Promise<TestResult[]> {
  const testQueries = [
    '魔芋爽',
  ];
  
  const results: TestResult[] = [];
  
  for (const query of testQueries) {
    const startTime = Date.now();
    try {
      console.log(`🔍 Testing Bailian retrieval for: "${query}"`);
      const result = await findRelevantContent(query);
      const duration = Date.now() - startTime;
      
      const passed = !!(
        result && 
        result.success === true && 
        result.results && 
        result.results.length > 0 &&
        result.results.some(r => r.score > 0) // Check that we got actual scores
      );
      
      results.push({
        test: `Bailian Retrieval - "${query}"`,
        passed,
        result: {
          success: result.success,
          resultCount: result.results?.length || 0,
          avgScore: result.results?.reduce((sum, r) => sum + r.score, 0) / (result.results?.length || 1),
          hasContent: result.results?.some(r => r.content && r.content.length > 0) || false,
          sampleResults: result.results?.slice(0, 2).map(r => ({
            content: r.content.substring(0, 100) + '...',
            score: r.score,
            product_name: r.product_name
          }))
        },
        duration
      });
      
      if (passed) {
        console.log(`✅ Found ${result.results.length} results with avg score: ${(result.results.reduce((sum, r) => sum + r.score, 0) / result.results.length).toFixed(3)}`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        test: `Bailian Retrieval - "${query}"`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
    
    // Small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return results;
}

// Test edge cases and error handling for Bailian
export async function testBailianEdgeCases(): Promise<TestResult[]> {
  const edgeCases = [
    { query: '', name: 'Empty Query' },
    { query: 'a', name: 'Single Character' },
    { query: '你好健康食品', name: 'Chinese Query' },
    { query: 'xyz123nonexistentproduct456', name: 'Non-existent Product' },
    { query: 'organic sustainable eco-friendly gluten-free vegan protein-rich superfood breakfast', name: 'Very Long Query' }
  ];
  
  const results: TestResult[] = [];
  
  for (const testCase of edgeCases) {
    const startTime = Date.now();
    try {
      console.log(`🧪 Testing edge case: ${testCase.name}`);
      const result = await findRelevantContent(testCase.query);
      const duration = Date.now() - startTime;
      
      // For edge cases, we mainly want to ensure no crashes
      const passed = !!(result && typeof result.success === 'boolean');
      
      results.push({
        test: `Edge Case - ${testCase.name}`,
        passed,
        result: {
          success: result.success,
          resultCount: result.results?.length || 0,
          hasError: !!result.error,
          message: result.message || result.error || 'No message'
        },
        duration
      });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        test: `Edge Case - ${testCase.name}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Run all tests
export async function runAllTests(): Promise<void> {
  console.log('🧪 Starting Groceries Guru AI Tests...\n');
  
  // Test 1: Bailian initialization (if enabled)
  const bailianTest = await testBailianInit();
  console.log(`✅ ${bailianTest.test}: ${bailianTest.passed ? 'PASSED' : 'FAILED'} (${bailianTest.duration}ms)`);
  if (!bailianTest.passed && bailianTest.error) {
    console.log(`   Error: ${bailianTest.error}`);
  }
  console.log();
  
  // Test 2: Product search
  const productTest = await testProductSearch();
  console.log(`✅ ${productTest.test}: ${productTest.passed ? 'PASSED' : 'FAILED'} (${productTest.duration}ms)`);
  if (!productTest.passed && productTest.error) {
    console.log(`   Error: ${productTest.error}`);
  }
  console.log();
  
  // Test 3: Web search
  const webSearchTest = await testWebSearch();
  console.log(`✅ ${webSearchTest.test}: ${webSearchTest.passed ? 'PASSED' : 'FAILED'} (${webSearchTest.duration}ms)`);
  if (!webSearchTest.passed && webSearchTest.error) {
    console.log(`   Error: ${webSearchTest.error}`);
  }
  console.log();
  
  // Test 3: Multiple queries
  console.log('🔍 Testing multiple grocery queries...');
  const multipleTests = await testMultipleQueries();
  const passedCount = multipleTests.filter(t => t.passed).length;
  console.log(`✅ Multiple Queries: ${passedCount}/${multipleTests.length} passed`);
  
  multipleTests.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`   ${status} ${test.test} (${test.duration}ms)`);
    if (!test.passed && test.error) {
      console.log(`      Error: ${test.error}`);
    }
  });
  
  console.log('\n🧪 Test Summary:');
  const totalTests = 3 + multipleTests.length;
  const totalPassed = (bailianTest.passed ? 1 : 0) + (productTest.passed ? 1 : 0) + (webSearchTest.passed ? 1 : 0) + passedCount;
  console.log(`   Total: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}