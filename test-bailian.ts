#!/usr/bin/env npx tsx

/**
 * Comprehensive Bailian Cloud Vector DB Test Runner
 * 
 * This script specifically tests the Bailian retrieval functionality
 * Run with: npx tsx test-bailian.ts
 */

import { config } from 'dotenv';
import { 
  testBailianInit, 
  testBailianRetrieval, 
  testBailianEdgeCases,
  testProductSearch 
} from './lib/ai/test-utils';

// Load environment variables
config({ path: '.env' });

async function runBailianTests() {
  console.log('🌐 Bailian Cloud Vector DB Test Suite');
  console.log('=' .repeat(50));
  console.log(`Workspace ID: ${process.env.BAILIAN_WORKSPACE_ID}`);
  console.log(`Index ID: ${process.env.BAILIAN_INDEX_ID}`);
  console.log(`Cloud Vector DB: ${process.env.USE_CLOUD_VECTOR_DB === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log('=' .repeat(50));
  console.log();

  if (process.env.USE_CLOUD_VECTOR_DB !== 'true') {
    console.log('❌ Cloud vector DB is disabled. Set USE_CLOUD_VECTOR_DB=true to test Bailian.');
    console.log('💡 Current mode will test with mock data only.');
    console.log();
  }

  const allResults: any[] = [];
  const startTime = Date.now();

  try {
    // Test 1: SDK Initialization
    console.log('🚀 Testing Bailian SDK Initialization...');
    const initResult = await testBailianInit();
    allResults.push(initResult);
    
    console.log(`   ${initResult.passed ? '✅' : '❌'} ${initResult.test}`);
    if (initResult.error) {
      console.log(`   Error: ${initResult.error}`);
    }
    console.log();

    // Test 2: Basic Product Search
    console.log('🔍 Testing Basic Product Search...');
    const basicResult = await testProductSearch();
    allResults.push(basicResult);
    
    console.log(`   ${basicResult.passed ? '✅' : '❌'} ${basicResult.test}`);
    if (basicResult.error) {
      console.log(`   Error: ${basicResult.error}`);
    }
    console.log();

    // Test 3: Comprehensive Retrieval (only if cloud is enabled)
    if (process.env.USE_CLOUD_VECTOR_DB === 'true') {
      console.log('🎯 Testing Comprehensive Bailian Retrieval...');
      const retrievalResults = await testBailianRetrieval();
      allResults.push(...retrievalResults);
      
      const passed = retrievalResults.filter(r => r.passed).length;
      console.log(`   Summary: ${passed}/${retrievalResults.length} retrieval tests passed`);
      
      retrievalResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.test} (${result.duration}ms)`);
        
        if (result.passed && result.result) {
          const res = result.result as any;
          console.log(`      → ${res.resultCount} results, avg score: ${res.avgScore?.toFixed(3)}`);
          if (res.sampleResults && res.sampleResults.length > 0) {
            console.log(`      → Sample: "${res.sampleResults[0].product_name}" (score: ${res.sampleResults[0].score.toFixed(3)})`);
          }
        }
        
        if (result.error) {
          console.log(`      → Error: ${result.error}`);
        }
      });
      console.log();

      // Test 4: Edge Cases
      console.log('🧪 Testing Edge Cases...');
      const edgeResults = await testBailianEdgeCases();
      allResults.push(...edgeResults);
      
      const edgePassed = edgeResults.filter(r => r.passed).length;
      console.log(`   Summary: ${edgePassed}/${edgeResults.length} edge case tests passed`);
      
      edgeResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`   ${status} ${result.test} (${result.duration}ms)`);
        if (result.error) {
          console.log(`      → Error: ${result.error}`);
        }
      });
    } else {
      console.log('⏭️  Skipping advanced Bailian tests (cloud vector DB disabled)');
    }

  } catch (error) {
    console.error('💥 Test suite crashed:', error);
  }

  // Final Summary
  const totalTime = Date.now() - startTime;
  const totalTests = allResults.length;
  const totalPassed = allResults.filter(r => r.passed).length;
  
  console.log();
  console.log('📊 FINAL RESULTS');
  console.log('=' .repeat(50));
  console.log(`Tests Run: ${totalTests}`);
  console.log(`Passed: ${totalPassed}`);
  console.log(`Failed: ${totalTests - totalPassed}`);
  console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Avg Time: ${totalTests > 0 ? (totalTime / totalTests).toFixed(0) : 0}ms per test`);
  
  if (totalPassed === totalTests) {
    console.log();
    console.log('🎉 All Bailian tests passed! Your integration is working perfectly.');
  } else {
    console.log();
    console.log('⚠️  Some tests failed. Check the specific errors above.');
    
    const failedTests = allResults.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log();
      console.log('Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   ❌ ${test.test}: ${test.error || 'Unknown error'}`);
      });
    }
  }
  
  console.log('=' .repeat(50));
}

// Run the tests
runBailianTests().catch(console.error);