import type { DashboardInverter } from "@/types/dashboard";

export type DeviceScope = "all" | string;

export function deviceScopeStorageKey(companyId?: string | null): string {
  return companyId
    ? `joya_selected_asset_id:${companyId}`
    : "joya_selected_asset_id:me";
}

export function siteScopeStorageKey(companyId?: string | null): string {
  return companyId
    ? `joya_selected_site_id:${companyId}`
    : "joya_selected_site_id:me";
}

export function readStoredSiteScope(companyId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(siteScopeStorageKey(companyId));
  return raw?.trim() ? raw : null;
}

export function writeStoredSiteScope(
  siteId: string,
  companyId?: string | null,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(siteScopeStorageKey(companyId), siteId);
}

export function readStoredDeviceScope(companyId?: string | null): DeviceScope | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(deviceScopeStorageKey(companyId));
  return raw === "all" || raw ? raw : null;
}

export function writeStoredDeviceScope(
  scope: DeviceScope,
  companyId?: string | null,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(deviceScopeStorageKey(companyId), scope);
}

export function pickDefaultDeviceScope(inverters: DashboardInverter[]): DeviceScope {
  if (inverters.length <= 1) {
    return inverters[0]?.id ?? "all";
  }
  const connected = inverters.find((i) => i.status === "connected");
  return connected?.id ?? inverters[0].id;
}

export function scopeToAssetId(scope: DeviceScope): string | undefined {
  return scope === "all" ? undefined : scope;
}

export function filterAlertsForDeviceScope<T extends { assetId?: string; type?: string }>(
  alerts: T[],
  scope: DeviceScope,
): T[] {
  if (scope === "all") return alerts;
  return alerts.filter((alert) => {
    if (!alert.type?.startsWith("asset.")) return true;
    return alert.assetId === scope;
  });
}
