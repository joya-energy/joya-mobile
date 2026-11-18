"use client";

import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import { runScopedFetch } from "@/lib/device-scope/fetch-guards";
import {
  clientDashboardApi,
  type FetchMonthlyDailyProductionParams,
} from "@/lib/dashboard/api";
import type { MonthlyDailyProductionChartData } from "@/types/dashboard";

function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export type UseMonthlyDailyProductionOptions = FetchMonthlyDailyProductionParams & {
  enabled?: boolean;
};

export function useMonthlyDailyProduction(
  options: UseMonthlyDailyProductionOptions = {},
) {
  const { companyId, enabled = true, assetId: assetIdProp } = options;
  const deviceScope = useOptionalDeviceScope();
  const beginScopeLoad = deviceScope?.beginScopeLoad;
  const endScopeLoad = deviceScope?.endScopeLoad;
  const assetId = assetIdProp ?? deviceScope?.assetId;
  const siteId = deviceScope?.siteId;
  const scopeReady = deviceScope ? deviceScope.isReady : true;
  const initial = currentYearMonth();

  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [data, setData] = useState<MonthlyDailyProductionChartData | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(
    async (year: number, month: number, silent = false) => {
      if (!enabled || !scopeReady) return;

      setError(null);
      if (!silent) setIsLoading(true);

      try {
        const result = await runScopedFetch(
          beginScopeLoad && endScopeLoad
            ? { beginScopeLoad, endScopeLoad }
            : null,
          () =>
            clientDashboardApi.fetchMonthlyDailyProduction({
              companyId,
              year,
              month,
              siteId,
              assetId,
            }),
        );
        setData(result);
        setSelectedYear(result.year);
        setSelectedMonth(result.month);
      } catch (err) {
        const message = isAxiosError(err)
          ? ((err.response?.data as { message?: string })?.message ??
            "Échec du chargement de la production mensuelle")
          : err instanceof Error
            ? err.message
            : "Échec du chargement de la production mensuelle";
        setError(new Error(message));
      } finally {
        setIsLoading(false);
      }
    },
    [assetId, beginScopeLoad, companyId, enabled, endScopeLoad, scopeReady, siteId],
  );

  useEffect(() => {
    if (!enabled || !scopeReady) return;
    void load(selectedYear, selectedMonth);
    const timer = setInterval(() => {
      const now = currentYearMonth();
      if (selectedYear === now.year && selectedMonth === now.month) {
        void load(selectedYear, selectedMonth, true);
      }
    }, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [enabled, load, scopeReady, selectedMonth, selectedYear]);

  const onMonthChange = useCallback((year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  }, []);

  return {
    data,
    selectedYear,
    selectedMonth,
    onMonthChange,
    isLoading,
    error,
    reload: () => load(selectedYear, selectedMonth),
  };
}
