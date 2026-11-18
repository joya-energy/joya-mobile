import type { ClientDashboardData, ClientDashboardSite } from "@/types/dashboard";
import { formatClientDashboardDayLabel } from "./client-dashboard-site";
import { fetchClientDashboardWeather } from "./weather";

function locationQuery(site: ClientDashboardSite): string {
  const parts = [site.addressLine, site.siteLocation]
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  const unique = [...new Set(parts)];
  let query = unique.join(", ");
  if (query && !/tunis/i.test(query)) {
    query = `${query}, Tunisie`;
  }
  return query;
}

function withTodayLabel(site: ClientDashboardSite): ClientDashboardSite {
  return {
    ...site,
    dayLabel: site.dayLabel?.trim() || formatClientDashboardDayLabel(),
  };
}

function applyWeather(
  site: ClientDashboardSite,
  weather: Awaited<ReturnType<typeof fetchClientDashboardWeather>>,
): ClientDashboardSite {
  if (!weather) return withTodayLabel(site);

  return {
    ...site,
    temperatureCelsius: weather.temperatureCelsius,
    humidityPercent: weather.humidityPercent,
    dayLabel: weather.dayLabel,
    timezone: weather.timezone,
  };
}

function hasLiveWeather(site: ClientDashboardSite): boolean {
  return (
    site.temperatureCelsius !== undefined && site.humidityPercent !== undefined
  );
}

/** Adds live temp/humidity when the API did not already include them (Open-Meteo fallback). */
export async function withLiveWeather(
  clientDashboardData: ClientDashboardData,
): Promise<ClientDashboardData> {
  const site = clientDashboardData.site;

  if (hasLiveWeather(site)) {
    return { ...clientDashboardData, site: withTodayLabel(site) };
  }

  const query = locationQuery(site);
  const latitude = site.latitude;
  const longitude = site.longitude;
  const hasCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  if (!hasCoords && !query) {
    return { ...clientDashboardData, site: withTodayLabel(site) };
  }

  try {
    const weather = await fetchClientDashboardWeather({
      locationQuery: hasCoords ? "" : query,
      latitude,
      longitude,
      timezone: site.timezone,
    });
    return {
      ...clientDashboardData,
      site: applyWeather(clientDashboardData.site, weather),
    };
  } catch {
    return {
      ...clientDashboardData,
      site: withTodayLabel(clientDashboardData.site),
    };
  }
}
