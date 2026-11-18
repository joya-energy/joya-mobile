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
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AppRefreshDetail>(APP_REFRESH_EVENT, {
      detail: { scopes, notificationType: meta?.notificationType },
    }),
  );
}

export function subscribeAppRefresh(
  scope: AppRefreshScope,
  handler: (detail: AppRefreshDetail) => void,
): () => void {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<AppRefreshDetail>).detail;
    if (!detail?.scopes?.length) return;
    if (detail.scopes.includes("all") || detail.scopes.includes(scope)) {
      handler(detail);
    }
  };
  window.addEventListener(APP_REFRESH_EVENT, listener);
  return () => window.removeEventListener(APP_REFRESH_EVENT, listener);
}
