import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ArrowRight, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { TutorialCharacter, TutorialStep, UserOnboarding } from "@shared/schema";

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const { user } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch onboarding data
  const { data: onboardingData } = useQuery({
    queryKey: ['/api/onboarding/user', (user as any)?.id],
    queryFn: () => fetch(`/api/onboarding/user/${(user as any)?.id}`).then(res => res.json()),
    enabled: !!(user as any)?.id && isOpen,
  });

  // Fetch tutorial steps and characters
  const { data: tutorialData } = useQuery({
    queryKey: ['/api/onboarding/tutorial'],
    queryFn: () => fetch('/api/onboarding/tutorial').then(res => res.json()),
    enabled: isOpen,
  });

  // Update onboarding progress
  const updateProgressMutation = useMutation({
    mutationFn: (data: { stepNumber: number; action: string }) =>
      apiRequest('/api/onboarding/progress', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/user'] });
    },
  });

  // Complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/onboarding/complete', 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/user'] });
      onComplete();
    },
  });

  const steps: (TutorialStep & { character: TutorialCharacter })[] = tutorialData?.steps || [];
  const characters: Record<number, TutorialCharacter> = tutorialData?.characters || {};
  const currentStep = steps[currentStepIndex];
  const character = currentStep?.character;

  useEffect(() => {
    if (onboardingData) {
      setCurrentStepIndex(onboardingData.currentStep || 0);
      setCompletedSteps(onboardingData.completedSteps || []);
    }
  }, [onboardingData]);

  const handleNext = async () => {
    if (!currentStep) return;

    setIsAnimating(true);
    
    // Mark current step as completed
    const newCompletedSteps = [...completedSteps, currentStep.stepNumber];
    setCompletedSteps(newCompletedSteps);

    // Update progress in database
    await updateProgressMutation.mutateAsync({
      stepNumber: currentStep.stepNumber,
      action: 'completed'
    });

    setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        // Tutorial completed!
        completeOnboardingMutation.mutate();
      }
      setIsAnimating(false);
    }, 500);
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkipStep = async () => {
    if (currentStep?.isOptional) {
      await updateProgressMutation.mutateAsync({
        stepNumber: currentStep.stepNumber,
        action: 'skipped'
      });
      handleNext();
    }
  };

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  if (!steps.length || !currentStep) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-[#367FA9]">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              GasPay QR Tutorial
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Step {currentStepIndex + 1} of {steps.length}</span>
              <Badge variant="secondary" className="bg-[#367FA9]/10 text-[#367FA9]">
                {Math.round(progressPercentage)}% Complete
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-2 border-[#367FA9]/20">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    {character && (
                      <motion.div
                        className="text-4xl"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {character.avatar}
                      </motion.div>
                    )}
                    <div>
                      <CardTitle className="text-xl text-[#367FA9]">
                        {currentStep.title}
                      </CardTitle>
                      {character && (
                        <p className="text-sm text-muted-foreground mt-1">
                          with {character.name} - {character.role}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {currentStep.description && (
                    <p className="text-muted-foreground">
                      {currentStep.description}
                    </p>
                  )}
                  
                  <motion.div
                    className="bg-gradient-to-r from-[#367FA9]/5 to-[#D14906]/5 p-4 rounded-lg border border-[#367FA9]/20"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <p className="text-gray-800 leading-relaxed">
                      {currentStep.message}
                    </p>
                  </motion.div>

                  {currentStep.actionRequired && currentStep.actionRequired !== 'complete' && (
                    <div className="flex items-center gap-2 text-sm text-[#D14906] bg-[#D14906]/10 p-3 rounded-lg">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        ⚡
                      </motion.div>
                      <span className="font-medium">
                        Action needed: {currentStep.actionRequired === 'click' ? 'Click the highlighted element' :
                                      currentStep.actionRequired === 'form' ? 'Fill out the form' :
                                      currentStep.actionRequired === 'navigate' ? 'Navigate to the section' :
                                      currentStep.actionRequired === 'wait' ? 'Watch the demonstration' :
                                      currentStep.actionRequired === 'tap' ? 'Tap to try it out' :
                                      'Follow the instruction'}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              
              {currentStep?.isOptional && (
                <Button
                  variant="ghost"
                  onClick={handleSkipStep}
                  className="text-muted-foreground"
                >
                  Skip this step
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={isAnimating || updateProgressMutation.isPending}
              className="flex items-center gap-2 bg-[#367FA9] hover:bg-[#367FA9]/90"
            >
              {currentStepIndex === steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Complete Tutorial
                </>
              ) : (
                <>
                  Next Step
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}