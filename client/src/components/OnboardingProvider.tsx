import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import OnboardingTutorial from "./OnboardingTutorial";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  showTutorial: () => void;
  hideTutorial: () => void;
  isTutorialOpen: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
}

export default function OnboardingProvider({ children }: OnboardingProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Fetch user onboarding status
  const { data: onboardingData, refetch } = useQuery({
    queryKey: ['/api/onboarding/user', (user as any)?.id],
    queryFn: () => fetch(`/api/onboarding/user/${(user as any)?.id}`).then(res => res.json()),
    enabled: !!(user as any)?.id && isAuthenticated,
  });

  const isOnboardingComplete = onboardingData?.hasCompletedOnboarding || false;

  // Auto-show tutorial for new users
  useEffect(() => {
    if (isAuthenticated && onboardingData && !isOnboardingComplete && !hasShownWelcome) {
      // Small delay to let the dashboard load first
      const timer = setTimeout(() => {
        setIsTutorialOpen(true);
        setHasShownWelcome(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, onboardingData, isOnboardingComplete, hasShownWelcome]);

  const showTutorial = () => {
    setIsTutorialOpen(true);
  };

  const hideTutorial = () => {
    setIsTutorialOpen(false);
  };

  const handleComplete = () => {
    setIsTutorialOpen(false);
    refetch(); // Refresh onboarding status
  };

  const contextValue: OnboardingContextType = {
    isOnboardingComplete,
    showTutorial,
    hideTutorial,
    isTutorialOpen,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      
      {/* Tutorial Dialog */}
      <OnboardingTutorial
        isOpen={isTutorialOpen}
        onClose={hideTutorial}
        onComplete={handleComplete}
      />
      
      {/* Welcome Button for completed users */}
      {isAuthenticated && isOnboardingComplete && !isTutorialOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <Button
            onClick={showTutorial}
            size="lg"
            className="bg-gradient-to-r from-[#367FA9] to-[#D14906] text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-3 flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            <span className="hidden sm:inline">Replay Tutorial</span>
            <BookOpen className="h-5 w-5 sm:hidden" />
          </Button>
        </motion.div>
      )}
      
      {/* New User Welcome Indicator */}
      {isAuthenticated && !isOnboardingComplete && !isTutorialOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-6 right-6 z-50 sm:left-auto sm:right-6 sm:w-80"
        >
          <div className="bg-gradient-to-r from-[#367FA9] to-[#D14906] text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl"
              >
                👋
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold">Welcome to GasPay QR!</h3>
                <p className="text-sm opacity-90">Ready to learn? Let's get started!</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={showTutorial}
                className="shrink-0"
              >
                Start Tour
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </OnboardingContext.Provider>
  );
}