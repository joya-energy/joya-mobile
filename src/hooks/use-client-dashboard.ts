"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import {
  runScopedFetch,
} from "@/lib/device-scope/fetch-guards";
import { clientDashboardApi, type FetchClientDashboardParams } from "@/lib/dashboard/api";
import { subscribeAppRefresh } from "@/lib/realtime/app-refresh";
import type { ClientDashboardData, DashboardEnodeSync } from "@/types/dashboard";

export type UseClientDashboardOptions = FetchClientDashboardParams & {
  /** Skip network; use this data (e.g. Storybook or tests). */
  initialData?: ClientDashboardData;
  /** When false, does not fetch on mount. Default true. */
  enabled?: boolean;
  /** When true, always loads site totals (ignores selected inverter). */
  siteScopeOnly?: boolean;
};

export type UseClientDashboardResult = {
  data: ClientDashboardData | null;
  isLoading: boolean;
  /** True during a manual refresh while existing data stays visible. */
  isRefreshing: boolean;
  enodeSync: DashboardEnodeSync;
  error: Error | null;
  /** GET — lecture base uniquement. */
  reload: () => Promise<void>;
  /** POST — sync Enode (365 j) puis mise à jour. */
  refetch: () => Promise<void>;
};

const DEFAULT_ENODE_SYNC: DashboardEnodeSync = {
  canRefresh: true,
  nextEnodeRefreshAt: null,
  cooldownSecondsRemaining: 0,
};

function parseApiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  if (err instanceof Error) return err.message;
  return "Échec du chargement";
}

export function useClientDashboard(
  options: UseClientDashboardOptions = {},
): UseClientDashboardResult {
  const {
    companyId,
    initialData,
    enabled = true,
    assetId: assetIdProp,
    siteId: siteIdProp,
    siteScopeOnly = false,
  } = options;
  const deviceScope = useOptionalDeviceScope();
  const beginScopeLoad = deviceScope?.beginScopeLoad;
  const endScopeLoad = deviceScope?.endScopeLoad;
  const assetId = siteScopeOnly
    ? undefined
    : assetIdProp ?? deviceScope?.assetId;
  const siteId = siteIdProp ?? deviceScope?.siteId;
  const scopeReady = deviceScope ? deviceScope.isReady : true;

  const [data, setData] = useState<ClientDashboardData | null>(
    initialData ?? null,
  );
  const dataRef = useRef(data);
  dataRef.current = data;
  const [enodeSync, setEnodeSync] = useState<DashboardEnodeSync>(
    initialData?.enodeSync ?? DEFAULT_ENODE_SYNC,
  );
  const [isLoading, setIsLoading] = useState(enabled && !initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refreshInFlight = useRef(false);

  const applyPayload = useCallback((payload: ClientDashboardData) => {
    setData(payload);
    setEnodeSync(payload.enodeSync);
  }, []);

  const reload = useCallback(async () => {
    if (!enabled || !scopeReady) return;

    setError(null);
    const hasExistingData = dataRef.current !== null;
    if (hasExistingData) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const result = await runScopedFetch(
        beginScopeLoad && endScopeLoad
          ? { beginScopeLoad, endScopeLoad }
          : null,
        () => clientDashboardApi.fetch({ companyId, siteId, assetId }),
      );
      applyPayload(result);
    } catch (err) {
      const message = parseApiErrorMessage(err);
      setError(new Error(message));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [applyPayload, assetId, beginScopeLoad, companyId, enabled, endScopeLoad, scopeReady, siteId]);

  const refetch = useCallback(async () => {
    if (!enabled || refreshInFlight.current) return;

    refreshInFlight.current = true;
    setError(null);
    setIsRefreshing(true);

    try {
      const { data: payload, enodeRefresh, nextEnodeRefreshAt } =
        await clientDashboardApi.refresh({ companyId, siteId, assetId });
      applyPayload(payload);

      if (nextEnodeRefreshAt) {
        setEnodeSync((prev) => ({
          ...prev,
          canRefresh: false,
          nextEnodeRefreshAt,
          cooldownSecondsRemaining: Math.max(
            0,
            Math.ceil((new Date(nextEnodeRefreshAt).getTime() - Date.now()) / 1000),
          ),
        }));
      }

      const bucketCount = enodeRefresh?.bucketsUpserted ?? 0;
      const enodeErrors = enodeRefresh?.errors?.length ?? 0;
      if (enodeErrors > 0) {
        toast.warning("Synchronisation partielle", {
          description: `${bucketCount} créneau(x) mis à jour · ${enodeErrors} avertissement(s)`,
        });
      } else if (bucketCount > 0) {
        toast.success("Données solaires synchronisées");
      } else {
        toast.success("Tableau de bord actualisé");
      }
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 429) {
        const body = err.response.data as {
          message?: string;
          errors?: Array<{ next_enode_refresh_at?: string }>;
        };
        const nextAt = body.errors?.[0]?.next_enode_refresh_at;
        const message =
          body.message ?? "Synchronisation Enode temporairement indisponible";

        if (nextAt) {
          setEnodeSync({
            canRefresh: false,
            nextEnodeRefreshAt: nextAt,
            cooldownSecondsRemaining: Math.max(
              0,
              Math.ceil((new Date(nextAt).getTime() - Date.now()) / 1000),
            ),
          });
        }
        toast.error(message);
        return;
      }

      const message = parseApiErrorMessage(err);
      setError(new Error(message));
      toast.error(message);
    } finally {
      refreshInFlight.current = false;
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [applyPayload, assetId, companyId, enabled, siteId]);

  useEffect(() => {
    if (initialData) {
      applyPayload(initialData);
      setIsLoading(false);
      return;
    }
    if (enabled && scopeReady) {
      void reload();
    }
  }, [enabled, initialData, applyPayload, reload, scopeReady]);

  useEffect(() => {
    if (!enabled) return;
    return subscribeAppRefresh("dashboard", () => {
      void reload();
    });
  }, [enabled, reload]);

  return {
    data,
    isLoading,
    isRefreshing,
    enodeSync,
    error,
    reload,
    refetch,
  };
}
