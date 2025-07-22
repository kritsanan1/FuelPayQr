import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface FraudAlertModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  alert?: any;
}

export default function FraudAlertModal({ 
  isOpen: externalIsOpen, 
  onClose: externalOnClose,
  alert: externalAlert 
}: FraudAlertModalProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<any>(null);

  // Mock fraud detection for demo
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random fraud alerts (very rare)
      if (Math.random() > 0.998 && !isOpen) { // 0.2% chance every interval
        const mockAlert = {
          id: `FRAUD-${Date.now()}`,
          description: 'Multiple failed payment attempts detected for transaction #TXN-240115-129. Please verify customer identity before proceeding.',
          riskLevel: 'high',
          transactionId: `TXN-${Date.now()}`,
        };
        
        setCurrentAlert(mockAlert);
        setIsOpen(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    setCurrentAlert(null);
    if (externalOnClose) {
      externalOnClose();
    }
  };

  const handleBlock = () => {
    // Handle blocking transaction
    console.log('Blocking transaction:', currentAlert?.transactionId);
    handleDismiss();
  };

  const isModalOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen;
  const alert = externalAlert || currentAlert;

  if (!alert) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={handleDismiss}>
      <DialogContent className="max-w-md">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-fire-red bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-fire-red" />
          </div>
          
          <DialogTitle className="text-2xl font-poppins font-bold text-gray-900 mb-2">
            Security Alert
          </DialogTitle>
          <p className="text-gray-600 mb-6">
            Suspicious activity detected
          </p>
          
          <div className="bg-fire-red bg-opacity-5 border border-fire-red border-opacity-20 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-700">
              {alert.description}
            </p>
            {alert.transactionId && (
              <p className="text-xs text-gray-500 mt-2">
                Transaction: {alert.transactionId}
              </p>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Dismiss
            </Button>
            <Button 
              onClick={handleBlock}
              className="flex-1 bg-fire-red hover:bg-fire-red/90 text-white"
            >
              Block Transaction
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
