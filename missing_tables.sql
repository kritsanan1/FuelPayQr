CREATE TABLE IF NOT EXISTS fraud_patterns (
  id SERIAL PRIMARY KEY,
  pattern VARCHAR NOT NULL,
  description TEXT,
  risk_level VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id),
  pattern_id INTEGER REFERENCES fraud_patterns(id),
  risk_score REAL,
  description TEXT,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_api_configs (
  id SERIAL PRIMARY KEY,
  bank_provider_id INTEGER REFERENCES bank_providers(id),
  api_key VARCHAR,
  api_secret VARCHAR,
  merchant_id VARCHAR,
  is_sandbox BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_confirmations (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id),
  bank_reference VARCHAR,
  confirmation_data JSONB,
  confirmed_at TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(10,2),
  status VARCHAR NOT NULL
);

CREATE TABLE IF NOT EXISTS employee_sessions (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id),
  session_token VARCHAR UNIQUE NOT NULL,
  ip_address VARCHAR,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id),
  bank_provider VARCHAR NOT NULL,
  webhook_data JSONB,
  status VARCHAR NOT NULL,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_backups (
  id SERIAL PRIMARY KEY,
  backup_date TIMESTAMP NOT NULL,
  status VARCHAR NOT NULL,
  file_size INTEGER,
  location VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default fraud patterns
INSERT INTO fraud_patterns (pattern, description, risk_level) VALUES
('high_amount', 'Transaction amount unusually high for station', 'medium'),
('rapid_transactions', 'Multiple transactions in short time period', 'high'),
('off_hours', 'Transaction outside normal business hours', 'low'),
('duplicate_phone', 'Same phone number used multiple times', 'medium'),
('suspicious_employee', 'Employee flagged for unusual activity', 'high')
ON CONFLICT DO NOTHING;
