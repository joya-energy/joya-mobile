"use client";

import { useCallback, useMemo } from "react";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import {
  filterAlertsForDeviceScope,
  type DeviceScope,
} from "@/lib/device-scope/storage";
import {
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications-inbox";
import { useEfficiencyInboxAlerts } from "@/hooks/use-efficiency-inbox-alerts";
import { isEfficiencyInboxId } from "@/lib/consumption/efficiency-inbox";
import type { NotificationListScope } from "@/types/notifications";

export function useScopedNotifications(scope: NotificationListScope = "active") {
  const deviceScope = useOptionalDeviceScope();
  const selectedScope: DeviceScope = deviceScope?.scope ?? "all";
  const result = useNotifications(scope);
  const { count: globalUnreadCount } = useUnreadNotificationCount();
  const efficiency = useEfficiencyInboxAlerts();

  const notifications = useMemo(() => {
    const apiRows = filterAlertsForDeviceScope(
      result.notifications,
      selectedScope,
    );
    if (scope === "history") return apiRows;
    return [...efficiency.notifications, ...apiRows];
  }, [efficiency.notifications, result.notifications, scope, selectedScope]);

  const unreadCount = useMemo(() => {
    const apiUnread =
      selectedScope === "all"
        ? globalUnreadCount
        : notifications.filter(
            (item) => !item.readAt && !isEfficiencyInboxId(item.id),
          ).length;
    return apiUnread + efficiency.unreadCount;
  }, [
    efficiency.unreadCount,
    globalUnreadCount,
    notifications,
    selectedScope,
  ]);

  const dismiss = useCallback(
    async (id: string) => {
      if (isEfficiencyInboxId(id)) {
        efficiency.dismiss(id);
        return;
      }
      await result.dismiss(id);
    },
    [efficiency, result],
  );

  const dismissAll = useCallback(async () => {
    efficiency.dismissAll();
    if (selectedScope === "all") {
      await result.dismissAll();
      return;
    }
    const scoped = filterAlertsForDeviceScope(
      result.notifications,
      selectedScope,
    );
    await Promise.all(scoped.map((item) => result.dismiss(item.id)));
  }, [efficiency, result, selectedScope]);

  const markRead = useCallback(
    async (id: string) => {
      if (isEfficiencyInboxId(id)) {
        efficiency.markRead(id);
        return;
      }
      await result.markRead(id);
    },
    [efficiency, result],
  );

  return {
    ...result,
    notifications,
    unreadCount,
    dismiss,
    dismissAll,
    markRead,
    scope: selectedScope,
  };
}
