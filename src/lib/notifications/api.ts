import apiClient from "@/lib/api";
import type {
  NotificationListScope,
  NotificationsApiResponse,
  UnreadCountApiResponse,
} from "@/types/notifications";

import type { AppRefreshScope } from "@/lib/realtime/app-refresh";

export type NotificationsUpdatedDetail = {
  unreadCount?: number;
  notificationType?: string;
  refreshScopes?: AppRefreshScope[];
};

export const notificationsApi = {
  async list(params?: {
    scope?: NotificationListScope;
    limit?: number;
  }): Promise<NotificationsApiResponse> {
    const response = await apiClient.get<NotificationsApiResponse>(
      "/notifications",
      { params },
    );
    return response.data;
  },

  async unreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountApiResponse>(
      "/notifications/unread-count",
    );
    return response.data.count;
  },

  async markRead(id: string): Promise<{ unreadCount: number }> {
    const response = await apiClient.patch<{ unreadCount: number }>(
      `/notifications/${id}/read`,
    );
    return response.data;
  },

  async dismiss(id: string): Promise<{ unreadCount: number }> {
    const response = await apiClient.post<{ unreadCount: number }>(
      `/notifications/${id}/dismiss`,
    );
    return response.data;
  },

  async dismissAll(): Promise<{ unreadCount: number }> {
    const response = await apiClient.post<{ unreadCount: number }>(
      "/notifications/dismiss-all",
    );
    return response.data;
  },
};

export const NOTIFICATIONS_UPDATED_EVENT = "notifications:updated";

export function notifyNotificationsUpdated(
  detail?: NotificationsUpdatedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<NotificationsUpdatedDetail>(NOTIFICATIONS_UPDATED_EVENT, {
      detail,
    }),
  );
}
