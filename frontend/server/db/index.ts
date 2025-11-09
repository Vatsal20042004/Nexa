import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Using a dummy connection string as we're using the FastAPI backend instead
const connectionString = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/dummy';

// Only initialize if DATABASE_URL is properly configured
let db: ReturnType<typeof drizzle> | null = null;

if (connectionString.includes('@')) {
  try {
    const sql = neon(connectionString);
    db = drizzle(sql, { schema });
  } catch (error) {
    console.warn('Database connection not configured, using FastAPI backend instead');
  }
}

export { db };
