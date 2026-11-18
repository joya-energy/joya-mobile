"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { NotificationInboxItem } from "@/components/notifications/notification-inbox-item";
import { NotificationDetailModal } from "@/components/notifications/notification-detail-modal";
import { useScopedNotifications } from "@/hooks/use-scoped-notifications";
import type { InboxNotification } from "@/types/notifications";

type NotificationBellProps = {
  inboxHref: string;
};

export function NotificationBell({ inboxHref }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InboxNotification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount: count,
    removingIds,
    dismiss,
    dismissAll,
    markRead,
    reload,
  } = useScopedNotifications("active");

  const preview = notifications.slice(0, 5);
  const unreadInPreview = preview.filter((item) => !item.readAt).length;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleOpen = () => {
    setOpen((value) => !value);
    void reload({ background: true });
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((item) => !item.readAt);
    await Promise.all(unread.map((item) => markRead(item.id)));
  };

  const handleOpenDetail = (item: InboxNotification) => {
    setDetailItem(item);
    setOpen(false);
    if (!item.readAt) {
      void markRead(item.id);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-navy shadow-joya-xs transition-[border-color,box-shadow] duration-base hover:border-line-strong hover:shadow-joya-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral aria-expanded:border-coral/40"
        aria-label={count > 0 ? `Notifications, ${count} non lue${count > 1 ? "s" : ""}` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} aria-hidden />
        {count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1 font-data text-[10px] font-medium text-white ring-2 ring-cream">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications récentes"
          className="fixed inset-x-3 top-[calc(var(--joya-header-height)+0.5rem)] z-overlay overflow-hidden rounded-2xl border border-line bg-white shadow-joya-lg animate-fade-in-up sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[24rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <p className="font-display text-[15px] font-semibold text-navy">Notifications</p>
              {unreadInPreview > 0 ? (
                <p className="text-[12px] text-coral-dark">
                  {unreadInPreview} non lue{unreadInPreview > 1 ? "s" : ""}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy"
                title="Tout marquer comme lu"
                aria-label="Tout marquer comme lu"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => void dismissAll().then(() => setOpen(false))}
                className="h-8 rounded-pill px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-navy"
              >
                Tout effacer
              </button>
            </div>
          </div>

          {preview.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-coral-soft text-coral" aria-hidden>
                <Bell className="h-5 w-5" />
              </span>
              <p className="text-sm font-semibold text-navy">Tout est à jour</p>
              <p className="text-[13px] text-ink-muted">Aucune notification active.</p>
            </div>
          ) : (
            <ul className="max-h-[min(60vh,24rem)] divide-y divide-line overflow-y-auto">
              {preview.map((item) => (
                <NotificationInboxItem
                  key={item.id}
                  item={item}
                  compact
                  isRemoving={removingIds.has(item.id)}
                  onDismiss={(id) => void dismiss(id)}
                  onMarkRead={(id) => void markRead(id)}
                  onOpen={handleOpenDetail}
                />
              ))}
            </ul>
          )}

          <div className="border-t border-line bg-cream/60 px-4 py-3">
            <Link
              href={inboxHref}
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-1 text-sm font-semibold text-coral-dark underline-offset-4 hover:underline"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      ) : null}

      <NotificationDetailModal
        item={detailItem}
        open={detailItem !== null}
        onClose={() => setDetailItem(null)}
        onDismiss={(id) => void dismiss(id)}
      />
    </div>
  );
}
