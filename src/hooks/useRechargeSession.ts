import { useState, useCallback, useMemo } from 'react';
import type { EnrichedBike, ChargingStation, UserLocation } from '../types/gbfs';
import type { SessionPlan, SessionWaypoint } from '../types/session';
import { generateOptimizedRechargeSession } from '../services/sessionRouteOptimizer';

export function useRechargeSession(
  userLocation: UserLocation | null,
  bikes: EnrichedBike[],
  stations: ChargingStation[]
) {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(1);
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);

  // Démarrer une nouvelle session
  const startSession = useCallback(() => {
    if (!userLocation) return false;

    const newPlan = generateOptimizedRechargeSession(userLocation, bikes, stations);
    if (!newPlan || newPlan.waypoints.length <= 1) {
      alert("Aucun vélo à recharger trouvé dans votre zone immédiate. Rapprochez-vous d'un secteur opérationnel Lime.");
      return false;
    }

    setPlan(newPlan);
    setCurrentStepIndex(1); // Première étape après le départ
    setCompletedStepIds([]);
    setIsSessionActive(true);
    return true;
  }, [userLocation, bikes, stations]);

  // Quitter la session
  const endSession = useCallback(() => {
    setIsSessionActive(false);
    setPlan(null);
    setCurrentStepIndex(1);
    setCompletedStepIds([]);
  }, []);

  // Valider l'étape en cours et passer à la suivante
  const completeCurrentStep = useCallback(() => {
    if (!plan) return;

    const currentWp = plan.waypoints[currentStepIndex];
    if (currentWp) {
      setCompletedStepIds((prev) => Array.from(new Set([...prev, currentWp.id])));
    }

    if (currentStepIndex < plan.waypoints.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [plan, currentStepIndex]);

  // Sélectionner une étape spécifique
  const goToStep = useCallback((index: number) => {
    if (!plan || index < 0 || index >= plan.waypoints.length) return;
    setCurrentStepIndex(index);
  }, [plan]);

  // Étape active
  const activeWaypoint: SessionWaypoint | null = useMemo(() => {
    if (!plan || currentStepIndex >= plan.waypoints.length) return null;
    return plan.waypoints[currentStepIndex];
  }, [plan, currentStepIndex]);

  // Progression en %
  const progressPercent = useMemo(() => {
    if (!plan || plan.waypoints.length <= 1) return 0;
    const totalSteps = plan.waypoints.length - 1; // Sans le départ
    const completedCount = completedStepIds.length;
    return Math.min(100, Math.round((completedCount / totalSteps) * 100));
  }, [plan, completedStepIds]);

  return {
    isSessionActive,
    plan,
    currentStepIndex,
    activeWaypoint,
    completedStepIds,
    progressPercent,
    startSession,
    endSession,
    completeCurrentStep,
    goToStep,
  };
}
