/**
 * Lightweight weather helper backed by the free, key-less Open-Meteo APIs.
 * Geocodes a place name, then resolves the current conditions for it.
 */

export type CurrentWeather = {
  temperature: number;
  apparentTemperature: number | null;
  weatherCode: number;
  windSpeed: number;
  humidity: number | null;
  isDay: boolean;
  locationLabel: string;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
  name: string;
  admin1?: string;
  country?: string;
};

const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export async function geocodePlace(
  query: string,
): Promise<GeocodeResult | null> {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(
    query,
  )}&count=1&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as { results?: GeocodeResult[] };
  return data.results?.[0] ?? null;
}

export async function fetchCurrentWeather(
  query: string,
): Promise<CurrentWeather | null> {
  const place = await geocodePlace(query);
  if (!place) return null;

  const url =
    `${FORECAST_URL}?latitude=${place.latitude}&longitude=${place.longitude}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m` +
    `&timezone=auto`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as {
    current?: {
      temperature_2m: number;
      apparent_temperature: number;
      relative_humidity_2m: number;
      weather_code: number;
      wind_speed_10m: number;
      is_day: number;
    };
  };

  if (!data.current) return null;

  return {
    temperature: Math.round(data.current.temperature_2m),
    apparentTemperature: Math.round(data.current.apparent_temperature),
    weatherCode: data.current.weather_code,
    windSpeed: Math.round(data.current.wind_speed_10m),
    humidity: data.current.relative_humidity_2m,
    isDay: data.current.is_day === 1,
    locationLabel: [place.name, place.admin1].filter(Boolean).join(", "),
  };
}

/** Map a WMO weather code to a French label. */
export function weatherCodeLabel(code: number): string {
  if (code === 0) return "Ciel dégagé";
  if (code <= 2) return "Partiellement nuageux";
  if (code === 3) return "Couvert";
  if (code === 45 || code === 48) return "Brouillard";
  if (code >= 51 && code <= 57) return "Bruine";
  if (code >= 61 && code <= 67) return "Pluie";
  if (code >= 71 && code <= 77) return "Neige";
  if (code >= 80 && code <= 82) return "Averses";
  if (code >= 85 && code <= 86) return "Averses de neige";
  if (code >= 95) return "Orage";
  return "Conditions variables";
}

export type WeatherKind =
  | "clear"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

/** Reduce a WMO code to a small set used for icon selection. */
export function weatherCodeKind(code: number): WeatherKind {
  if (code === 0 || code <= 2) return "clear";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95) return "storm";
  return "cloudy";
}
