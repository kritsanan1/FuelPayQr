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
  userOnboarding,
  tutorialCharacters,
  tutorialSteps,
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
  type UserOnboarding,
  type TutorialCharacter,
  type TutorialStep,
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

  // Onboarding operations
  getUserOnboarding(userId: string): Promise<UserOnboarding | undefined>;
  createUserOnboarding(userId: string): Promise<UserOnboarding>;
  updateOnboardingProgress(userId: string, stepNumber: number, action: string): Promise<UserOnboarding>;
  completeOnboarding(userId: string): Promise<UserOnboarding>;
  getTutorialSteps(): Promise<(TutorialStep & { character: TutorialCharacter })[]>;
  getTutorialCharacters(): Promise<TutorialCharacter[]>;
  
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

  // Onboarding operations
  async getUserOnboarding(userId: string): Promise<UserOnboarding | undefined> {
    const [onboarding] = await db
      .select()
      .from(userOnboarding)
      .where(eq(userOnboarding.userId, userId));
    return onboarding;
  }

  async createUserOnboarding(userId: string): Promise<UserOnboarding> {
    const [onboarding] = await db
      .insert(userOnboarding)
      .values({
        userId,
        hasCompletedOnboarding: false,
        currentStep: 0,
        completedSteps: [],
        tutorialData: {},
      })
      .returning();
    return onboarding;
  }

  async updateOnboardingProgress(userId: string, stepNumber: number, action: string): Promise<UserOnboarding> {
    // Get current onboarding record
    let onboarding = await this.getUserOnboarding(userId);
    
    if (!onboarding) {
      onboarding = await this.createUserOnboarding(userId);
    }

    const completedSteps = Array.isArray(onboarding.completedSteps) 
      ? onboarding.completedSteps as number[]
      : [];
    
    const newCompletedSteps = action === 'completed' 
      ? [...completedSteps, stepNumber]
      : completedSteps;

    const [updated] = await db
      .update(userOnboarding)
      .set({
        currentStep: stepNumber,
        completedSteps: newCompletedSteps,
        lastActiveStep: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userOnboarding.userId, userId))
      .returning();

    return updated;
  }

  async completeOnboarding(userId: string): Promise<UserOnboarding> {
    const [updated] = await db
      .update(userOnboarding)
      .set({
        hasCompletedOnboarding: true,
        updatedAt: new Date(),
      })
      .where(eq(userOnboarding.userId, userId))
      .returning();

    return updated;
  }

  async getTutorialSteps(): Promise<(TutorialStep & { character: TutorialCharacter })[]> {
    const steps = await db
      .select({
        id: tutorialSteps.id,
        stepNumber: tutorialSteps.stepNumber,
        title: tutorialSteps.title,
        description: tutorialSteps.description,
        characterId: tutorialSteps.characterId,
        message: tutorialSteps.message,
        actionRequired: tutorialSteps.actionRequired,
        targetElement: tutorialSteps.targetElement,
        isOptional: tutorialSteps.isOptional,
        order: tutorialSteps.order,
        createdAt: tutorialSteps.createdAt,
        character: {
          id: tutorialCharacters.id,
          name: tutorialCharacters.name,
          role: tutorialCharacters.role,
          avatar: tutorialCharacters.avatar,
          description: tutorialCharacters.description,
          personality: tutorialCharacters.personality,
          isActive: tutorialCharacters.isActive,
          createdAt: tutorialCharacters.createdAt,
        },
      })
      .from(tutorialSteps)
      .leftJoin(tutorialCharacters, eq(tutorialSteps.characterId, tutorialCharacters.id))
      .orderBy(tutorialSteps.order);

    return steps as any;
  }

  async getTutorialCharacters(): Promise<TutorialCharacter[]> {
    return await db
      .select()
      .from(tutorialCharacters)
      .where(eq(tutorialCharacters.isActive, true));
  }
}

