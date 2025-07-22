import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Smartphone, 
  AlertTriangle,
  Wifi,
  WifiOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentUpdate {
  transactionId: number;
  status: 'pending' | 'completed' | 'failed' | 'expired';
  amount?: number;
  bankReference?: string;
  timestamp: Date;
  bankProvider: string;
}

interface PaymentMonitorProps {
  transactionId?: number;
  autoStart?: boolean;
}

export default function RealTimePaymentMonitor({ transactionId, autoStart = false }: PaymentMonitorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [paymentUpdates, setPaymentUpdates] = useState<PaymentUpdate[]>([]);
  const [monitoredTransactions, setMonitoredTransactions] = useState<Set<number>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Fetch recent transactions to monitor
  const { data: recentTransactions } = useQuery({
    queryKey: ['/api/transactions'],
    queryFn: () => fetch('/api/transactions').then(res => res.json()),
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (autoStart || transactionId) {
      connectWebSocket();
    }

    return () => {
      disconnectWebSocket();
    };
  }, [autoStart, transactionId]);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/payments`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        console.log('Real-time payment monitoring connected');

        // Auto-monitor specified transaction
        if (transactionId) {
          startMonitoringTransaction(transactionId);
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        console.log('Payment monitoring disconnected');
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (autoStart && wsRef.current?.readyState !== WebSocket.OPEN) {
            connectWebSocket();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        toast({
          title: "Connection Error",
          description: "Unable to connect to real-time payment monitoring",
          variant: "destructive",
        });
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'connected':
        toast({
          title: "Connected! 📡",
          description: "Real-time payment monitoring is active",
        });
        break;

      case 'payment_update':
        handlePaymentUpdate(message.data);
        break;

      case 'error':
        toast({
          title: "Monitoring Error",
          description: message.message,
          variant: "destructive",
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const handlePaymentUpdate = (update: PaymentUpdate) => {
    setPaymentUpdates(prev => {
      const filtered = prev.filter(p => p.transactionId !== update.transactionId);
      return [update, ...filtered].slice(0, 10); // Keep last 10 updates
    });

    // Show toast notification for status changes
    if (update.status === 'completed') {
      toast({
        title: "Payment Completed! ✅",
        description: `Transaction ${update.transactionId} - ${update.amount} THB`,
      });
    } else if (update.status === 'failed') {
      toast({
        title: "Payment Failed ❌",
        description: `Transaction ${update.transactionId}`,
        variant: "destructive",
      });
    }
  };

  const startMonitoringTransaction = (txnId: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({
        title: "Not Connected",
        description: "Please connect to monitoring service first",
        variant: "destructive",
      });
      return;
    }

    wsRef.current.send(JSON.stringify({
      type: 'monitor_transaction',
      transactionId: txnId,
    }));

    setMonitoredTransactions(prev => new Set([...prev, txnId]));
    
    toast({
      title: "Monitoring Started 👀",
      description: `Tracking payment for transaction ${txnId}`,
    });
  };

  const stopMonitoringTransaction = (txnId: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'stop_monitoring',
        transactionId: txnId,
      }));
    }

    setMonitoredTransactions(prev => {
      const newSet = new Set(prev);
      newSet.delete(txnId);
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="border-2 border-petrol-blue/20">
      <CardHeader className="bg-gradient-to-r from-fire-engine-red to-fire-engine-red/80 text-white">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Payment Monitor
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-300" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-300" />
            )}
            <Badge 
              variant={isConnected ? 'default' : 'destructive'}
              className="text-xs"
            >
              {connectionStatus}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Connection Controls */}
          <div className="flex gap-2">
            {!isConnected ? (
              <Button 
                onClick={connectWebSocket}
                className="bg-petrol-blue hover:bg-petrol-blue/90"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect Monitor'}
              </Button>
            ) : (
              <Button 
                onClick={disconnectWebSocket}
                variant="outline"
              >
                Disconnect
              </Button>
            )}
          </div>

          {/* Recent Transactions to Monitor */}
          {recentTransactions && recentTransactions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Recent Transactions</h3>
              <div className="space-y-2">
                {recentTransactions.slice(0, 5).map((transaction: any) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">
                          {transaction.amount} THB
                        </div>
                        <div className="text-xs text-gray-500">
                          {transaction.transactionId}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      {monitoredTransactions.has(transaction.id) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => stopMonitoringTransaction(transaction.id)}
                        >
                          Stop
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => startMonitoringTransaction(transaction.id)}
                          disabled={!isConnected}
                        >
                          Monitor
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Updates Feed */}
          {paymentUpdates.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Live Payment Updates</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {paymentUpdates.map((update, index) => (
                  <Alert key={`${update.transactionId}-${index}`} className="py-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(update.status)}
                      <AlertDescription className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">
                            Transaction {update.transactionId}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(update.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {update.status === 'completed' && update.amount && (
                            <span>Paid {update.amount} THB via {update.bankProvider.toUpperCase()}</span>
                          )}
                          {update.status === 'pending' && (
                            <span>Waiting for payment confirmation...</span>
                          )}
                          {update.status === 'failed' && (
                            <span>Payment failed or cancelled</span>
                          )}
                          {update.bankReference && (
                            <span className="block text-xs font-mono">
                              Ref: {update.bankReference}
                            </span>
                          )}
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Status Display */}
          {!isConnected && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Connect to monitor real-time payment status updates and receive instant notifications when payments are completed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}