#!/usr/bin/env node
/**
 * Standalone migration runner for production deployments
 * This script is designed to run as a separate ECS task before the main application starts
 */

import { runMigrations } from './migrate';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🚀 Starting database migration runner...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Database URL:', process.env.POSTGRES_URL?.replace(/:[^:@]+@/, ':***@') || 'Not set');

  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is not set');
    process.exit(1);
  }

  try {
    await runMigrations();
    console.log('✅ Database migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, shutting down migration runner...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, shutting down migration runner...');
  process.exit(0);
});

main();