// Memory storage implementation for development/fallback
export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private employees = new Map<number, Employee>();
  private stations = new Map<string, Station>();
  private transactions = new Map<number, Transaction>();
  private qrPayments = new Map<number, QRPayment>();
  private paymentConfirmations = new Map<number, PaymentConfirmation>();
  private fraudAlerts = new Map<number, FraudAlert>();
  private bankProviders = new Map<string, BankProvider>();
  private nextId = 1;

  constructor() {
    // Initialize with default data
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default bank providers
    const defaultBanks: BankProvider[] = [
      {
        id: 1,
        code: 'promptpay',
        name: 'PromptPay',
        displayName: 'PromptPay',
        apiEndpoint: 'https://api.promptpay.io',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        code: 'bbl',
        name: 'Bangkok Bank',
        displayName: 'Bangkok Bank',
        apiEndpoint: 'https://api.bangkokbank.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        code: 'scb',
        name: 'Siam Commercial Bank',
        displayName: 'SCB',
        apiEndpoint: 'https://api.scb.co.th',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        code: 'kasikorn',
        name: 'Kasikornbank',
        displayName: 'K-Bank',
        apiEndpoint: 'https://api.kasikornbank.com',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultBanks.forEach(bank => {
      this.bankProviders.set(bank.code, bank);
    });

    // Default station
    const defaultStation: Station = {
      id: 'STATION001',
      name: 'Demo Gas Station',
      address: '123 Main Street, Bangkok, Thailand',
      phone: '+66-2-123-4567',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stations.set(defaultStation.id, defaultStation);
  }

  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      updatedAt: new Date(),
      createdAt: this.users.has(userData.id!) ? this.users.get(userData.id!)!.createdAt : new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  // Employee operations
  async getEmployeeByUserId(userId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.userId === userId);
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.employeeId === employeeId);
  }

  async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const employee: Employee = {
      id: this.nextId++,
      userId: employeeData.userId || null,
      employeeId: employeeData.employeeId || `EMP${Date.now()}`,
      stationId: employeeData.stationId || 'STATION001',
      role: employeeData.role || 'employee',
      isActive: employeeData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(employee.id, employee);
    return employee;
  }

  // Station operations
  async getStation(id: string): Promise<Station | undefined> {
    return this.stations.get(id);
  }

  async getAllStations(): Promise<Station[]> {
    return Array.from(this.stations.values()).filter(station => station.isActive);
  }

  // Transaction operations
  async createTransaction(data: CreateTransactionInput & { employeeId: number; stationId: string }): Promise<Transaction> {
    const transactionId = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`;
    
    const transaction: Transaction = {
      id: this.nextId++,
      transactionId,
      employeeId: data.employeeId,
      stationId: data.stationId,
      pumpNumber: data.pumpNumber,
      fuelType: data.fuelType,
      amount: data.amount,
      liters: data.liters || null,
      pricePerLiter: null,
      customerPhone: data.customerPhone || null,
      status: 'pending',
      bankProvider: data.bankProvider,
      paymentReference: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
    
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByTransactionId(transactionId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(txn => txn.transactionId === transactionId);
  }

  async updateTransactionStatus(id: number, status: string, paymentReference?: string): Promise<Transaction> {
    const transaction = this.transactions.get(id);
    if (!transaction) {
      throw new Error(`Transaction ${id} not found`);
    }
    
    const updated: Transaction = {
      ...transaction,
      status,
      paymentReference: paymentReference || transaction.paymentReference,
      updatedAt: new Date(),
    };
    
    this.transactions.set(id, updated);
    return updated;
  }

  async getRecentTransactions(limit = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async getTransactionsByStation(stationId: string, limit = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(txn => txn.stationId === stationId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async getTransactionsByEmployee(employeeId: number, limit = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(txn => txn.employeeId === employeeId)
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  // QR Payment operations
  async createQRPayment(qrPaymentData: Partial<QRPayment>): Promise<QRPayment> {
    const qrPayment: QRPayment = {
      id: this.nextId++,
      transactionId: qrPaymentData.transactionId!,
      qrCode: qrPaymentData.qrCode!,
      qrData: qrPaymentData.qrData!,
      bankProvider: qrPaymentData.bankProvider!,
      status: qrPaymentData.status || 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    };
    this.qrPayments.set(qrPayment.id, qrPayment);
    return qrPayment;
  }

  async getQRPaymentByTransaction(transactionId: number): Promise<QRPayment | undefined> {
    return Array.from(this.qrPayments.values()).find(qr => qr.transactionId === transactionId);
  }

  // Payment confirmation operations
  async createPaymentConfirmation(confirmationData: Partial<PaymentConfirmation>): Promise<PaymentConfirmation> {
    const confirmation: PaymentConfirmation = {
      id: this.nextId++,
      transactionId: confirmationData.transactionId!,
      bankReference: confirmationData.bankReference || null,
      confirmationData: confirmationData.confirmationData || null,
      confirmedAt: new Date(),
      amount: confirmationData.amount || null,
      status: confirmationData.status!,
    };
    this.paymentConfirmations.set(confirmation.id, confirmation);
    return confirmation;
  }

  // Fraud detection operations
  async getFraudPatterns(): Promise<any[]> {
    return [];
  }

  async createFraudAlert(alertData: Partial<FraudAlert>): Promise<FraudAlert> {
    const alert: FraudAlert = {
      id: this.nextId++,
      transactionId: alertData.transactionId || null,
      patternId: alertData.patternId || null,
      riskScore: alertData.riskScore || null,
      description: alertData.description || null,
      status: alertData.status || 'active',
      createdAt: new Date(),
      resolvedAt: null,
    };
    this.fraudAlerts.set(alert.id, alert);
    return alert;
  }

  async getActiveFraudAlerts(): Promise<FraudAlert[]> {
    return Array.from(this.fraudAlerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());
  }

  // Banking operations
  async getBankProviders(): Promise<BankProvider[]> {
    return Array.from(this.bankProviders.values()).filter(provider => provider.isActive);
  }

  async getBankProvider(code: string): Promise<BankProvider | undefined> {
    const provider = this.bankProviders.get(code);
    return provider?.isActive ? provider : undefined;
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

    const allTransactions = Array.from(this.transactions.values());
    
    const todayTransactions = allTransactions.filter(txn => {
      const created = new Date(txn.createdAt!);
      const matchesStation = !stationId || txn.stationId === stationId;
      const isToday = created >= today && created < tomorrow;
      return matchesStation && isToday;
    });

    const completedSales = todayTransactions
      .filter(txn => txn.status === 'completed')
      .reduce((sum, txn) => sum + parseFloat(txn.amount), 0);

    const pendingPayments = allTransactions.filter(txn => txn.status === 'pending').length;
    const fraudAlerts = Array.from(this.fraudAlerts.values()).filter(alert => alert.status === 'active').length;

    return {
      todaySales: completedSales,
      todayTransactions: todayTransactions.length,
      pendingPayments,
      fraudAlerts,
    };
  }

  // System operations
  async logWebhook(logData: any): Promise<void> {
    // In memory storage, we just log to console
    console.log('Webhook logged:', logData);
  }

  async getSystemStatus(): Promise<any> {
    return {
      database: 'memory',
      lastBackup: new Date().toISOString(),
      storage: 'in-memory',
    };
  }

  // Onboarding operations (Memory storage implementation)
  private onboardingData = new Map<string, UserOnboarding>();
  private tutorialStepsData: (TutorialStep & { character: TutorialCharacter })[] = [];
  private tutorialCharactersData: TutorialCharacter[] = [];

  async getUserOnboarding(userId: string): Promise<UserOnboarding | undefined> {
    return this.onboardingData.get(userId);
  }

  async createUserOnboarding(userId: string): Promise<UserOnboarding> {
    const onboarding: UserOnboarding = {
      id: this.nextId++,
      userId,
      hasCompletedOnboarding: false,
      currentStep: 0,
      completedSteps: [],
      tutorialData: {},
      lastActiveStep: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.onboardingData.set(userId, onboarding);
    return onboarding;
  }

  async updateOnboardingProgress(userId: string, stepNumber: number, action: string): Promise<UserOnboarding> {
    let onboarding = this.onboardingData.get(userId);
    
    if (!onboarding) {
      onboarding = await this.createUserOnboarding(userId);
    }

    const completedSteps = Array.isArray(onboarding.completedSteps) 
      ? onboarding.completedSteps as number[]
      : [];
    
    const newCompletedSteps = action === 'completed' 
      ? [...completedSteps, stepNumber]
      : completedSteps;

    const updated: UserOnboarding = {
      ...onboarding,
      currentStep: stepNumber,
      completedSteps: newCompletedSteps,
      lastActiveStep: new Date(),
      updatedAt: new Date(),
    };

    this.onboardingData.set(userId, updated);
    return updated;
  }

  async completeOnboarding(userId: string): Promise<UserOnboarding> {
    let onboarding = this.onboardingData.get(userId);
    
    if (!onboarding) {
      onboarding = await this.createUserOnboarding(userId);
    }

    const updated: UserOnboarding = {
      ...onboarding,
      hasCompletedOnboarding: true,
      updatedAt: new Date(),
    };

    this.onboardingData.set(userId, updated);
    return updated;
  }

  async getTutorialSteps(): Promise<(TutorialStep & { character: TutorialCharacter })[]> {
    // Return default tutorial steps for memory storage
    if (this.tutorialStepsData.length === 0) {
      this.initializeTutorialData();
    }
    return this.tutorialStepsData;
  }

  async getTutorialCharacters(): Promise<TutorialCharacter[]> {
    if (this.tutorialCharactersData.length === 0) {
      this.initializeTutorialData();
    }
    return this.tutorialCharactersData;
  }

  private initializeTutorialData() {
    // Initialize tutorial characters
    this.tutorialCharactersData = [
      {
        id: 1,
        name: 'Niran',
        role: 'guide',
        avatar: '🧑‍🏭',
        description: 'A friendly fuel station manager who knows everything about the GasPay QR system',
        personality: { traits: ['helpful', 'patient', 'encouraging'], greeting: 'สวัสดีครับ! (Hello!)', catchphrase: 'Let me show you the way!' },
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 2,
        name: 'Malee',
        role: 'helper',
        avatar: '👩‍💼',
        description: 'An expert cashier who specializes in QR payments and customer service',
        personality: { traits: ['detail-oriented', 'cheerful', 'efficient'], greeting: 'ยินดีที่ได้รู้จักค่ะ! (Nice to meet you!)', catchphrase: 'Every transaction matters!' },
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: 3,
        name: 'Somchai',
        role: 'expert',
        avatar: '👨‍🔧',
        description: 'A tech-savvy engineer who handles the technical aspects and troubleshooting',
        personality: { traits: ['analytical', 'resourceful', 'calm'], greeting: 'เฮ้ยครับ! (Hey there!)', catchphrase: 'Technology made simple!' },
        isActive: true,
        createdAt: new Date(),
      },
    ];

    // Initialize tutorial steps
    this.tutorialStepsData = [
      {
        id: 1,
        stepNumber: 1,
        title: 'Welcome to GasPay QR!',
        description: 'Get started with your Thai fuel station payment system',
        characterId: 1,
        message: 'สวัสดีครับ! Welcome to GasPay QR - Thailand\'s most advanced fuel station payment system! I\'m Niran, and I\'ll be your guide. Ready to learn how to make fuel payments as easy as ordering som tam? 🥗',
        actionRequired: 'click',
        targetElement: '#welcome-button',
        isOptional: false,
        order: 1,
        createdAt: new Date(),
        character: this.tutorialCharactersData[0],
      },
      {
        id: 2,
        stepNumber: 2,
        title: 'Meet Your Dashboard',
        description: 'Explore the main control center',
        characterId: 1,
        message: 'This is your dashboard - your command center! Here you can see today\'s sales, recent transactions, and system status. Think of it as your digital cash register, but much smarter! Let\'s take a look around.',
        actionRequired: 'navigate',
        targetElement: '#dashboard',
        isOptional: false,
        order: 2,
        createdAt: new Date(),
        character: this.tutorialCharactersData[0],
      },
      // Add more steps as needed...
    ];
  }
}

// Use memory storage if DATABASE_URL is not available, otherwise use database storage
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemoryStorage();
