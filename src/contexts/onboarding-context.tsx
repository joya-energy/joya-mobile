"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onboardingApi } from "@/lib/onboarding/api";
import { useClientJourney } from "@/contexts/client-journey-context";
import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding/steps";

type StepCompletion = Record<number, boolean>;
type StepProgress = Record<number, number>;

type OnboardingContextType = {
  companyId: string | null;
  setCompanyId: (id: string | null) => void;
  stepsCompleted: StepCompletion;
  stepProgress: StepProgress;
  setStepProgress: (step: number, percent: number) => void;
  setStepCompleted: (step: number) => void;
  refetchCompletion: () => Promise<void>;
  completionPercentage: number;
  /** When true the persistent progress header hides itself (e.g. post-submit views). */
  progressHidden: boolean;
  setProgressHidden: (hidden: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "current_company_id";

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { journey } = useClientJourney();
  const [companyId, setCompanyIdState] = useState<string | null>(null);
  const [stepsCompleted, setStepsCompleted] = useState<StepCompletion>({});
  const [stepProgress, setStepProgressState] = useState<StepProgress>({});
  const [progressHidden, setProgressHidden] = useState(false);

  const clampPercent = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCompanyIdState(stored || null);
    }
  }, []);

  useEffect(() => {
    if (journey?.companyId) {
      setCompanyIdState(journey.companyId);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, journey.companyId);
      }
    }
  }, [journey?.companyId]);

  const fetchCompletion = useCallback(async (id: string) => {
    try {
      const data = await onboardingApi.getCompletion(id);
      setStepsCompleted(data);
      setStepProgressState((prev) => {
        const next = { ...prev };
        for (const step of ONBOARDING_STEPS) {
          if (data[step]) next[step] = 100;
          else if (next[step] === undefined) next[step] = 0;
        }
        return next;
      });
    } catch {
      // silent — completion will be re-fetched on next navigation
    }
  }, []);

  useEffect(() => {
    if (companyId) {
      void fetchCompletion(companyId);
    }
  }, [companyId, fetchCompletion]);

  const setCompanyId = useCallback(
    (id: string | null) => {
      setCompanyIdState(id);
      if (typeof window !== "undefined") {
        if (id) {
          localStorage.setItem(STORAGE_KEY, id);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      if (id) {
        void fetchCompletion(id);
      } else {
        setStepsCompleted({});
        setStepProgressState({});
      }
    },
    [fetchCompletion],
  );

  const setStepProgress = useCallback(
    (step: number, percent: number) => {
      const nextPercent = clampPercent(percent);
      setStepProgressState((prev) => ({ ...prev, [step]: nextPercent }));
    },
    [clampPercent],
  );

  const setStepCompleted = useCallback((step: number) => {
    setStepsCompleted((prev) => ({ ...prev, [step]: true }));
    setStepProgressState((prev) => ({ ...prev, [step]: 100 }));
  }, []);

  const refetchCompletion = useCallback(async () => {
    if (companyId) await fetchCompletion(companyId);
  }, [companyId, fetchCompletion]);

  // Overall completion is simply the average of every step's live progress.
  // Completed steps are seeded to 100 in fetchCompletion, so an untouched but
  // already-saved step still counts as full — and the badge stays in sync with
  // the per-step slider because both read from the same stepProgress map.
  const completionPercentage = useMemo(() => {
    const sum = ONBOARDING_STEPS.reduce(
      (acc, step) => acc + clampPercent(stepProgress[step] ?? 0),
      0,
    );
    return Math.round(sum / TOTAL_STEPS);
  }, [clampPercent, stepProgress]);

  return (
    <OnboardingContext.Provider
      value={{
        companyId,
        setCompanyId,
        stepsCompleted,
        stepProgress,
        setStepProgress,
        setStepCompleted,
        refetchCompletion,
        completionPercentage,
        progressHidden,
        setProgressHidden,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error(
      "useOnboardingContext must be used inside OnboardingProvider",
    );
  }
  return ctx;
}
