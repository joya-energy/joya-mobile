import { notify, type NotificationType } from "@/lib/notifications";
import {
  notifyNotificationsUpdated,
  type NotificationsUpdatedDetail,
} from "@/lib/notifications/api";
import {
  dispatchAppRefresh,
  type AppRefreshScope,
} from "@/lib/realtime/app-refresh";

type SocketPayload = Record<string, unknown> | null | undefined;

const FILE_STATUS_TITLES: Record<string, string> = {
  uploaded: "Fichier téléversé",
  failed: "Échec du téléversement",
  expired: "Téléversement expiré",
};

const FILE_STATUS_MESSAGES: Record<string, string> = {
  uploaded: "Votre fichier a été enregistré avec succès.",
  failed: "Le téléversement a échoué. Veuillez réessayer.",
  expired: "Le délai de téléversement a expiré. Veuillez relancer l'envoi.",
};

function resolveNotificationType(payload: SocketPayload): NotificationType {
  const payloadType = payload?.type;
  if (
    payloadType === "success" ||
    payloadType === "error" ||
    payloadType === "warning" ||
    payloadType === "info" ||
    payloadType === "hidden"
  ) {
    return payloadType;
  }
  return "info";
}

function resolveNestedData(payload: SocketPayload): Record<string, unknown> | null {
  const data = payload?.data;
  if (data && typeof data === "object") {
    return data as Record<string, unknown>;
  }
  return null;
}

function parseRefreshScopes(
  nestedData: Record<string, unknown> | null,
): AppRefreshScope[] {
  const raw = nestedData?.refreshScopes;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (scope): scope is AppRefreshScope =>
      scope === "notifications" ||
      scope === "follow_up" ||
      scope === "dashboard" ||
      scope === "journey" ||
      scope === "onboarding" ||
      scope === "all",
  );
}

function resolveMessage(
  eventName: string,
  payload: SocketPayload,
  nestedData: Record<string, unknown> | null,
): string {
  if (typeof nestedData?.message === "string" && nestedData.message.length > 0) {
    return nestedData.message;
  }

  if (typeof payload?.message === "string" && payload.message.length > 0) {
    return payload.message;
  }

  if (eventName === "file.status.changed") {
    const statusMatch = nestedData?.status;
    if (typeof statusMatch === "string" && FILE_STATUS_MESSAGES[statusMatch]) {
      return FILE_STATUS_MESSAGES[statusMatch];
    }

    const rawMessage = nestedData?.message ?? payload?.message;
    if (typeof rawMessage === "string") {
      for (const [status, message] of Object.entries(FILE_STATUS_MESSAGES)) {
        if (rawMessage.includes(status)) {
          return message;
        }
      }
    }
  }

  return "Une mise à jour a été reçue.";
}

function resolveTitle(
  eventName: string,
  type: NotificationType,
  nestedData: Record<string, unknown> | null,
): string {
  if (eventName === "notification.created") {
    const title = nestedData?.title;
    if (typeof title === "string" && title.length > 0) {
      return title;
    }
  }

  if (eventName === "file.status.changed") {
    const status = nestedData?.status;
    if (typeof status === "string" && FILE_STATUS_TITLES[status]) {
      return FILE_STATUS_TITLES[status];
    }
  }

  switch (type) {
    case "success":
      return "Succès";
    case "error":
      return "Erreur";
    case "warning":
      return "Attention";
    default:
      return "Notification";
  }
}

export function handleSocketNotification(
  eventName: string,
  payload: SocketPayload,
): void {
  const type = resolveNotificationType(payload);
  if (type === "hidden") {
    return;
  }

  const nestedData = resolveNestedData(payload);
  const message = resolveMessage(eventName, payload, nestedData);
  const title = resolveTitle(eventName, type, nestedData);

  if (eventName === "notification.created") {
    const unreadCount =
      typeof nestedData?.unreadCount === "number"
        ? nestedData.unreadCount
        : undefined;
    const notificationType =
      typeof nestedData?.type === "string" ? nestedData.type : undefined;
    const refreshScopes = parseRefreshScopes(nestedData);

    const detail: NotificationsUpdatedDetail = {
      unreadCount,
      notificationType,
      refreshScopes,
    };
    notifyNotificationsUpdated(detail);

    if (refreshScopes.length > 0) {
      dispatchAppRefresh(refreshScopes, { notificationType });
    }
  }

  notify(type, { title, message });
}

export function subscribeToSocketNotifications(
  onAnySocketEvent: (
    listener: (eventName: string, payload: SocketPayload) => void,
  ) => () => void,
): () => void {
  return onAnySocketEvent((eventName, payload) => {
    handleSocketNotification(eventName, payload);
  });
}
