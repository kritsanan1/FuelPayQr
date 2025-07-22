import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, University } from "lucide-react";
import { formatCurrency, formatDateTime, banks } from "@/lib/i18n";

export default function PaymentMonitor() {
  const { t, language } = useLanguage();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const pendingTransactions = transactions?.filter((tx: any) => tx.status === 'pending')?.slice(0, 2) || [];
  const recentCompleted = transactions?.filter((tx: any) => tx.status === 'completed')?.slice(0, 1) || [];

  const getBankIcon = (bankCode: string) => {
    const colors = {
      promptpay: "text-blue-600 bg-blue-100",
      bbl: "text-yellow-600 bg-yellow-100",
      scb: "text-purple-600 bg-purple-100",
      kasikorn: "text-green-600 bg-green-100",
    };

    return (
      <div className={`w-4 h-4 rounded flex items-center justify-center ${colors[bankCode as keyof typeof colors] || colors.promptpay}`}>
        <University className="h-2 w-2" />
      </div>
    );
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s`;
    return `${Math.floor(diffInSeconds / 3600)}h ${Math.floor((diffInSeconds % 3600) / 60)}m`;
  };

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-poppins font-semibold text-gray-900">
          {t('monitor.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="flex justify-between mb-2">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Payments */}
            {pendingTransactions.map((transaction: any) => (
              <div 
                key={transaction.id} 
                className="bg-warning-yellow bg-opacity-5 border border-warning-yellow border-opacity-20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Pump #{transaction.pumpNumber}
                  </span>
                  <Badge variant="outline" className="text-warning-yellow border-warning-yellow bg-warning-yellow bg-opacity-10">
                    <Clock className="h-3 w-3 mr-1" />
                    {t('transactions.pending')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(parseFloat(transaction.amount))}
                  </span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-warning-yellow rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-500">
                      {getTimeSince(transaction.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getBankIcon(transaction.bankProvider)}
                  <span className="text-sm text-gray-600">
                    {banks[language][transaction.bankProvider as keyof typeof banks['en']] || transaction.bankProvider}
                  </span>
                </div>
              </div>
            ))}

            {/* Recent Completed */}
            {recentCompleted.map((transaction: any) => (
              <div 
                key={transaction.id} 
                className="bg-success-green bg-opacity-5 border border-success-green border-opacity-20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    Pump #{transaction.pumpNumber}
                  </span>
                  <Badge variant="outline" className="text-success-green border-success-green bg-success-green bg-opacity-10">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('monitor.completed')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(parseFloat(transaction.amount))}
                  </span>
                  <span className="text-xs text-gray-500">{t('monitor.justNow')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getBankIcon(transaction.bankProvider)}
                  <span className="text-sm text-gray-600">
                    {banks[language][transaction.bankProvider as keyof typeof banks['en']] || transaction.bankProvider}
                  </span>
                </div>
              </div>
            ))}

            {pendingTransactions.length === 0 && recentCompleted.length === 0 && (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No active payments to monitor</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
