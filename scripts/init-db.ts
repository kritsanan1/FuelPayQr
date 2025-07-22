import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// Configure WebSocket for Neon
const neonConfig = { webSocketConstructor: ws };

async function initializeDatabase() {
  try {
    // Clean the DATABASE_URL
    let databaseUrl = process.env.DATABASE_URL!;
    
    // Remove psql command wrapper if present
    if (databaseUrl.startsWith("psql '") && databaseUrl.endsWith("'")) {
      databaseUrl = databaseUrl.slice(6, -1);
    } else if (databaseUrl.startsWith('psql ')) {
      databaseUrl = databaseUrl.slice(5);
    }

    console.log('🔗 Connecting to database...');
    const pool = new Pool({ connectionString: databaseUrl });
    const db = drizzle({ client: pool, schema });

    console.log('📋 Creating tables...');
    
    // Create sessions table first (required for authentication)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);
    `);

    // Create other essential tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY NOT NULL,
        email VARCHAR UNIQUE,
        first_name VARCHAR,
        last_name VARCHAR,
        profile_image_url VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stations (
        id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        address TEXT,
        phone VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR REFERENCES users(id),
        employee_id VARCHAR UNIQUE NOT NULL,
        station_id VARCHAR NOT NULL,
        role VARCHAR NOT NULL DEFAULT 'employee',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_providers (
        id SERIAL PRIMARY KEY,
        code VARCHAR UNIQUE NOT NULL,
        name VARCHAR NOT NULL,
        display_name VARCHAR NOT NULL,
        api_endpoint VARCHAR,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR UNIQUE NOT NULL,
        employee_id INTEGER REFERENCES employees(id),
        station_id VARCHAR REFERENCES stations(id),
        pump_number VARCHAR,
        fuel_type VARCHAR NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        liters DECIMAL(10,3),
        price_per_liter DECIMAL(6,3),
        customer_phone VARCHAR,
        status VARCHAR NOT NULL DEFAULT 'pending',
        bank_provider VARCHAR NOT NULL,
        payment_reference VARCHAR,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS qr_payments (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES transactions(id),
        qr_code TEXT NOT NULL,
        qr_data JSONB NOT NULL,
        bank_provider VARCHAR NOT NULL,
        status VARCHAR NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      );
    `);

    // Insert default data
    console.log('📊 Inserting default data...');
    
    // Default stations
    await pool.query(`
      INSERT INTO stations (id, name, address, phone) 
      VALUES ('STATION001', 'Demo Gas Station', '123 Main Street, Bangkok, Thailand', '+66-2-123-4567')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Default bank providers
    await pool.query(`
      INSERT INTO bank_providers (code, name, display_name, api_endpoint) VALUES
      ('promptpay', 'PromptPay', 'PromptPay', 'https://api.promptpay.io'),
      ('bbl', 'Bangkok Bank', 'Bangkok Bank', 'https://api.bangkokbank.com'),
      ('scb', 'Siam Commercial Bank', 'SCB', 'https://api.scb.co.th'),
      ('kasikorn', 'Kasikornbank', 'K-Bank', 'https://api.kasikornbank.com')
      ON CONFLICT (code) DO NOTHING;
    `);

    console.log('✅ Database initialized successfully!');
    console.log('📋 Tables created:');
    console.log('  - sessions (authentication)');
    console.log('  - users (Replit Auth)'); 
    console.log('  - employees (staff management)');
    console.log('  - stations (gas stations)');
    console.log('  - transactions (fuel purchases)');
    console.log('  - qr_payments (QR codes)');
    console.log('  - bank_providers (Thai banks)');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();