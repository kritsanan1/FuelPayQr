import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowUp, Clock, Shield, CreditCard, Fuel } from "lucide-react";
import { formatCurrency } from "@/lib/i18n";

export default function DashboardStats() {
  const { t } = useLanguage();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-100">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                    <div className="h-3 bg-gray-200 rounded w-28"></div>
                  </div>
                  <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: t('dashboard.todaySales'),
      value: formatCurrency(stats?.todaySales || 0),
      change: "+12.5% " + t('dashboard.vsYesterday'),
      changeType: "positive" as const,
      icon: Fuel,
      iconColor: "text-success-green",
      iconBg: "bg-success-green bg-opacity-10",
    },
    {
      title: t('dashboard.transactions'),
      value: stats?.todayTransactions?.toString() || "0",
      change: `95% ${t('dashboard.qrPayments')}`,
      changeType: "neutral" as const,
      icon: CreditCard,
      iconColor: "text-petrol-blue",
      iconBg: "bg-petrol-blue bg-opacity-10",
    },
    {
      title: t('dashboard.pendingPayments'),
      value: stats?.pendingPayments?.toString() || "0",
      change: t('dashboard.awaitingConfirmation'),
      changeType: "warning" as const,
      icon: Clock,
      iconColor: "text-warning-yellow",
      iconBg: "bg-warning-yellow bg-opacity-10",
    },
    {
      title: t('dashboard.fraudAlerts'),
      value: stats?.fraudAlerts?.toString() || "0",
      change: t('dashboard.allSecure'),
      changeType: "positive" as const,
      icon: Shield,
      iconColor: "text-fire-red",
      iconBg: "bg-fire-red bg-opacity-10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="border-gray-100 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-2 flex items-center ${
                    stat.changeType === 'positive' 
                      ? 'text-success-green' 
                      : stat.changeType === 'warning'
                      ? 'text-warning-yellow'
                      : 'text-petrol-blue'
                  }`}>
                    {stat.changeType === 'positive' && <ArrowUp className="h-3 w-3 mr-1" />}
                    {stat.changeType === 'warning' && <Clock className="h-3 w-3 mr-1" />}
                    {stat.changeType === 'neutral' && <CreditCard className="h-3 w-3 mr-1" />}
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
