-- Create onboarding tables
CREATE TABLE IF NOT EXISTS user_onboarding (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id) NOT NULL,
  has_completed_onboarding BOOLEAN DEFAULT false,
  current_step INTEGER DEFAULT 0,
  completed_steps JSONB DEFAULT '[]',
  tutorial_data JSONB DEFAULT '{}',
  last_active_step TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutorial_characters (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  avatar VARCHAR NOT NULL,
  description TEXT,
  personality JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutorial_steps (
  id SERIAL PRIMARY KEY,
  step_number INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  character_id INTEGER REFERENCES tutorial_characters(id),
  message TEXT NOT NULL,
  action_required VARCHAR,
  target_element VARCHAR,
  is_optional BOOLEAN DEFAULT false,
  order_num INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Thai fuel station themed characters
INSERT INTO tutorial_characters (name, role, avatar, description, personality) VALUES
('Niran', 'guide', '🧑‍🏭', 'A friendly fuel station manager who knows everything about the GasPay QR system', '{"traits": ["helpful", "patient", "encouraging"], "greeting": "สวัสดีครับ! (Hello!)", "catchphrase": "Let me show you the way!"}'),
('Malee', 'helper', '👩‍💼', 'An expert cashier who specializes in QR payments and customer service', '{"traits": ["detail-oriented", "cheerful", "efficient"], "greeting": "ยินดีที่ได้รู้จักค่ะ! (Nice to meet you!)", "catchphrase": "Every transaction matters!"}'),
('Somchai', 'expert', '👨‍🔧', 'A tech-savvy engineer who handles the technical aspects and troubleshooting', '{"traits": ["analytical", "resourceful", "calm"], "greeting": "เฮ้ยครับ! (Hey there!)", "catchphrase": "Technology made simple!"}')
ON CONFLICT DO NOTHING;

-- Insert tutorial steps with Thai cultural context
INSERT INTO tutorial_steps (step_number, title, description, character_id, message, action_required, target_element, is_optional, order_num) VALUES
(1, 'Welcome to GasPay QR!', 'Get started with your Thai fuel station payment system', 1, 'สวัสดีครับ! Welcome to GasPay QR - Thailand''s most advanced fuel station payment system! I''m Niran, and I''ll be your guide. Ready to learn how to make fuel payments as easy as ordering som tam? 🥗', 'click', '#welcome-button', false, 1),

(2, 'Meet Your Dashboard', 'Explore the main control center', 1, 'This is your dashboard - your command center! Here you can see today''s sales, recent transactions, and system status. Think of it as your digital cash register, but much smarter! Let''s take a look around.', 'navigate', '#dashboard', false, 2),

(3, 'Creating Your First QR Payment', 'Learn to generate QR codes for customers', 2, 'ยินดีที่ได้รู้จักค่ะ! I''m Malee, and I''ll show you how to create QR payments. It''s easier than making pad thai! Just fill in the fuel details and choose a Thai bank - PromptPay, Bangkok Bank, SCB, or K-Bank.', 'form', '#qr-generator', false, 3),

(4, 'Understanding Thai Banking Options', 'Learn about different payment methods', 2, 'In Thailand, we support all major banks! PromptPay is universal and works with any Thai bank account. Bangkok Bank, SCB, and Kasikorn Bank have their own QR systems too. Choose what your customer prefers!', 'click', '#bank-selector', false, 4),

(5, 'Monitoring Payment Status', 'Track transactions in real-time', 3, 'เฮ้ยครับ! I''m Somchai. Now let me show you the tech magic! Once you generate a QR code, you can monitor the payment status in real-time. Watch for the green checkmark when payment is confirmed!', 'wait', '#payment-monitor', false, 5),

(6, 'Fraud Detection System', 'Stay safe with automatic alerts', 3, 'Our AI watches for suspicious activities 24/7 - like multiple rapid transactions or unusually high amounts. If something looks fishy (more suspicious than week-old pla ra), you''ll get an alert immediately!', 'click', '#fraud-alerts', false, 6),

(7, 'Transaction History', 'Review and manage past payments', 2, 'Keep track of everything! Your transaction history shows all payments, dates, amounts, and customer details. Perfect for end-of-day reconciliation or checking last month''s sales. Very convenient ka!', 'navigate', '#transaction-history', false, 7),

(8, 'Mobile-Friendly Design', 'Use on any device', 1, 'GasPay QR works perfectly on mobile, tablet, or computer! Whether you''re at the pump or in the office, everything is just a tap away. Modern technology for modern Thai businesses!', 'tap', '#mobile-demo', true, 8),

(9, 'Getting Help', 'Know where to find support', 1, 'If you ever need help, click the help button or look for our friendly characters - we''re always here! Remember: practice makes perfect, just like learning to make perfect tom yum goong! 🍲', 'click', '#help-button', true, 9),

(10, 'Congratulations!', 'You''re ready to use GasPay QR', 1, 'เยี่ยมมาก! (Excellent!) You''ve completed the onboarding! You''re now ready to handle QR payments like a pro. Welcome to the future of Thai fuel station payments! ขอให้โชคดีครับ! (Good luck!)', 'complete', null, false, 10)
ON CONFLICT DO NOTHING;
