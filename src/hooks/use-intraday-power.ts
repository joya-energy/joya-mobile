"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import { runScopedFetch } from "@/lib/device-scope/fetch-guards";
import {
  clientDashboardApi,
  type FetchIntradayPowerParams,
} from "@/lib/dashboard/api";
import type { IntradayPowerChartData } from "@/types/dashboard";

function todayYmdLocal(): string {
  return new Date().toLocaleDateString("en-CA");
}

export type UseIntradayPowerOptions = FetchIntradayPowerParams & {
  enabled?: boolean;
  /** When true, always loads site totals (ignores selected inverter). */
  siteScopeOnly?: boolean;
};

export function useIntradayPower(options: UseIntradayPowerOptions = {}) {
  const {
    companyId,
    enabled = true,
    assetId: assetIdProp,
    siteScopeOnly = false,
  } = options;
  const deviceScope = useOptionalDeviceScope();
  const beginScopeLoad = deviceScope?.beginScopeLoad;
  const endScopeLoad = deviceScope?.endScopeLoad;
  const assetId = siteScopeOnly
    ? undefined
    : assetIdProp ?? deviceScope?.assetId;
  const siteId = deviceScope?.siteId;
  const scopeReady = deviceScope ? deviceScope.isReady : true;

  const [selectedDate, setSelectedDate] = useState(todayYmdLocal());
  const [data, setData] = useState<IntradayPowerChartData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (date: string, silent = false) => {
      if (!enabled || !scopeReady) return;

      setError(null);
      if (!silent) setIsLoading(true);

      try {
        const result = await runScopedFetch(
          beginScopeLoad && endScopeLoad
            ? { beginScopeLoad, endScopeLoad }
            : null,
          () =>
            clientDashboardApi.fetchIntradayPower({
              companyId,
              date,
              siteId,
              assetId,
            }),
        );
        setData(result);
        setSelectedDate(result.date);
      } catch (err) {
        const message = isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ??
            "Échec du chargement de la courbe")
          : err instanceof Error
            ? err.message
            : "Échec du chargement de la courbe";
        setError(new Error(message));
      } finally {
        setIsLoading(false);
      }
    },
    [assetId, beginScopeLoad, companyId, enabled, endScopeLoad, scopeReady, siteId],
  );

  useEffect(() => {
    if (!enabled || !scopeReady) return;
    void load(selectedDate);
    const timer = setInterval(() => {
      if (selectedDate === todayYmdLocal()) {
        void load(selectedDate, true);
      }
    }, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [enabled, load, scopeReady, selectedDate]);

  const onDateChange = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  return {
    data,
    selectedDate,
    onDateChange,
    isLoading,
    error,
    reload: () => load(selectedDate),
  };
}
