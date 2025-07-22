import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { QrCode, Clock } from "lucide-react";
import { fuelTypes, banks } from "@/lib/i18n";

const transactionSchema = z.object({
  pumpNumber: z.string().min(1, "Pump number is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  amount: z.string().min(1, "Amount is required").regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),
  customerPhone: z.string().optional(),
  bankProvider: z.string().min(1, "Bank provider is required"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

export default function QRGenerator() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrResult, setQrResult] = useState<any>(null);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      pumpNumber: "",
      fuelType: "",
      amount: "",
      customerPhone: "",
      bankProvider: "promptpay",
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: (data) => {
      setQrResult(data);
      toast({
        title: t('common.success'),
        description: "QR Code generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      
      toast({
        title: t('common.error'),
        description: error.message || "Failed to generate QR code",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TransactionFormData) => {
    createTransactionMutation.mutate(data);
  };

  const quickAmounts = [500, 1000, 1500, 2000];

  return (
    <Card className="border-gray-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-poppins font-semibold text-gray-900">
            {t('qr.title')}
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Label className="text-sm text-gray-500">Bank:</Label>
            <span className="text-sm font-medium text-petrol-blue capitalize">
              {form.watch("bankProvider") || "PromptPay"}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Form */}
          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Pump Number */}
                <FormField
                  control={form.control}
                  name="pumpNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('qr.pumpNumber')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('qr.selectPump')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((pump) => (
                            <SelectItem key={pump} value={pump.toString()}>
                              Pump #{pump}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fuel Type */}
                <FormField
                  control={form.control}
                  name="fuelType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('qr.fuelType')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('qr.selectFuel')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(fuelTypes[language]).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('qr.amount')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-fire-red border-fire-red hover:bg-fire-red hover:text-white"
                      onClick={() => form.setValue("amount", amount.toString())}
                    >
                      ฿{amount}
                    </Button>
                  ))}
                </div>

                {/* Bank Provider */}
                <FormField
                  control={form.control}
                  name="bankProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Provider</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(banks[language]).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Customer Phone */}
                <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('qr.customerPhone')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="0XX-XXX-XXXX"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Generate Button */}
                <Button
                  type="submit"
                  className="w-full bg-petrol-blue hover:bg-petrol-blue/90 text-white font-medium"
                  disabled={createTransactionMutation.isPending}
                >
                  {createTransactionMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <QrCode className="h-4 w-4 mr-2" />
                      {t('qr.generateButton')}
                    </div>
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-gray-50 rounded-xl p-8 mb-4 border-2 border-dashed border-gray-300">
              <div className="w-48 h-48 bg-white rounded-lg shadow-lg flex items-center justify-center">
                {qrResult?.qr?.qrCode ? (
                  <img
                    src={qrResult.qr.qrCode}
                    alt="QR Code"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <QrCode className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-sm">{t('qr.willAppearHere')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {qrResult && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  {t('qr.transactionId')}: 
                  <span className="font-mono text-petrol-blue ml-1">
                    {qrResult.transaction.transactionId}
                  </span>
                </p>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-warning-yellow rounded-full animate-pulse"></div>
                  <span className="text-sm text-warning-yellow">{t('qr.awaitingPayment')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
