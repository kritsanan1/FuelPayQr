import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employee management
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  employeeId: varchar("employee_id").unique().notNull(),
  stationId: varchar("station_id").notNull(),
  role: varchar("role").notNull().default("employee"), // employee, manager, admin
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gas stations
export const stations = pgTable("stations", {
  id: varchar("id").primaryKey(),
  name: varchar("name").notNull(),
  address: text("address"),
  phone: varchar("phone"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Banking providers
export const bankProviders = pgTable("bank_providers", {
  id: serial("id").primaryKey(),
  code: varchar("code").unique().notNull(), // promptpay, bbl, scb, kasikorn
  name: varchar("name").notNull(),
  displayName: varchar("display_name").notNull(),
  apiEndpoint: varchar("api_endpoint"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bank API configurations
export const bankApiConfigs = pgTable("bank_api_configs", {
  id: serial("id").primaryKey(),
  bankProviderId: integer("bank_provider_id").references(() => bankProviders.id),
  apiKey: varchar("api_key"),
  apiSecret: varchar("api_secret"),
  merchantId: varchar("merchant_id"),
  isSandbox: boolean("is_sandbox").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id").unique().notNull(),
  employeeId: integer("employee_id").references(() => employees.id),
  stationId: varchar("station_id").references(() => stations.id),
  pumpNumber: varchar("pump_number"),
  fuelType: varchar("fuel_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  liters: decimal("liters", { precision: 10, scale: 3 }),
  pricePerLiter: decimal("price_per_liter", { precision: 6, scale: 3 }),
  customerPhone: varchar("customer_phone"),
  status: varchar("status").notNull().default("pending"), // pending, completed, failed, expired
  bankProvider: varchar("bank_provider").notNull(),
  paymentReference: varchar("payment_reference"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// QR Payments
export const qrPayments = pgTable("qr_payments", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id),
  qrCode: text("qr_code").notNull(),
  qrData: jsonb("qr_data").notNull(),
  bankProvider: varchar("bank_provider").notNull(),
  status: varchar("status").notNull().default("active"), // active, used, expired
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Payment confirmations/webhooks
export const paymentConfirmations = pgTable("payment_confirmations", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id),
  bankReference: varchar("bank_reference"),
  confirmationData: jsonb("confirmation_data"),
  confirmedAt: timestamp("confirmed_at").defaultNow(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  status: varchar("status").notNull(), // success, failed
});

// Fraud detection patterns
export const fraudPatterns = pgTable("fraud_patterns", {
  id: serial("id").primaryKey(),
  pattern: varchar("pattern").notNull(),
  description: text("description"),
  riskLevel: varchar("risk_level").notNull(), // low, medium, high, critical
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fraud alerts
export const fraudAlerts = pgTable("fraud_alerts", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id),
  patternId: integer("pattern_id").references(() => fraudPatterns.id),
  riskScore: real("risk_score"),
  description: text("description"),
  status: varchar("status").notNull().default("active"), // active, resolved, dismissed
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Employee sessions for tracking
export const employeeSessions = pgTable("employee_sessions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id),
  sessionToken: varchar("session_token").unique().notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

// Webhook logs
export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").references(() => transactions.id),
  bankProvider: varchar("bank_provider").notNull(),
  webhookData: jsonb("webhook_data"),
  status: varchar("status").notNull(), // received, processed, failed
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily backups tracking
export const dailyBackups = pgTable("daily_backups", {
  id: serial("id").primaryKey(),
  backupDate: timestamp("backup_date").notNull(),
  status: varchar("status").notNull(), // success, failed, in_progress
  fileSize: integer("file_size"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User onboarding and tutorial system
export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
  currentStep: integer("current_step").default(0),
  completedSteps: jsonb("completed_steps").default([]),
  tutorialData: jsonb("tutorial_data").default({}),
  lastActiveStep: timestamp("last_active_step").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tutorial characters and messages
export const tutorialCharacters = pgTable("tutorial_characters", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  role: varchar("role").notNull(), // guide, helper, expert
  avatar: varchar("avatar").notNull(),
  description: text("description"),
  personality: jsonb("personality").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tutorial steps and messages
export const tutorialSteps = pgTable("tutorial_steps", {
  id: serial("id").primaryKey(),
  stepNumber: integer("step_number").notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  characterId: integer("character_id").references(() => tutorialCharacters.id),
  message: text("message").notNull(),
  actionRequired: varchar("action_required"), // click, form, wait, navigate
  targetElement: varchar("target_element"),
  isOptional: boolean("is_optional").default(false),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  employee: one(employees, {
    fields: [users.id],
    references: [employees.userId],
  }),
  onboarding: one(userOnboarding, {
    fields: [users.id],
    references: [userOnboarding.userId],
  }),
}));

export const userOnboardingRelations = relations(userOnboarding, ({ one }) => ({
  user: one(users, {
    fields: [userOnboarding.userId],
    references: [users.id],
  }),
}));

export const tutorialCharactersRelations = relations(tutorialCharacters, ({ many }) => ({
  steps: many(tutorialSteps),
}));

export const tutorialStepsRelations = relations(tutorialSteps, ({ one }) => ({
  character: one(tutorialCharacters, {
    fields: [tutorialSteps.characterId],
    references: [tutorialCharacters.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  station: one(stations, {
    fields: [employees.stationId],
    references: [stations.id],
  }),
  transactions: many(transactions),
  sessions: many(employeeSessions),
}));

export const stationsRelations = relations(stations, ({ many }) => ({
  employees: many(employees),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  employee: one(employees, {
    fields: [transactions.employeeId],
    references: [employees.id],
  }),
  station: one(stations, {
    fields: [transactions.stationId],
    references: [stations.id],
  }),
  qrPayment: one(qrPayments, {
    fields: [transactions.id],
    references: [qrPayments.transactionId],
  }),
  confirmations: many(paymentConfirmations),
  fraudAlerts: many(fraudAlerts),
  webhookLogs: many(webhookLogs),
}));

export const bankProvidersRelations = relations(bankProviders, ({ many }) => ({
  apiConfigs: many(bankApiConfigs),
}));

export const bankApiConfigsRelations = relations(bankApiConfigs, ({ one }) => ({
  bankProvider: one(bankProviders, {
    fields: [bankApiConfigs.bankProviderId],
    references: [bankProviders.id],
  }),
}));

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertEmployee = typeof employees.$inferInsert;
export type Employee = typeof employees.$inferSelect;

export type InsertStation = typeof stations.$inferInsert;
export type Station = typeof stations.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;

export type InsertQRPayment = typeof qrPayments.$inferInsert;
export type QRPayment = typeof qrPayments.$inferSelect;

export type InsertPaymentConfirmation = typeof paymentConfirmations.$inferInsert;
export type PaymentConfirmation = typeof paymentConfirmations.$inferSelect;

export type InsertFraudAlert = typeof fraudAlerts.$inferInsert;
export type FraudAlert = typeof fraudAlerts.$inferSelect;

export type BankProvider = typeof bankProviders.$inferSelect;
export type BankApiConfig = typeof bankApiConfigs.$inferSelect;

export type InsertUserOnboarding = typeof userOnboarding.$inferInsert;
export type UserOnboarding = typeof userOnboarding.$inferSelect;

export type InsertTutorialCharacter = typeof tutorialCharacters.$inferInsert;
export type TutorialCharacter = typeof tutorialCharacters.$inferSelect;

export type InsertTutorialStep = typeof tutorialSteps.$inferInsert;
export type TutorialStep = typeof tutorialSteps.$inferSelect;

// Zod schemas
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertQRPaymentSchema = createInsertSchema(qrPayments);

export const createTransactionSchema = z.object({
  pumpNumber: z.string().min(1, "Pump number is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  liters: z.string().optional(),
  customerPhone: z.string().optional(),
  bankProvider: z.string().min(1, "Bank provider is required"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
