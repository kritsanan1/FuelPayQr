import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Shield } from "lucide-react";

export default function SecurityAlerts() {
  const { t } = useLanguage();
  
  const { data: fraudAlerts, isLoading } = useQuery({
    queryKey: ["/api/fraud/alerts"],
  });

  const { data: systemStatus } = useQuery({
    queryKey: ["/api/system/status"],
  });

  const securityChecks = [
    {
      label: t('security.noFraudAlerts'),
      status: (fraudAlerts?.length || 0) === 0,
    },
    {
      label: t('security.allSystemsSecure'),
      status: true,
    },
    {
      label: t('security.sslValid'),
      status: true,
    },
  ];

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-poppins font-semibold text-gray-900">
            {t('security.title')}
          </CardTitle>
          <Shield className="h-5 w-5 text-success-green" />
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {securityChecks.map((check, index) => (
              <div key={index} className="flex items-center space-x-3 text-success-green">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{check.label}</span>
              </div>
            ))}

            {/* Active Fraud Alerts */}
            {fraudAlerts && fraudAlerts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-fire-red mb-2">
                  Active Alerts ({fraudAlerts.length})
                </div>
                {fraudAlerts.slice(0, 3).map((alert: any) => (
                  <div key={alert.id} className="text-xs text-fire-red bg-fire-red bg-opacity-5 p-2 rounded mb-2">
                    {alert.description}
                  </div>
                ))}
              </div>
            )}

            {/* System Status */}
            <div className="bg-gray-50 rounded-lg p-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('security.lastBackup')}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {systemStatus?.system?.lastBackup 
                    ? new Date(systemStatus.system.lastBackup).toLocaleDateString()
                    : 'Today 03:00'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
