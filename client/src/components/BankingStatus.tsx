import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Building, University } from "lucide-react";
import { banks } from "@/lib/i18n";

export default function BankingStatus() {
  const { t, language } = useLanguage();
  
  const { data: bankingStatus, isLoading } = useQuery({
    queryKey: ["/api/banking/status"],
  });

  const getStatusBadge = (status: string) => {
    const configs = {
      online: {
        label: t('banking.online'),
        className: "text-success-green border-success-green bg-success-green bg-opacity-10",
        dotClass: "bg-success-green",
      },
      slow: {
        label: t('banking.slow'),
        className: "text-warning-yellow border-warning-yellow bg-warning-yellow bg-opacity-10",
        dotClass: "bg-warning-yellow",
      },
      offline: {
        label: t('banking.offline'),
        className: "text-fire-red border-fire-red bg-fire-red bg-opacity-10",
        dotClass: "bg-fire-red",
      },
    };

    const config = configs[status as keyof typeof configs] || configs.offline;
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${config.dotClass}`}></div>
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      </div>
    );
  };

  const getBankIcon = (bankCode: string) => {
    const icons = {
      promptpay: Smartphone,
      bbl: Building,
      scb: University,
      kasikorn: University,
    };

    const colors = {
      promptpay: "text-blue-600 bg-blue-100",
      bbl: "text-yellow-600 bg-yellow-100",
      scb: "text-purple-600 bg-purple-100",
      kasikorn: "text-green-600 bg-green-100",
    };

    const Icon = icons[bankCode as keyof typeof icons] || University;
    const colorClass = colors[bankCode as keyof typeof colors] || colors.promptpay;

    return (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    );
  };

  // Default status for demo purposes
  const defaultStatuses = [
    { bank: 'promptpay', status: 'online' },
    { bank: 'bbl', status: 'online' },
    { bank: 'scb', status: 'slow' },
    { bank: 'kasikorn', status: 'online' },
  ];

  const statuses = bankingStatus || defaultStatuses;

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <CardTitle className="text-lg font-poppins font-semibold text-gray-900">
          {t('banking.title')}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {statuses.map((bankStatus: any) => (
              <div 
                key={bankStatus.bank} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getBankIcon(bankStatus.bank)}
                  <span className="font-medium text-gray-900">
                    {banks[language][bankStatus.bank as keyof typeof banks['en']] || bankStatus.bank}
                  </span>
                </div>
                {getStatusBadge(bankStatus.status)}
              </div>
            ))}
          </div>
        )}

        {/* Response Time Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Last checked: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
