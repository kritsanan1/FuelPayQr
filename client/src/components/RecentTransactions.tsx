import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, University, CheckCircle, Clock } from "lucide-react";
import { Link } from "wouter";
import { formatCurrency, formatDateTime, banks } from "@/lib/i18n";

export default function RecentTransactions() {
  const { t, language } = useLanguage();
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      completed: {
        variant: "default" as const,
        icon: CheckCircle,
        label: t('transactions.completed'),
        className: "text-success-green border-success-green bg-success-green bg-opacity-10",
      },
      pending: {
        variant: "secondary" as const,
        icon: Clock,
        label: t('transactions.pending'),
        className: "text-warning-yellow border-warning-yellow bg-warning-yellow bg-opacity-10",
      },
      failed: {
        variant: "destructive" as const,
        icon: Clock,
        label: t('transactions.failed'),
        className: "text-fire-red border-fire-red bg-fire-red bg-opacity-10",
      },
    };

    const config = configs[status as keyof typeof configs];
    if (!config) return null;

    const Icon = config.icon;
    
    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getBankIcon = (bankCode: string) => {
    const colors = {
      promptpay: "text-blue-600 bg-blue-100",
      bbl: "text-yellow-600 bg-yellow-100",
      scb: "text-purple-600 bg-purple-100",
      kasikorn: "text-green-600 bg-green-100",
    };

    return (
      <div className={`w-6 h-6 rounded flex items-center justify-center ${colors[bankCode as keyof typeof colors] || colors.promptpay}`}>
        <University className="h-3 w-3" />
      </div>
    );
  };

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-poppins font-semibold text-gray-900">
            {t('transactions.recent')}
          </CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="text-petrol-blue hover:text-petrol-blue/80">
              {t('transactions.viewAll')} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : transactions && transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {t('transactions.id')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {t('transactions.pump')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {t('transactions.amount')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {t('transactions.bank')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {t('transactions.status')}
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">
                    {t('transactions.time')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((transaction: any) => (
                  <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-sm text-petrol-blue">
                        {transaction.transactionId}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm">Pump #{transaction.pumpNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">
                        {formatCurrency(parseFloat(transaction.amount))}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getBankIcon(transaction.bankProvider)}
                        <span className="text-sm">
                          {banks[language][transaction.bankProvider as keyof typeof banks['en']] || transaction.bankProvider}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(transaction.status)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {formatDateTime(transaction.createdAt, language === 'th' ? 'th-TH' : 'en-US')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
