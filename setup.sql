
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY NOT NULL,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
  id VARCHAR PRIMARY KEY,
  name VARCHAR NOT NULL,
  address TEXT,
  phone VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

INSERT INTO stations (id, name, address, phone) 
VALUES ('STATION001', 'Demo Gas Station', '123 Main Street, Bangkok, Thailand', '+66-2-123-4567')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bank_providers (code, name, display_name, api_endpoint) VALUES
('promptpay', 'PromptPay', 'PromptPay', 'https://api.promptpay.io'),
('bbl', 'Bangkok Bank', 'Bangkok Bank', 'https://api.bangkokbank.com'),
('scb', 'Siam Commercial Bank', 'SCB', 'https://api.scb.co.th'),
('kasikorn', 'Kasikornbank', 'K-Bank', 'https://api.kasikornbank.com')
ON CONFLICT (code) DO NOTHING;

