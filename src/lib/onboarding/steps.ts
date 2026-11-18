/**
 * UI onboarding flow — single step for the client.
 * Backend still persists data across steps 1–6.
 */

export type OnboardingStepConfig = {
  step: number;
  path: string;
  label: string;
  title: string;
};

export const ONBOARDING_STEP_CONFIG: readonly OnboardingStepConfig[] = [
  {
    step: 1,
    path: "/client/onboarding",
    label: "Documents",
    title: "Intégration client",
  },
] as const;

export const ONBOARDING_STEPS = ONBOARDING_STEP_CONFIG.map((c) => c.step);
export const TOTAL_STEPS = ONBOARDING_STEP_CONFIG.length;

/** UI step that must be completed before final submit. */
export const REQUIRED_STEPS = [1];

/** Backend dossier sections (used for completion API keys 1–5). */
export const BACKEND_DOSSIER_STEPS = [1, 2, 3, 4, 5] as const;

export const STEP_LABELS: Record<number, string> = {
  1: "Documents",
};

export const BACKEND_STEP_LABELS: Record<number, string> = {
  1: "Informations entreprise",
  2: "Informations gérant",
  3: "Données énergétiques",
  4: "Site & toiture",
  5: "Situation financière",
  6: "Finalisation",
};

export const STEP_PATHS: Record<number, string> = ONBOARDING_STEP_CONFIG.reduce(
  (acc, c) => {
    acc[c.step] = c.path;
    return acc;
  },
  {} as Record<number, string>,
);

export function getStepByPath(pathname: string | null): OnboardingStepConfig {
  if (!pathname) return ONBOARDING_STEP_CONFIG[0];
  const exact = ONBOARDING_STEP_CONFIG.find((c) => c.path === pathname);
  if (exact) return exact;
  return ONBOARDING_STEP_CONFIG[0];
}
