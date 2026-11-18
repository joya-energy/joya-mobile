/**
 * Live weather for the site banner via Open-Meteo (client-side, not core-api).
 * Coordinates come from the dashboard API: mean GPS of solar inverters when
 * `location_latitude` / `location_longitude` are set, else site geo or address geocoding.
 * https://open-meteo.com/
 */

export type ClientDashboardWeather = {
  temperatureCelsius: number;
  humidityPercent: number;
  windSpeedKmh?: number;
  irradiationWm2?: number;
  dayLabel: string;
  resolvedLocation: string;
  timezone: string;
};

type GeocodingResult = {
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type GeocodingResponse = {
  results?: GeocodingResult[];
};

type ForecastResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    shortwave_radiation?: number;
  };
};

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

function formatDayLabelFr(date: Date, timeZone: string): string {
  const weekday = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    timeZone,
  }).format(date);
  const rest = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
  return `${weekday} ${rest}`;
}

async function geocodeLocation(query: string): Promise<GeocodingResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", trimmed);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "fr");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as GeocodingResponse;
  const results = data.results ?? [];
  const tunisia =
    results.find((r) => r.country?.toLowerCase() === "tunisie") ?? results[0];
  return tunisia ?? null;
}

async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<ClientDashboardWeather | null> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("timezone", timezone);
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation",
  );

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as ForecastResponse;
  const current = data.current;
  if (
    current?.temperature_2m === undefined ||
    current.relative_humidity_2m === undefined ||
    !current.time
  ) {
    return null;
  }

  const observedAt = new Date(current.time);

  return {
    temperatureCelsius: Math.round(current.temperature_2m),
    humidityPercent: Math.round(current.relative_humidity_2m),
    windSpeedKmh:
      current.wind_speed_10m !== undefined
        ? Math.round(current.wind_speed_10m)
        : undefined,
    irradiationWm2:
      current.shortwave_radiation !== undefined
        ? Math.round(current.shortwave_radiation)
        : undefined,
    dayLabel: formatDayLabelFr(observedAt, timezone),
    resolvedLocation: "",
    timezone,
  };
}

/** Try each location strategy until Open-Meteo returns temp + humidity. */
export async function fetchBannerWeatherWithFallbacks(
  attempts: FetchClientDashboardWeatherParams[],
): Promise<ClientDashboardWeather | null> {
  for (const attempt of attempts) {
    const weather = await fetchClientDashboardWeather(attempt);
    if (weather) return weather;
  }
  return null;
}

export type FetchClientDashboardWeatherParams = {
  locationQuery: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
};


function toFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function fetchClientDashboardWeather(
  params: FetchClientDashboardWeatherParams,
): Promise<ClientDashboardWeather | null> {
  let query = params.locationQuery.trim();
  if (query && !/tunis/i.test(query)) {
    query = `${query}, Tunisie`;
  }

  let latitude = toFiniteNumber(params.latitude);
  let longitude = toFiniteNumber(params.longitude);

  if (latitude === undefined && longitude === undefined && !query) {
    return null;
  }
  let timezone = params.timezone ?? "auto";
  let resolvedLocation = query;

  if (latitude === undefined || longitude === undefined) {
    const place = await geocodeLocation(query);
    if (!place) return null;
    latitude = place.latitude;
    longitude = place.longitude;
    timezone = place.timezone;
    resolvedLocation = place.country
      ? `${place.name}, ${place.country}`
      : place.name;
  }

  const weather = await fetchCurrentWeather(latitude, longitude, timezone);
  if (!weather) return null;

  return { ...weather, resolvedLocation };
}
