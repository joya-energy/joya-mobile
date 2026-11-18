"use client";

import { useEffect, useState } from "react";
import {
  fetchCurrentWeather,
  type CurrentWeather,
} from "@/lib/weather/open-meteo";

export function useWeather(query: string | null | undefined) {
  const [data, setData] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetchCurrentWeather(query)
      .then((res) => {
        if (cancelled) return;
        if (res) setData(res);
        else setError(true);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  return { data, loading, error };
}
