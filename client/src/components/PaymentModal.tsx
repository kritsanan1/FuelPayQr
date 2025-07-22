import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/i18n";

interface PaymentModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  transaction?: any;
}

export default function PaymentModal({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  transaction: externalTransaction 
}: PaymentModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmedTransaction, setConfirmedTransaction] = useState<any>(null);

  // Mock payment confirmation for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random payment confirmations
      if (Math.random() > 0.95 && !isOpen) { // 5% chance every interval
        const mockTransaction = {
          id: `TXN-${Date.now()}`,
          amount: (Math.random() * 2000 + 500).toFixed(2),
          pump: Math.floor(Math.random() * 6) + 1,
          bank: ['PromptPay', 'Bangkok Bank', 'SCB', 'Kasikornbank'][Math.floor(Math.random() * 4)],
        };
        
        setConfirmedTransaction(mockTransaction);
        setIsOpen(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    setConfirmedTransaction(null);
    if (externalOnClose) {
      externalOnClose();
    }
  };

  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen;
  const transaction = externalTransaction || confirmedTransaction;

  if (!transaction) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-success-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-success-green" />
          </div>
          
          <h3 className="text-2xl font-poppins font-bold text-gray-900 mb-2">
            Payment Confirmed!
          </h3>
          <p className="text-gray-600 mb-6">
            Transaction completed successfully
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-petrol-blue">{transaction.id}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold">
                {typeof transaction.amount === 'string' 
                  ? formatCurrency(parseFloat(transaction.amount))
                  : formatCurrency(transaction.amount)
                }
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Pump:</span>
              <span>#{transaction.pump || transaction.pumpNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span>{transaction.bank || transaction.bankProvider}</span>
            </div>
          </div>
          
          <Button 
            onClick={handleClose}
            className="w-full bg-petrol-blue hover:bg-petrol-blue/90 text-white py-3 rounded-lg font-medium"
          >
            {t('common.continue')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
