import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { QRGenerator } from "./services/qrGenerator";
import { BankingService } from "./services/bankingService";
import { FraudDetection } from "./services/fraudDetection";
import { createTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize services
  const qrGenerator = new QRGenerator();
  const bankingService = new BankingService();
  const fraudDetection = new FraudDetection();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get employee data if exists
      const employee = await storage.getEmployeeByUserId(userId);
      
      res.json({
        ...user,
        employee,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await storage.getEmployeeByUserId(userId);
      const stationId = employee?.stationId;
      
      const stats = await storage.getDashboardStats(stationId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Bank providers
  app.get('/api/banks', isAuthenticated, async (req, res) => {
    try {
      const providers = await storage.getBankProviders();
      res.json(providers);
    } catch (error) {
      console.error("Error fetching bank providers:", error);
      res.status(500).json({ message: "Failed to fetch bank providers" });
    }
  });

  // Banking API status
  app.get('/api/banking/status', isAuthenticated, async (req, res) => {
    try {
      const status = await bankingService.checkAllBankStatus();
      res.json(status);
    } catch (error) {
      console.error("Error checking banking status:", error);
      res.status(500).json({ message: "Failed to check banking status" });
    }
  });

  // Onboarding routes
  app.get('/api/onboarding/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId || req.user.claims.sub;
      let onboarding = await storage.getUserOnboarding(userId);
      
      if (!onboarding) {
        onboarding = await storage.createUserOnboarding(userId);
      }
      
      res.json(onboarding);
    } catch (error) {
      console.error("Error fetching user onboarding:", error);
      res.status(500).json({ message: "Failed to fetch onboarding data" });
    }
  });

  app.get('/api/onboarding/tutorial', isAuthenticated, async (req, res) => {
    try {
      const [steps, characters] = await Promise.all([
        storage.getTutorialSteps(),
        storage.getTutorialCharacters(),
      ]);
      
      res.json({
        steps,
        characters: characters.reduce((acc, char) => {
          acc[char.id] = char;
          return acc;
        }, {} as any),
      });
    } catch (error) {
      console.error("Error fetching tutorial data:", error);
      res.status(500).json({ message: "Failed to fetch tutorial data" });
    }
  });

  app.post('/api/onboarding/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { stepNumber, action } = req.body;
      
      const updated = await storage.updateOnboardingProgress(userId, stepNumber, action);
      res.json(updated);
    } catch (error) {
      console.error("Error updating onboarding progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.post('/api/onboarding/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const completed = await storage.completeOnboarding(userId);
      res.json(completed);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // Enhanced QR generation route
  app.post('/api/qr/generate', isAuthenticated, async (req, res) => {
    try {
      const { amount, bankProvider, fuelType, pumpNumber, customerPhone, transactionId } = req.body;
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        transactionId,
        amount: amount.toString(),
        bankProvider,
        status: 'pending',
        fuelType,
        pumpNumber,
        customerPhone,
        employeeId: (req as any).user.claims.sub,
      });

      // Generate enhanced QR code
      const qrGenerator = new (await import('../services/qrGenerator')).QRGenerator();
      const qrResult = await qrGenerator.generateQR({
        transactionId,
        amount,
        bankProvider,
        merchantId: `GASPAY_${pumpNumber}`,
      });

      res.json({
        ...qrResult.data,
        qrCode: qrResult.qrCode,
        transactionId: transaction.id,
        amount,
        bankProvider,
        status: 'pending',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });
    } catch (error) {
      console.error("Enhanced QR generation error:", error);
      res.status(500).json({ message: "Failed to generate enhanced QR code" });
    }
  });

  // Create transaction and generate QR
  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        return res.status(403).json({ message: "Employee not found" });
      }

      // Validate input
      const validatedData = createTransactionSchema.parse(req.body);

      // Check for fraud patterns
      const fraudCheck = await fraudDetection.checkTransaction({
        ...validatedData,
        employeeId: employee.id,
        stationId: employee.stationId,
      });

      if (fraudCheck.riskLevel === 'high' || fraudCheck.riskLevel === 'critical') {
        await storage.createFraudAlert({
          patternId: fraudCheck.patternId,
          riskScore: fraudCheck.riskScore,
          description: fraudCheck.description,
          status: 'active',
        });
        
        return res.status(400).json({ 
          message: "Transaction blocked due to security concerns",
          fraudAlert: fraudCheck 
        });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        ...validatedData,
        employeeId: employee.id,
        stationId: employee.stationId,
      });

      // Generate QR code
      const qrData = await qrGenerator.generateQR({
        transactionId: transaction.transactionId,
        amount: parseFloat(validatedData.amount),
        bankProvider: validatedData.bankProvider,
        merchantId: process.env.MERCHANT_ID || 'FUEL001',
      });

      // Save QR payment
      await storage.createQRPayment({
        transactionId: transaction.id,
        qrCode: qrData.qrCode,
        qrData: qrData.data,
        bankProvider: validatedData.bankProvider,
        status: 'active',
      });

      res.json({
        transaction,
        qr: qrData,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Get recent transactions
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const employee = await storage.getEmployeeByUserId(userId);
      const limit = parseInt(req.query.limit as string) || 10;
      
      let transactions;
      if (employee?.role === 'admin') {
        transactions = await storage.getRecentTransactions(limit);
      } else if (employee) {
        transactions = await storage.getTransactionsByEmployee(employee.id, limit);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Get transaction details
  app.get('/api/transactions/:id', isAuthenticated, async (req, res) => {
    try {
      const transactionId = req.params.id;
      const transaction = await storage.getTransactionByTransactionId(transactionId);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      const qrPayment = await storage.getQRPaymentByTransaction(transaction.id);
      
      res.json({
        transaction,
        qrPayment,
      });
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ message: "Failed to fetch transaction" });
    }
  });

  // Simulate payment confirmation (webhook)
  app.post('/api/webhooks/payment', async (req, res) => {
    try {
      const { transactionId, status, bankReference, amount } = req.body;
      
      // Log webhook
      await storage.logWebhook({
        transactionId: null,
        bankProvider: 'unknown',
        webhookData: req.body,
        status: 'received',
        processedAt: new Date(),
      });

      const transaction = await storage.getTransactionByTransactionId(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Update transaction status
      await storage.updateTransactionStatus(
        transaction.id,
        status === 'success' ? 'completed' : 'failed',
        bankReference
      );

      // Create payment confirmation
      await storage.createPaymentConfirmation({
        transactionId: transaction.id,
        bankReference,
        amount: amount?.toString(),
        status: status === 'success' ? 'success' : 'failed',
        confirmationData: req.body,
      });

      res.json({ message: "Payment processed successfully" });
    } catch (error) {
      console.error("Error processing payment webhook:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Fraud alerts
  app.get('/api/fraud/alerts', isAuthenticated, async (req, res) => {
    try {
      const alerts = await storage.getActiveFraudAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching fraud alerts:", error);
      res.status(500).json({ message: "Failed to fetch fraud alerts" });
    }
  });

  // System status
  app.get('/api/system/status', isAuthenticated, async (req, res) => {
    try {
      const systemStatus = await storage.getSystemStatus();
      const bankingStatus = await bankingService.checkAllBankStatus();
      
      res.json({
        system: systemStatus,
        banking: bankingStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error fetching system status:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // Initialize demo data
  app.post('/api/init', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if employee already exists
      let employee = await storage.getEmployeeByUserId(userId);
      
      if (!employee) {
        // Create demo employee
        employee = await storage.createEmployee({
          userId: userId,
          employeeId: `EMP${Date.now()}`,
          stationId: 'STATION001',
          role: 'manager',
          isActive: true,
        });
      }

      res.json({ employee, message: "Initialization complete" });
    } catch (error) {
      console.error("Error initializing user:", error);
      res.status(500).json({ message: "Failed to initialize user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
