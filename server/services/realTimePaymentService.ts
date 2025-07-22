import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';
import { PromptPayService } from './promptPayService';
import { BankingService } from './bankingService';

export interface PaymentUpdate {
  transactionId: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount?: number;
  bankReference?: string;
  timestamp: Date;
  bankProvider: string;
}

export class RealTimePaymentService {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocket> = new Map();
  private promptPayService: PromptPayService;
  private bankingService: BankingService;
  private paymentCheckers: Map<number, NodeJS.Timeout> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/payments' });
    this.promptPayService = new PromptPayService();
    this.bankingService = new BankingService();
    this.setupWebSocketHandlers();
    console.log('✓ Real-time payment service initialized');
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      console.log(`Payment monitoring client connected: ${clientId}`);

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          await this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`Payment monitoring client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(clientId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        clientId,
        timestamp: new Date(),
        message: 'Connected to GasPay real-time payment monitoring'
      }));
    });
  }

  private async handleClientMessage(clientId: string, data: any) {
    const ws = this.clients.get(clientId);
    if (!ws) return;

    switch (data.type) {
      case 'monitor_transaction':
        await this.startMonitoringTransaction(data.transactionId, clientId);
        break;
      
      case 'stop_monitoring':
        this.stopMonitoringTransaction(data.transactionId);
        break;
      
      case 'payment_status_check':
        await this.checkPaymentStatus(data.transactionId, clientId);
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  async startMonitoringTransaction(transactionId: number, clientId?: string) {
    try {
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Transaction not found'
        });
        return;
      }

      // Clear existing monitor if any
      this.stopMonitoringTransaction(transactionId);

      // Start periodic payment checking
      const checkInterval = setInterval(async () => {
        await this.checkAndUpdatePaymentStatus(transaction);
      }, 5000); // Check every 5 seconds

      this.paymentCheckers.set(transactionId, checkInterval);

      // Send initial status
      this.broadcastPaymentUpdate({
        transactionId: transaction.id,
        status: transaction.status as any,
        amount: parseFloat(transaction.amount),
        timestamp: new Date(),
        bankProvider: transaction.bankProvider,
      });

      console.log(`Started monitoring transaction ${transactionId}`);
    } catch (error) {
      console.error('Error starting transaction monitoring:', error);
    }
  }

  stopMonitoringTransaction(transactionId: number) {
    const checker = this.paymentCheckers.get(transactionId);
    if (checker) {
      clearInterval(checker);
      this.paymentCheckers.delete(transactionId);
      console.log(`Stopped monitoring transaction ${transactionId}`);
    }
  }

  private async checkAndUpdatePaymentStatus(transaction: any) {
    try {
      let paymentResult;

      // Check payment status based on bank provider
      switch (transaction.bankProvider) {
        case 'promptpay':
          paymentResult = await this.promptPayService.verifyPayment(transaction.transactionId);
          break;
        
        default:
          // Use banking service for other providers
          paymentResult = await this.bankingService.checkPaymentStatus(
            transaction.bankProvider,
            transaction.transactionId
          );
      }

      // Update transaction if status changed
      if (paymentResult.status !== transaction.status) {
        const updatedTransaction = await storage.updateTransactionStatus(
          transaction.id,
          paymentResult.status,
          paymentResult.bankReference
        );

        // Broadcast update to all connected clients
        this.broadcastPaymentUpdate({
          transactionId: transaction.id,
          status: paymentResult.status,
          amount: parseFloat(transaction.amount),
          bankReference: paymentResult.bankReference,
          timestamp: new Date(),
          bankProvider: transaction.bankProvider,
        });

        // Stop monitoring if payment is completed or failed
        if (['completed', 'failed', 'expired'].includes(paymentResult.status)) {
          this.stopMonitoringTransaction(transaction.id);
          
          // Log payment confirmation if completed
          if (paymentResult.status === 'completed') {
            await storage.createPaymentConfirmation({
              transactionId: transaction.id,
              bankReference: paymentResult.bankReference,
              amount: parseFloat(transaction.amount),
              status: 'confirmed',
              confirmationData: paymentResult,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }

  private async checkPaymentStatus(transactionId: number, clientId?: string) {
    try {
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        this.sendToClient(clientId, {
          type: 'error',
          message: 'Transaction not found'
        });
        return;
      }

      await this.checkAndUpdatePaymentStatus(transaction);
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
  }

  broadcastPaymentUpdate(update: PaymentUpdate) {
    const message = JSON.stringify({
      type: 'payment_update',
      data: update
    });

    this.clients.forEach((ws, clientId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      } else {
        this.clients.delete(clientId);
      }
    });
  }

  private sendToClient(clientId: string | undefined, data: any) {
    if (!clientId) return;
    
    const ws = this.clients.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get real-time statistics
  getActiveConnections(): number {
    return this.clients.size;
  }

  getActiveMonitors(): number {
    return this.paymentCheckers.size;
  }

  // Cleanup on shutdown
  shutdown() {
    this.paymentCheckers.forEach((checker) => clearInterval(checker));
    this.paymentCheckers.clear();
    
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.clients.clear();
    
    this.wss.close();
    console.log('Real-time payment service shutdown complete');
  }
}