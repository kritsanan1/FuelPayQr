import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Initialize database connection only if DATABASE_URL is provided
let pool: Pool | null = null;
let db: any = null;

if (process.env.DATABASE_URL) {
  // Clean the DATABASE_URL in case it has extra formatting
  let databaseUrl = process.env.DATABASE_URL;
  
  // Remove psql command wrapper if present
  if (databaseUrl.startsWith("psql '") && databaseUrl.endsWith("'")) {
    databaseUrl = databaseUrl.slice(6, -1);
  } else if (databaseUrl.startsWith('psql ')) {
    databaseUrl = databaseUrl.slice(5);
  }
  
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
  console.log('✓ Connected to PostgreSQL database');
} else {
  console.log('ℹ No DATABASE_URL found, using in-memory storage');
}

export { pool, db };