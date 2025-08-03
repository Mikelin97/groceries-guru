#!/usr/bin/env tsx
// Simple test runner for AI functions

import { runAllTests } from './lib/ai/test-utils';

async function main() {
  console.log('🛒 Groceries Guru AI Function Tests\n');
  console.log('Testing AI components with grocery-focused queries...\n');
  
  try {
    await runAllTests();
  } catch (error) {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { main };