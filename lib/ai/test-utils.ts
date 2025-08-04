// Test utilities for AI functions
import { findRelevantContent } from './embedding';
import { webSearch } from './web-search';

interface TestResult {
  test: string;
  passed: boolean;
  result?: any;
  error?: string;
  duration: number;
}

// Test the Milvus integration
export async function testMilvusSearch(): Promise<TestResult> {
  const startTime = Date.now();
  try {
    console.log('🔍 Testing Milvus search with grocery query...');
    const result = await findRelevantContent('healthy breakfast cereals');
    const duration = Date.now() - startTime;
    
    console.log('Milvus search result:', JSON.stringify(result, null, 2));
    
    return {
      test: 'Milvus Search - Healthy Breakfast Cereals',
      passed: !!(result && (result.success === true || result.results !== undefined)),
      result: result,
      duration
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      test: 'Milvus Search - Healthy Breakfast Cereals',
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
        test: `Milvus Search - ${query}`,
        passed: !!(result && (result.success === true || result.results !== undefined)),
        result: result,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        test: `Milvus Search - ${query}`,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      });
    }
  }
  
  return results;
}

// Run all tests
export async function runAllTests(): Promise<void> {
  console.log('🧪 Starting Groceries Guru AI Tests...\n');
  
  // Test 1: Milvus search
  const milvusTest = await testMilvusSearch();
  console.log(`✅ ${milvusTest.test}: ${milvusTest.passed ? 'PASSED' : 'FAILED'} (${milvusTest.duration}ms)`);
  if (!milvusTest.passed && milvusTest.error) {
    console.log(`   Error: ${milvusTest.error}`);
  }
  console.log();
  
  // Test 2: Web search
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
  const totalTests = 2 + multipleTests.length;
  const totalPassed = (milvusTest.passed ? 1 : 0) + (webSearchTest.passed ? 1 : 0) + passedCount;
  console.log(`   Total: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.');
  }
}