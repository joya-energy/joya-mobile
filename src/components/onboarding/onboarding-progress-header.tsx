"use client";

import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ob } from "@/lib/onboarding/theme";
import { useOnboardingContext } from "@/contexts/onboarding-context";
import {
  ONBOARDING_STEP_CONFIG,
  TOTAL_STEPS,
  getStepByPath,
} from "@/lib/onboarding/steps";
import { JoyaEyebrow } from "@/components/joya";

const clamp = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value || 0)));

/**
 * Persistent onboarding progress header.
 *
 * Mounted once in the onboarding shell so it never unmounts when the user
 * navigates between steps — only its values update. It reads everything from
 * the onboarding context, so the overall percentage and the per-step slider
 * react live to every field change without any reload.
 */
export function OnboardingProgressHeader() {
  const pathname = usePathname();
  const { stepProgress, stepsCompleted, completionPercentage, progressHidden } =
    useOnboardingContext();

  const current = getStepByPath(pathname);

  if (progressHidden) return null;

  const stepPercentage = clamp(stepProgress[current.step] ?? 0);

  return (
    <div className="mb-8 w-full space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <JoyaEyebrow className="mb-2.5">
            {TOTAL_STEPS > 1 ? `Étape ${current.step} sur ${TOTAL_STEPS}` : "Intégration"}
          </JoyaEyebrow>
          <h1 className={ob.pageTitle}>{current.title}</h1>
          <p className={cn(ob.stepMeta, "mt-1.5")}>
            {TOTAL_STEPS > 1
              ? "Complétez chaque section, vos réponses sont enregistrées au fur et à mesure."
              : "Téléversez vos documents et soumettez votre dossier"}
          </p>
        </div>
        <div className={ob.badge} aria-live="polite">
          <span className="font-data tabular-nums">{completionPercentage}%</span> complété
        </div>
      </div>

      <div
        className={ob.progressTrack}
        role="progressbar"
        aria-label="Progression de l'étape"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={stepPercentage}
      >
        <div className={ob.progressFill} style={{ width: `${stepPercentage}%` }} />
      </div>

      {TOTAL_STEPS > 1 ? (
        <ol className="grid grid-cols-2 gap-2 pt-1 sm:gap-3">
          {ONBOARDING_STEP_CONFIG.map((s) => {
            const isCurrent = s.step === current.step;
            const isDone = !!stepsCompleted[s.step] && !isCurrent;
            return (
              <li
                key={s.step}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                  isCurrent
                    ? "border-coral/30 bg-white shadow-joya-xs"
                    : "border-transparent bg-white/50",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full border font-data text-[11px] font-medium transition-colors",
                    isCurrent
                      ? "border-coral bg-coral text-white"
                      : isDone
                        ? "border-success/30 bg-success-soft text-success"
                        : "border-line-strong bg-white text-slate-400",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-label="Terminée" /> : s.step}
                </span>
                <span
                  className={cn(
                    "truncate text-[12.5px] font-semibold",
                    isCurrent || isDone ? "text-navy" : "text-slate-400",
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
