"use client";

import { useEffect, useState } from "react";
import { buildBannerWeatherAttempts } from "@/lib/dashboard/banner-weather-location";
import { fetchBannerWeatherWithFallbacks } from "@/lib/dashboard/weather";
import type { ClientDashboardSite } from "@/types/dashboard";

export type BannerWeatherSnapshot = {
  temperatureCelsius: number;
  humidityPercent: number;
  windSpeedKmh?: number;
  irradiationWm2?: number;
};

export function useBannerWeather(
  site: ClientDashboardSite,
  onboardingLocationQuery?: string | null,
) {
  const [data, setData] = useState<BannerWeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const attempts = buildBannerWeatherAttempts(site, onboardingLocationQuery);

    let cancelled = false;
    setLoading(true);

    void fetchBannerWeatherWithFallbacks(attempts)
      .then((weather) => {
        if (cancelled) return;
        if (!weather) {
          setData(null);
          return;
        }
        setData({
          temperatureCelsius: weather.temperatureCelsius,
          humidityPercent: weather.humidityPercent,
          windSpeedKmh: weather.windSpeedKmh,
          irradiationWm2: weather.irradiationWm2,
        });
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [site, onboardingLocationQuery]);

  return { data, loading };
}
