import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

let migrationPromise: Promise<void> | null = null;

export async function runMigrations(): Promise<void> {
  if (migrationPromise) {
    return migrationPromise;
  }

  migrationPromise = (async () => {
    const migrationClient = postgres(process.env.POSTGRES_URL!, { max: 1 });
    
    try {
      console.log('Checking database migration status...');
      
      // Check if drizzle migrations table exists
      const result = await migrationClient`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '__drizzle_migrations'
        );
      `;
      
      const migrationsTableExists = result[0].exists;
      
      // If migrations table doesn't exist, or if we need to check for pending migrations
      if (!migrationsTableExists) {
        console.log('Migrations table not found. Running initial migrations...');
        const migrationDb = drizzle(migrationClient);
        
        await migrate(migrationDb, {
          migrationsFolder: path.join(process.cwd(), 'lib/db/migrations')
        });
        
        console.log('Database migrations completed successfully');
      } else {
        // Check if there are pending migrations by comparing journal
        console.log('Checking for pending migrations...');
        
        const migrationDb = drizzle(migrationClient);
        
        try {
          await migrate(migrationDb, {
            migrationsFolder: path.join(process.cwd(), 'lib/db/migrations')
          });
          console.log('Database is up to date');
        } catch (error) {
          if (error instanceof Error && error.message.includes('No migrations to run')) {
            console.log('Database is up to date');
          } else {
            console.log('Running pending migrations...');
            throw error;
          }
        }
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await migrationClient.end();
    }
  })();

  return migrationPromise;
}