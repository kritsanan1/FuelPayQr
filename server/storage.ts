import {
  users,
  employees,
  stations,
  transactions,
  qrPayments,
  paymentConfirmations,
  fraudAlerts,
  fraudPatterns,
  bankProviders,
  bankApiConfigs,
  employeeSessions,
  webhookLogs,
  dailyBackups,
  type User,
  type UpsertUser,
  type Employee,
  type Transaction,
  type QRPayment,
  type PaymentConfirmation,
  type FraudAlert,
  type BankProvider,
  type Station,
  type CreateTransactionInput,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Employee operations
  getEmployeeByUserId(userId: string): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: Partial<Employee>): Promise<Employee>;
  
  // Station operations
  getStation(id: string): Promise<Station | undefined>;
  getAllStations(): Promise<Station[]>;
  
  // Transaction operations
  createTransaction(data: CreateTransactionInput & { employeeId: number; stationId: string }): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined>;
  updateTransactionStatus(id: number, status: string, paymentReference?: string): Promise<Transaction>;
  getRecentTransactions(limit?: number): Promise<Transaction[]>;
  getTransactionsByStation(stationId: string, limit?: number): Promise<Transaction[]>;
  getTransactionsByEmployee(employeeId: number, limit?: number): Promise<Transaction[]>;
  
  // QR Payment operations
  createQRPayment(qrPayment: Partial<QRPayment>): Promise<QRPayment>;
  getQRPaymentByTransaction(transactionId: number): Promise<QRPayment | undefined>;
  
  // Payment confirmation operations
  createPaymentConfirmation(confirmation: Partial<PaymentConfirmation>): Promise<PaymentConfirmation>;
  
  // Fraud detection operations
  getFraudPatterns(): Promise<any[]>;
  createFraudAlert(alert: Partial<FraudAlert>): Promise<FraudAlert>;
  getActiveFraudAlerts(): Promise<FraudAlert[]>;
  
  // Banking operations
  getBankProviders(): Promise<BankProvider[]>;
  getBankProvider(code: string): Promise<BankProvider | undefined>;
  
  // Analytics operations
  getDashboardStats(stationId?: string): Promise<{
    todaySales: number;
    todayTransactions: number;
    pendingPayments: number;
    fraudAlerts: number;
  }>;
  
  // System operations
  logWebhook(log: any): Promise<void>;
  getSystemStatus(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Employee operations
  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId));
    return employee;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(employeeData as any)
      .returning();
    return employee;
  }

  // Station operations
  async getStation(id: string): Promise<Station | undefined> {
    const [station] = await db
      .select()
      .from(stations)
      .where(eq(stations.id, id));
    return station;
  }

  async getAllStations(): Promise<Station[]> {
    return await db
      .select()
      .from(stations)
      .where(eq(stations.isActive, true));
  }

  // Transaction operations
  async createTransaction(data: CreateTransactionInput & { employeeId: number; stationId: string }): Promise<Transaction> {
    const transactionId = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
    
    const [transaction] = await db
      .insert(transactions)
      .values({
        transactionId,
        employeeId: data.employeeId,
        stationId: data.stationId,
        pumpNumber: data.pumpNumber,
        fuelType: data.fuelType,
        amount: data.amount,
        liters: data.liters,
        customerPhone: data.customerPhone,
        bankProvider: data.bankProvider,
        status: 'pending',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      })
      .returning();
    
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.transactionId, transactionId));
    return transaction;
  }

  async updateTransactionStatus(id: number, status: string, paymentReference?: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({
        status,
        paymentReference,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionsByStation(stationId: string, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.stationId, stationId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionsByEmployee(employeeId: number, limit = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.employeeId, employeeId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  // QR Payment operations
  async createQRPayment(qrPaymentData: Partial<QRPayment>): Promise<QRPayment> {
    const [qrPayment] = await db
      .insert(qrPayments)
      .values({
        ...qrPaymentData,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      } as any)
      .returning();
    return qrPayment;
  }

  async getQRPaymentByTransaction(transactionId: number): Promise<QRPayment | undefined> {
    const [qrPayment] = await db
      .select()
      .from(qrPayments)
      .where(eq(qrPayments.transactionId, transactionId));
    return qrPayment;
  }

  // Payment confirmation operations
  async createPaymentConfirmation(confirmationData: Partial<PaymentConfirmation>): Promise<PaymentConfirmation> {
    const [confirmation] = await db
      .insert(paymentConfirmations)
      .values(confirmationData as any)
      .returning();
    return confirmation;
  }

  // Fraud detection operations
  async getFraudPatterns(): Promise<any[]> {
    return await db
      .select()
      .from(fraudPatterns)
      .where(eq(fraudPatterns.isActive, true));
  }

  async createFraudAlert(alertData: Partial<FraudAlert>): Promise<FraudAlert> {
    const [alert] = await db
      .insert(fraudAlerts)
      .values(alertData as any)
      .returning();
    return alert;
  }

  async getActiveFraudAlerts(): Promise<FraudAlert[]> {
    return await db
      .select()
      .from(fraudAlerts)
      .where(eq(fraudAlerts.status, 'active'))
      .orderBy(desc(fraudAlerts.createdAt));
  }

  // Banking operations
  async getBankProviders(): Promise<BankProvider[]> {
    return await db
      .select()
      .from(bankProviders)
      .where(eq(bankProviders.isActive, true));
  }

  async getBankProvider(code: string): Promise<BankProvider | undefined> {
    const [provider] = await db
      .select()
      .from(bankProviders)
      .where(and(eq(bankProviders.code, code), eq(bankProviders.isActive, true)));
    return provider;
  }

  // Analytics operations
  async getDashboardStats(stationId?: string): Promise<{
    todaySales: number;
    todayTransactions: number;
    pendingPayments: number;
    fraudAlerts: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const baseCondition = stationId
      ? and(
          gte(transactions.createdAt, today),
          lte(transactions.createdAt, tomorrow),
          eq(transactions.stationId, stationId)
        )
      : and(
          gte(transactions.createdAt, today),
          lte(transactions.createdAt, tomorrow)
        );

    // Today's sales
    const [salesResult] = await db
      .select({
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(baseCondition, eq(transactions.status, 'completed')));

    // Today's transaction count
    const [countResult] = await db
      .select({
        count: count(),
      })
      .from(transactions)
      .where(baseCondition);

    // Pending payments
    const [pendingResult] = await db
      .select({
        count: count(),
      })
      .from(transactions)
      .where(eq(transactions.status, 'pending'));

    // Active fraud alerts
    const [fraudResult] = await db
      .select({
        count: count(),
      })
      .from(fraudAlerts)
      .where(eq(fraudAlerts.status, 'active'));

    return {
      todaySales: parseFloat(salesResult?.total || '0'),
      todayTransactions: countResult?.count || 0,
      pendingPayments: pendingResult?.count || 0,
      fraudAlerts: fraudResult?.count || 0,
    };
  }

  // System operations
  async logWebhook(logData: any): Promise<void> {
    await db.insert(webhookLogs).values(logData);
  }

  async getSystemStatus(): Promise<any> {
    return {
      database: 'online',
      lastBackup: new Date().toISOString(),
    };
  }
}

export const storage = new DatabaseStorage();
