"use client";

import { useCallback, useMemo, useState } from "react";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import { useEdgeConsumption } from "@/hooks/use-edge-consumption";
import { hourlyEnergyRows } from "@/lib/consumption/hourly-energy";
import {
  analyzeEnergyEfficiency,
  loadEfficiencyProfile,
} from "@/lib/consumption/energy-efficiency";
import {
  dismissAllEfficiencyInbox,
  dismissEfficiencyInbox,
  efficiencyAlertToInbox,
  isEfficiencyInboxDismissed,
  markAllEfficiencyInboxRead,
  markEfficiencyInboxRead,
} from "@/lib/consumption/efficiency-inbox";
import type { InboxNotification } from "@/types/notifications";

function todayYmd(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function useEfficiencyInboxAlerts() {
  const deviceScope = useOptionalDeviceScope();
  const siteId = deviceScope?.siteId ?? null;
  const { devices, monitor } = useEdgeConsumption({
    pollIntervalMs: 60_000,
  });
  const [, setTick] = useState(0);

  const ymd = monitor?.history.date || todayYmd();

  const notifications = useMemo(() => {
    const profile = loadEfficiencyProfile(siteId, ymd);
    const snapshot = analyzeEnergyEfficiency({
      profile,
      hourly: hourlyEnergyRows(monitor?.history.hourly) ?? [],
      seriesPoints: monitor?.today.points?.length
        ? monitor.today.points
        : monitor?.history.quarter_hour ?? [],
      latest: monitor?.latest ?? null,
      lastTelemetryAt: monitor?.device.last_telemetry_at,
      isToday: ymd === todayYmd(),
      selectedDate: ymd,
      hasMeter: devices.length > 0,
    });

    return snapshot.alerts
      .map((alert) =>
        efficiencyAlertToInbox({
          alert,
          siteId,
          ymd,
        }),
      )
      .filter((item) => !isEfficiencyInboxDismissed(item.id));
  }, [devices.length, monitor, siteId, ymd]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  const dismiss = useCallback(
    (id: string) => {
      dismissEfficiencyInbox(id);
      refresh();
    },
    [refresh],
  );

  const dismissAll = useCallback(() => {
    dismissAllEfficiencyInbox(notifications.map((item) => item.id));
    refresh();
  }, [notifications, refresh]);

  const markRead = useCallback(
    (id: string) => {
      markEfficiencyInboxRead(id);
      refresh();
    },
    [refresh],
  );

  const markAllRead = useCallback(() => {
    markAllEfficiencyInboxRead(notifications.map((item) => item.id));
    refresh();
  }, [notifications, refresh]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
    dismiss,
    dismissAll,
    markRead,
    markAllRead,
  };
}

export type EfficiencyInboxItem = InboxNotification;
