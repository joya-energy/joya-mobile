import type { ClientDashboardSite } from "@/types/dashboard";
import type { FetchClientDashboardWeatherParams } from "./weather";

function toFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

/** Rough Tunisia bounds — rejects null-island / bad Enode GPS. */
function isPlausibleTunisiaCoordinates(lat: number, lng: number): boolean {
  return lat >= 30 && lat <= 38.5 && lng >= 7 && lng <= 12.5;
}

function normalizeTunisiaQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return "";
  return /tunis/i.test(trimmed) ? trimmed : `${trimmed}, Tunisie`;
}

/** Inverter mean GPS from the dashboard API when valid. */
export function getInverterWeatherCoordinates(
  site: ClientDashboardSite,
): { latitude: number; longitude: number } | null {
  const lat = toFiniteNumber(site.latitude);
  const lng = toFiniteNumber(site.longitude);
  if (lat === undefined || lng === undefined) return null;
  if (!isPlausibleTunisiaCoordinates(lat, lng)) return null;
  return { latitude: lat, longitude: lng };
}

export function buildOnboardingWeatherQuery(
  onboardingLocationQuery?: string | null,
): string {
  return normalizeTunisiaQuery(onboardingLocationQuery?.trim() ?? "");
}

export function buildOnboardingGovernorateQuery(
  onboardingLocationQuery?: string | null,
): string {
  if (!onboardingLocationQuery?.trim()) return "";
  const parts = onboardingLocationQuery
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const governorate = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  if (!governorate || /tunisie/i.test(governorate)) return "";
  return normalizeTunisiaQuery(governorate);
}

function buildSiteWeatherQuery(site: ClientDashboardSite): string {
  const parts = [site.addressLine, site.siteLocation]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  const unique = [...new Set(parts)];
  return normalizeTunisiaQuery(unique.join(", "));
}

/**
 * Ordered Open-Meteo attempts: inverter GPS → onboarding address → governorate → site text → Tunis.
 */
export function buildBannerWeatherAttempts(
  site: ClientDashboardSite,
  onboardingLocationQuery?: string | null,
): FetchClientDashboardWeatherParams[] {
  const attempts: FetchClientDashboardWeatherParams[] = [];
  const seen = new Set<string>();

  const push = (params: FetchClientDashboardWeatherParams) => {
    const lat = toFiniteNumber(params.latitude);
    const lng = toFiniteNumber(params.longitude);
    const key =
      lat !== undefined && lng !== undefined
        ? `coords:${lat},${lng}`
        : `q:${params.locationQuery.trim().toLowerCase()}`;
    if (!key || key === "q:" || seen.has(key)) return;
    seen.add(key);
    attempts.push(params);
  };

  const inverter = getInverterWeatherCoordinates(site);
  if (inverter) {
    push({
      locationQuery: "",
      latitude: inverter.latitude,
      longitude: inverter.longitude,
      timezone: site.timezone,
    });
  }

  const onboarding = buildOnboardingWeatherQuery(onboardingLocationQuery);
  if (onboarding) {
    push({ locationQuery: onboarding, timezone: site.timezone });
  }

  const governorate = buildOnboardingGovernorateQuery(onboardingLocationQuery);
  if (governorate && governorate !== onboarding) {
    push({ locationQuery: governorate, timezone: site.timezone });
  }

  const siteQuery = buildSiteWeatherQuery(site);
  if (siteQuery) {
    push({ locationQuery: siteQuery, timezone: site.timezone });
  }

  if (/zaghouan/i.test(siteQuery) || /zaghouan/i.test(onboarding)) {
    push({ locationQuery: "Tunis, Tunisie", timezone: site.timezone });
  }

  if (attempts.length === 0) {
    push({ locationQuery: "Tunis, Tunisie", timezone: site.timezone });
  }

  return attempts;
}

/** @deprecated Use buildBannerWeatherAttempts — kept for single-path callers. */
export function buildBannerWeatherLocation(
  site: ClientDashboardSite,
  onboardingLocationQuery?: string | null,
): {
  latitude?: number;
  longitude?: number;
  locationQuery: string;
} {
  const attempts = buildBannerWeatherAttempts(site, onboardingLocationQuery);
  const first = attempts[0];
  const lat = toFiniteNumber(first.latitude);
  const lng = toFiniteNumber(first.longitude);
  if (lat !== undefined && lng !== undefined) {
    return { latitude: lat, longitude: lng, locationQuery: "" };
  }
  return { locationQuery: first.locationQuery };
}
