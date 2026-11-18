import type { ClientJourneyPhase } from "./types";
import { isManager } from "@/lib/auth/roles";

export const PHASE_HOME: Record<ClientJourneyPhase, string> = {
  welcome: "/client/welcome",
  onboarding: "/client/onboarding",
  pending_review: "/client/onboarding",
  follow_up: "/client/follow-up",
  dashboard: "/client",
};

const DASHBOARD_PREFIXES = [
  "/client/informations",
  "/client/monitoring",
  "/client/consumption",
  "/client/profile",
  "/client/alerts",
];

function isClientInboxPath(pathname: string): boolean {
  return pathname === "/client/alerts" || pathname.startsWith("/client/alerts/");
}

export function isPathAllowedForPhase(
  pathname: string,
  phase: ClientJourneyPhase,
  role?: string | null,
): boolean {
  if (!isManager(role)) {
    if (
      pathname.startsWith("/client/onboarding") ||
      pathname.startsWith("/client/informations") ||
      pathname.startsWith("/client/follow-up") ||
      pathname === "/client/welcome"
    ) {
      return false;
    }

    if (pathname === "/client") return true;
    return DASHBOARD_PREFIXES.some(
      (prefix) =>
        prefix !== "/client/informations" &&
        (pathname === prefix || pathname.startsWith(`${prefix}/`)),
    );
  }

  if (phase === "welcome") {
    return pathname === "/client/welcome";
  }
  if (phase === "onboarding") {
    return pathname.startsWith("/client/onboarding") || isClientInboxPath(pathname);
  }
  if (phase === "pending_review") {
    return pathname.startsWith("/client/onboarding") || isClientInboxPath(pathname);
  }
  if (phase === "follow_up") {
    const followUpPaths = [
      "/client/follow-up",
      "/client/informations",
      "/client/profile",
      "/client/alerts",
    ];
    return followUpPaths.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
  }
  if (pathname === "/client") return true;
  return DASHBOARD_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function showAppShell(phase: ClientJourneyPhase): boolean {
  return phase === "dashboard" || phase === "follow_up";
}
