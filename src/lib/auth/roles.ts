import type { User } from "@/types/auth";
import type { ClientJourneyPhase } from "@/lib/journey/types";
import { PHASE_HOME } from "@/lib/journey/routing";

export type UserRole = NonNullable<User["role"]>;

const LEGACY_ROLE_ALIASES: Record<string, UserRole> = {
  user_gerant: "user_manager",
  user_referent_technique: "user_technical_referent",
  installateur: "installer",
  investisseur: "investor",
};

export function normalizeRole(role?: string | null): UserRole | null {
  if (!role) return null;
  if (LEGACY_ROLE_ALIASES[role]) return LEGACY_ROLE_ALIASES[role];
  return role as UserRole;
}

export function isTechnicalReferent(role?: string | null): boolean {
  return normalizeRole(role) === "user_technical_referent";
}

/** @deprecated Use isTechnicalReferent */
export function isReferentTechnique(role?: string | null): boolean {
  return isTechnicalReferent(role);
}

export function isInstaller(role?: string | null): boolean {
  return normalizeRole(role) === "installer";
}

/** @deprecated Use isInstaller */
export function isInstallateur(role?: string | null): boolean {
  return isInstaller(role);
}

/** Default client role. Everyone except technical referent and installer.
 * Includes `lead` so password-claimed prospects can run onboarding / follow-up
 * before dossier approval promotes them to `user`. */
export function isManager(role?: string | null): boolean {
  const canonical = normalizeRole(role);
  if (!canonical) return false;
  if (canonical === "user_technical_referent" || canonical === "installer") {
    return false;
  }
  return (
    canonical === "user_manager" ||
    canonical === "user" ||
    canonical === "lead"
  );
}

/** @deprecated Use isManager */
export function isGerant(role?: string | null): boolean {
  return isManager(role);
}

export function canInviteCompanyMembers(role?: string | null): boolean {
  return isManager(role);
}

export function canSeeFollowUp(role?: string | null): boolean {
  return isManager(role);
}

export function canSeeEnvironmentalImpactReports(
  role?: string | null,
): boolean {
  return isManager(role);
}

export function getRoleLabel(role?: string | null): string {
  switch (normalizeRole(role) ?? role) {
    case "lead":
      return "Prospect";
    case "user":
    case "user_manager":
      return "Gérant";
    case "agent":
      return "Gestionnaire";
    case "user_technical_referent":
      return "Référent technique";
    case "installer":
      return "Installateur";
    case "investor":
      return "Investisseur";
    case "admin":
    case "super_admin":
      return "Administrateur";
    default:
      return "Utilisateur";
  }
}

export function canSeeEscoContract(role?: string | null): boolean {
  const canonical = normalizeRole(role);
  if (!canonical) return false;
  // Field roles don't see the financial ESCO block; managers, admins, and investors do.
  if (isTechnicalReferent(canonical) || isInstaller(canonical)) return false;
  return true;
}

export function isClientPathAllowedForRole(
  pathname: string,
  role?: string | null,
): boolean {
  if (isManager(role)) return true;

  if (
    pathname.startsWith("/client/onboarding") ||
    pathname.startsWith("/client/informations") ||
    pathname.startsWith("/client/follow-up") ||
    pathname === "/client/welcome"
  ) {
    return false;
  }

  return true;
}

export function getRoleAwareHomePath(
  role?: string | null,
  phase?: ClientJourneyPhase | null,
): string {
  if (!isManager(role)) {
    return "/client";
  }
  if (phase) {
    return PHASE_HOME[phase];
  }
  return "/client";
}
