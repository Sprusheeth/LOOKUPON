import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TourContextType {
  isTourActive: boolean;
  currentStep: number;
  hasSeenTour: boolean;
  startTour: () => void;
  skipTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: ReactNode }) {
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    return localStorage.getItem('lookupon_tour_seen') === 'true';
  });
  
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-start prompt logic is handled by the GuidedTour component,
  // we just provide the state here.

  const startTour = () => {
    setIsTourActive(true);
    setCurrentStep(1); // Step 0 is the welcome modal
    setHasSeenTour(true);
    localStorage.setItem('lookupon_tour_seen', 'true');
  };

  const skipTour = () => {
    setIsTourActive(false);
    setHasSeenTour(true);
    localStorage.setItem('lookupon_tour_seen', 'true');
  };

  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => Math.max(1, prev - 1));
  
  const endTour = () => {
    setIsTourActive(false);
    setCurrentStep(0);
  };

  return (
    <TourContext.Provider value={{
      isTourActive, currentStep, hasSeenTour,
      startTour, skipTour, nextStep, prevStep, endTour
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) throw new Error('useTour must be used within TourProvider');
  return context;
}
