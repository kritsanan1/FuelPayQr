import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import DashboardStats from "@/components/DashboardStats";
import EnhancedQRGenerator from "@/components/EnhancedQRGenerator";
import RealTimePaymentMonitor from "@/components/RealTimePaymentMonitor";
import RecentTransactions from "@/components/RecentTransactions";
// import PaymentMonitor from "@/components/PaymentMonitor";
import BankingStatus from "@/components/BankingStatus";
import SecurityAlerts from "@/components/SecurityAlerts";
import PaymentModal from "@/components/PaymentModal";
import FraudAlertModal from "@/components/FraudAlertModal";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  // Redirect to home if not authenticated
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
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-light-blue-bg">
      <Navigation />
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Dashboard Stats */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: QR Generation */}
          <div className="lg:col-span-2 space-y-6">
            <EnhancedQRGenerator />
            <RecentTransactions />
          </div>
          
          {/* Right Column: Payment Status & System Info */}
          <div className="space-y-6">
            <RealTimePaymentMonitor autoStart={true} />
            <BankingStatus />
            <SecurityAlerts />
          </div>
        </div>
      </div>

      {/* Modals */}
      <PaymentModal />
      <FraudAlertModal />
    </div>
  );
}
