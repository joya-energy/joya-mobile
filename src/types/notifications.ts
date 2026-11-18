export type InboxNotificationSeverity = "error" | "warning" | "info";

export type InboxNotification = {
  id: string;
  type: string;
  severity: InboxNotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  companyId?: string;
  persistence: "important" | "ephemeral";
  showOnDashboard: boolean;
  readAt?: string | null;
  dismissedAt?: string | null;
  createdAt: string;
  timeLabel: string;
  sourceLabel?: string;
  sourceType?: "asset" | "company" | "system";
  assetId?: string;
};

export type NotificationListScope = "active" | "history";

export type NotificationsApiResponse = {
  notifications: InboxNotification[];
};

export type UnreadCountApiResponse = {
  count: number;
};
