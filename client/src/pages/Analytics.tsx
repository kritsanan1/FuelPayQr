import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Clock } from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

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
    return null;
  }

  return (
    <div className="min-h-screen bg-light-blue-bg">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
            {t('actions.viewAnalytics')}
          </h1>
          <p className="text-gray-600">
            Comprehensive transaction analytics and performance metrics
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Revenue This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">฿145,280</div>
              <p className="text-xs text-success-green">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">1,247</div>
              <p className="text-xs text-success-green">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +15.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Avg Processing Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">2.3s</div>
              <p className="text-xs text-success-green">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                0.5s faster than last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">99.2%</div>
              <p className="text-xs text-success-green">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +0.3% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chart component would be implemented here</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Fuel Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Chart component would be implemented here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
