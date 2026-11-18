import type { DashboardScopeSite } from "@/types/dashboard";

/** Ensures the UI always has site context when the API resolved a site scope. */
export function resolveScopeSites(
  scopeSites: DashboardScopeSite[],
  scopeSiteId: string | null,
  inverterCount: number,
  fallbackSiteName?: string | null,
): DashboardScopeSite[] {
  if (scopeSites.length > 0) {
    return scopeSites;
  }

  const name = fallbackSiteName?.trim() || "Installation";
  if (scopeSiteId) {
    return [
      {
        id: scopeSiteId,
        name,
        status: "active",
        inverterCount,
      },
    ];
  }

  return [];
}
