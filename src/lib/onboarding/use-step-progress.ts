import { useEffect } from "react";
import { useOnboardingContext } from "@/contexts/onboarding-context";

/**
 * Compute a step's live completion percentage from a list of boolean checks
 * and report it to the onboarding context, which drives both the per-step
 * slider and the overall percentage in the persistent header.
 *
 * `ready` should be `false` while the page is still loading its saved data.
 * While not ready we skip reporting so the header keeps showing the last known
 * value (e.g. 100% for an already-completed step) instead of flashing to 0%.
 *
 * @returns the live percentage so callers can reuse it for button states.
 */
export function useReportStepProgress(
  step: number,
  checks: boolean[],
  ready: boolean = true,
): number {
  const { setStepProgress } = useOnboardingContext();
  const total = checks.length || 1;
  const percentage = Math.round(
    (checks.filter(Boolean).length / total) * 100,
  );

  useEffect(() => {
    if (!ready) return;
    setStepProgress(step, percentage);
  }, [ready, step, percentage, setStepProgress]);

  return percentage;
}
