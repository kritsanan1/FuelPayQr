import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Download, Filter } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/i18n";

export default function TransactionHistory() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      expired: "outline",
    };

    const labels = {
      completed: t('transactions.completed'),
      pending: t('transactions.pending'),
      failed: t('transactions.failed'),
      expired: "Expired",
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-light-blue-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petrol-blue mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-light-blue-bg">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
            Transaction History
          </h1>
          <p className="text-gray-600">
            Complete record of all payment transactions
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('transactions.recent')}</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-petrol-blue mx-auto mb-4"></div>
                <p className="text-gray-600">{t('common.loading')}</p>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t('transactions.id')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t('transactions.pump')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        Fuel Type
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t('transactions.amount')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t('transactions.bank')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t('transactions.status')}
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">
                        {t('transactions.time')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction: any) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-petrol-blue">
                            {transaction.transactionId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm">Pump #{transaction.pumpNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm capitalize">{transaction.fuelType}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold">
                            {formatCurrency(parseFloat(transaction.amount))}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm capitalize">{transaction.bankProvider}</span>
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
                <p className="text-gray-500">No transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
