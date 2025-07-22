import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, QrCode, Smartphone, CreditCard, Fuel, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const qrFormSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1 THB").max(10000, "Amount cannot exceed 10,000 THB"),
  bankProvider: z.string().min(1, "Please select a bank provider"),
  fuelType: z.string().min(1, "Please select fuel type"),
  pumpNumber: z.string().min(1, "Please enter pump number"),
  customerPhone: z.string().optional(),
});

type QRFormData = z.infer<typeof qrFormSchema>;

const fuelTypes = [
  { value: 'gasohol_91', label: 'Gasohol 91', price: 35.50 },
  { value: 'gasohol_95', label: 'Gasohol 95', price: 36.80 },
  { value: 'gasohol_e20', label: 'Gasohol E20', price: 34.20 },
  { value: 'benzine_95', label: 'Benzine 95', price: 42.10 },
  { value: 'diesel', label: 'Diesel', price: 31.90 },
  { value: 'diesel_b7', label: 'Diesel B7', price: 32.40 },
];

const bankProviders = [
  { 
    value: 'promptpay', 
    label: 'PromptPay (Universal)', 
    icon: '🏦',
    color: 'bg-blue-500',
    description: 'Works with all Thai banks'
  },
  { 
    value: 'bbl', 
    label: 'Bangkok Bank', 
    icon: '🟦',
    color: 'bg-blue-700',
    description: 'BBL Mobile Banking'
  },
  { 
    value: 'scb', 
    label: 'Siam Commercial Bank', 
    icon: '🟣',
    color: 'bg-purple-600',
    description: 'SCB Easy App'
  },
  { 
    value: 'kasikorn', 
    label: 'Kasikornbank', 
    icon: '🟢',
    color: 'bg-green-600',
    description: 'K Plus App'
  },
];

export default function EnhancedQRGenerator() {
  const [generatedQR, setGeneratedQR] = useState<any>(null);
  const [selectedFuel, setSelectedFuel] = useState<any>(null);
  const [liters, setLiters] = useState<number>(1);
  const { toast } = useToast();

  const form = useForm<QRFormData>({
    resolver: zodResolver(qrFormSchema),
    defaultValues: {
      amount: 100,
      bankProvider: 'promptpay',
      fuelType: 'gasohol_91',
      pumpNumber: '1',
      customerPhone: '',
    },
  });

  // Fetch real-time bank status
  const { data: bankStatus } = useQuery({
    queryKey: ['/api/banking/status'],
    queryFn: () => fetch('/api/banking/status').then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Generate QR mutation
  const generateQRMutation = useMutation({
    mutationFn: (data: QRFormData) => 
      apiRequest('/api/qr/generate', 'POST', {
        ...data,
        transactionId: `TXN-${Date.now()}`,
      }),
    onSuccess: (data) => {
      setGeneratedQR(data);
      toast({
        title: "QR Code Generated! 🎉",
        description: `Payment QR for ${data.amount} THB created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to generate QR code",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QRFormData) => {
    generateQRMutation.mutate(data);
  };

  const calculateAmount = () => {
    if (selectedFuel) {
      const total = selectedFuel.price * liters;
      form.setValue('amount', total);
      return total;
    }
    return form.watch('amount');
  };

  const getBankStatus = (bankCode: string) => {
    if (!bankStatus) return 'unknown';
    const bank = bankStatus.find((b: any) => b.bank === bankCode);
    return bank?.status || 'unknown';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-petrol-blue/20">
        <CardHeader className="bg-gradient-to-r from-petrol-blue to-petrol-blue/80 text-white">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Enhanced QR Payment Generator
          </CardTitle>
          <p className="text-petrol-blue-light">Generate secure QR codes for Thai banking systems</p>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="quick" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Quick Payment
              </TabsTrigger>
              <TabsTrigger value="fuel" className="flex items-center gap-2">
                <Fuel className="h-4 w-4" />
                Fuel Calculator
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="space-y-4">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount (THB)</Label>
                    <Input
                      id="amount"
                      type="number"
                      {...form.register('amount', { valueAsNumber: true })}
                      className="text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pumpNumber">Pump Number</Label>
                    <Input
                      id="pumpNumber"
                      {...form.register('pumpNumber')}
                      placeholder="e.g., 1, 2, 3"
                    />
                  </div>
                </div>

                <div>
                  <Label>Bank Provider</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {bankProviders.map((bank) => (
                      <div
                        key={bank.value}
                        className={`relative p-3 border rounded-lg cursor-pointer transition-all ${
                          form.watch('bankProvider') === bank.value
                            ? 'border-petrol-blue bg-petrol-blue/5'
                            : 'border-gray-200 hover:border-petrol-blue/50'
                        }`}
                        onClick={() => form.setValue('bankProvider', bank.value)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{bank.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{bank.label}</div>
                            <div className="text-xs text-gray-500">{bank.description}</div>
                          </div>
                          <Badge
                            variant={getBankStatus(bank.value) === 'online' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {getBankStatus(bank.value)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
                  <Input
                    id="customerPhone"
                    {...form.register('customerPhone')}
                    placeholder="08X-XXX-XXXX"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-petrol-blue hover:bg-petrol-blue/90"
                  disabled={generateQRMutation.isPending}
                >
                  {generateQRMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="fuel" className="space-y-4">
              <Alert>
                <Fuel className="h-4 w-4" />
                <AlertDescription>
                  Select fuel type and quantity to automatically calculate the total amount
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label>Fuel Type & Price</Label>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {fuelTypes.map((fuel) => (
                      <div
                        key={fuel.value}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedFuel?.value === fuel.value
                            ? 'border-fire-engine-red bg-fire-engine-red/5'
                            : 'border-gray-200 hover:border-fire-engine-red/50'
                        }`}
                        onClick={() => {
                          setSelectedFuel(fuel);
                          form.setValue('fuelType', fuel.value);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{fuel.label}</span>
                          <span className="text-fire-engine-red font-bold">{fuel.price} THB/L</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedFuel && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Label htmlFor="liters">Liters</Label>
                    <Input
                      id="liters"
                      type="number"
                      value={liters}
                      onChange={(e) => setLiters(Number(e.target.value))}
                      min="0.1"
                      step="0.1"
                      className="mt-1"
                    />
                    <div className="mt-2 text-sm text-gray-600">
                      Total: <span className="font-bold text-lg text-fire-engine-red">
                        {calculateAmount().toFixed(2)} THB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Generated QR Display */}
          {generatedQR && (
            <div className="mt-6 p-4 border-2 border-dashed border-petrol-blue rounded-lg bg-petrol-blue/5">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-petrol-blue">Payment QR Code Generated</h3>
                
                <div className="bg-white p-4 rounded-lg inline-block shadow-lg">
                  <img 
                    src={generatedQR.qrCode} 
                    alt="Payment QR Code" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-bold">{generatedQR.amount} THB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bank:</span>
                    <span className="font-bold">{generatedQR.bankProvider.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-xs">{generatedQR.transactionId}</span>
                  </div>
                  {generatedQR.expiresAt && (
                    <div className="flex justify-between items-center">
                      <span>Expires:</span>
                      <span className="flex items-center gap-1 text-orange-600">
                        <Clock className="h-3 w-3" />
                        {new Date(generatedQR.expiresAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setGeneratedQR(null)}
                  >
                    Generate New
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-fire-engine-red hover:bg-fire-engine-red/90"
                  >
                    Start Monitoring
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}