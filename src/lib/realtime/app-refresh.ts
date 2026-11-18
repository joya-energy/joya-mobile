import { appEvents } from "@/platform/events";

export type AppRefreshScope =
  | "notifications"
  | "follow_up"
  | "dashboard"
  | "journey"
  | "onboarding"
  | "all";

export const APP_REFRESH_EVENT = "app:refresh";

export type AppRefreshDetail = {
  scopes: AppRefreshScope[];
  notificationType?: string;
};

export function dispatchAppRefresh(
  scopes: AppRefreshScope[],
  meta?: { notificationType?: string },
): void {
  appEvents.emit(APP_REFRESH_EVENT, {
    scopes,
    notificationType: meta?.notificationType,
  } satisfies AppRefreshDetail);
}

export function subscribeAppRefresh(
  scope: AppRefreshScope,
  handler: (detail: AppRefreshDetail) => void,
): () => void {
  return appEvents.on(APP_REFRESH_EVENT, (detail) => {
    const payload = detail as AppRefreshDetail | undefined;
    if (!payload?.scopes?.length) return;
    if (payload.scopes.includes("all") || payload.scopes.includes(scope)) {
      handler(payload);
    }
  });
}
