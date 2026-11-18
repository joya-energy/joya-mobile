"use client";

import { useCallback, useEffect, useState } from "react";
import {
  notificationsApi,
  NOTIFICATIONS_UPDATED_EVENT,
  notifyNotificationsUpdated,
  type NotificationsUpdatedDetail,
} from "@/lib/notifications/api";
import type {
  InboxNotification,
  NotificationListScope,
} from "@/types/notifications";

function publishUnreadCount(unreadCount: number) {
  notifyNotificationsUpdated({ unreadCount });
}

export function useNotifications(scope: NotificationListScope = "active") {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const reload = useCallback(
    async (options?: { background?: boolean }) => {
      const background = options?.background ?? false;
      if (!background) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const { notifications: rows } = await notificationsApi.list({
          scope,
          limit: 50,
        });
        setNotifications(rows);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Échec du chargement"));
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [scope],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<NotificationsUpdatedDetail>).detail;
      if (
        Array.isArray(detail?.refreshScopes) &&
        detail.refreshScopes.includes("notifications")
      ) {
        void reload({ background: true });
      }
    };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
  }, [reload]);

  const dismiss = useCallback(
    async (id: string) => {
      setRemovingIds((prev) => new Set(prev).add(id));
      await new Promise((resolve) => setTimeout(resolve, 220));

      try {
        const { unreadCount } = await notificationsApi.dismiss(id);
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        publishUnreadCount(unreadCount);
      } catch {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        throw new Error("Impossible de masquer la notification");
      } finally {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [],
  );

  const dismissAll = useCallback(async () => {
    try {
      const { unreadCount } = await notificationsApi.dismissAll();
      setNotifications([]);
      publishUnreadCount(unreadCount);
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Impossible de masquer les notifications");
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      const { unreadCount } = await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
      );
      publishUnreadCount(unreadCount);
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Impossible de marquer la notification comme lue");
    }
  }, []);

  return {
    notifications,
    isLoading,
    error,
    removingIds,
    reload,
    dismiss,
    dismissAll,
    markRead,
  };
}

export function useUnreadNotificationCount() {
  const [count, setCount] = useState(0);

  const reload = useCallback(async () => {
    try {
      const next = await notificationsApi.unreadCount();
      setCount(next);
    } catch {
      // Keep previous count on fetch failure
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<NotificationsUpdatedDetail>).detail;
      if (typeof detail?.unreadCount === "number") {
        setCount(detail.unreadCount);
        return;
      }
      void reload();
    };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, onUpdate);
  }, [reload]);

  return { count, reload };
}
