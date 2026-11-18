export type ClientJourneyPhase =
  | "welcome"
  | "onboarding"
  | "pending_review"
  | "follow_up"
  | "dashboard";

export type ClientJourneyResponse = {
  phase: ClientJourneyPhase;
  companyId: string | null;
  status: string | null;
  onboardingStarted: boolean;
  welcomeSeen: boolean;
  followUpCompleted: boolean;
  hasLinkedInverter?: boolean;
  adminNote: string | null;
  revisionItems: string[];
};
