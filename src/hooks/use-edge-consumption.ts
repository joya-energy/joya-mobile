"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import { runScopedFetch } from "@/lib/device-scope/fetch-guards";
import {
  consumptionApi,
  type ClientEdgeDeviceRow,
  type EdgeConsumptionMonitorResponse,
} from "@/lib/consumption/api";

function todayYmdLocal(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Tunis",
  });
}

export type UseEdgeConsumptionOptions = {
  enabled?: boolean;
  historyDate?: string;
  pollIntervalMs?: number;
};

export function useEdgeConsumption(options: UseEdgeConsumptionOptions = {}) {
  const {
    enabled = true,
    historyDate,
    pollIntervalMs = 30_000,
  } = options;

  const deviceScope = useOptionalDeviceScope();
  const siteId = deviceScope?.siteId;
  const scopeReady = deviceScope ? deviceScope.isReady : true;
  const beginScopeLoad = deviceScope?.beginScopeLoad;
  const endScopeLoad = deviceScope?.endScopeLoad;

  const [devices, setDevices] = useState<ClientEdgeDeviceRow[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [monitor, setMonitor] = useState<EdgeConsumptionMonitorResponse | null>(
    null,
  );
  const [devicesLoading, setDevicesLoading] = useState(enabled);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const activeDevice = useMemo(
    () => devices.find((d) => d.device_id === deviceId) ?? null,
    [devices, deviceId],
  );

  const loadDevices = useCallback(async () => {
    if (!enabled || !scopeReady) return;

    setDevicesLoading(true);
    setError(null);
    try {
      const list = await runScopedFetch(
        beginScopeLoad && endScopeLoad
          ? { beginScopeLoad, endScopeLoad }
          : null,
        () => consumptionApi.listDevices({ siteId }),
      );
      setDevices(list);
      setDeviceId((prev) => {
        if (prev && list.some((d) => d.device_id === prev)) return prev;
        return list[0]?.device_id ?? null;
      });
    } catch (err) {
      setDevices([]);
      setDeviceId(null);
      setError(toError(err, "Impossible de charger les compteurs."));
    } finally {
      setDevicesLoading(false);
    }
  }, [beginScopeLoad, enabled, endScopeLoad, scopeReady, siteId]);

  const loadMonitor = useCallback(
    async (targetDeviceId: string, date?: string) => {
      if (!enabled || !scopeReady) return;

      setMonitorLoading(true);
      setError(null);
      try {
        const data = await runScopedFetch(
          beginScopeLoad && endScopeLoad
            ? { beginScopeLoad, endScopeLoad }
            : null,
          () =>
            consumptionApi.getMonitor(targetDeviceId, {
              date: date && date !== todayYmdLocal() ? date : undefined,
            }),
        );
        setMonitor(data);
      } catch (err) {
        setMonitor(null);
        setError(toError(err, "Impossible de charger la consommation."));
      } finally {
        setMonitorLoading(false);
      }
    },
    [beginScopeLoad, enabled, endScopeLoad, scopeReady],
  );

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    if (!deviceId) {
      setMonitor(null);
      return;
    }
    void loadMonitor(deviceId, historyDate);
  }, [deviceId, historyDate, loadMonitor]);

  useEffect(() => {
    if (!enabled || !deviceId || !pollIntervalMs) return;
    if (historyDate && historyDate !== todayYmdLocal()) return;

    const timer = window.setInterval(() => {
      void loadMonitor(deviceId, historyDate);
    }, pollIntervalMs);

    return () => window.clearInterval(timer);
  }, [deviceId, enabled, historyDate, loadMonitor, pollIntervalMs]);

  return {
    devices,
    deviceId,
    setDeviceId,
    activeDevice,
    monitor,
    devicesLoading,
    monitorLoading,
    isLoading: devicesLoading || monitorLoading,
    error,
    reload: () => {
      void loadDevices();
      if (deviceId) void loadMonitor(deviceId, historyDate);
    },
  };
}

function toError(err: unknown, fallback: string): Error {
  if (isAxiosError(err)) {
    const message =
      (err.response?.data as { message?: string })?.message ?? fallback;
    return new Error(message);
  }
  return err instanceof Error ? err : new Error(fallback);
}
