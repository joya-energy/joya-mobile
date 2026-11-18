"use client";

import { ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InboxNotification } from "@/types/notifications";
import { AlertSourceChip } from "@/components/client/dashboard/alert-source-chip";
import { notificationCategory } from "@/lib/notifications/category";

type NotificationInboxItemProps = {
  item: InboxNotification;
  compact?: boolean;
  isRemoving?: boolean;
  onDismiss?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  onOpen?: (item: InboxNotification) => void;
};

export function NotificationInboxItem({
  item,
  compact = false,
  isRemoving = false,
  onDismiss,
  onMarkRead,
  onOpen,
}: NotificationInboxItemProps) {
  const isUnread = !item.readAt;
  const category = notificationCategory(item);
  const Icon = category.icon;

  const handleOpen = () => {
    if (onOpen) {
      onOpen(item);
      return;
    }
    if (isUnread && onMarkRead) {
      void onMarkRead(item.id);
    }
  };

  return (
    <li
      className={cn(
        "overflow-hidden transition-[max-height,opacity,transform] duration-base ease-joya",
        isRemoving
          ? "pointer-events-none max-h-0 -translate-x-3 opacity-0"
          : compact
            ? "max-h-48"
            : "max-h-72",
      )}
    >
      <div
        className={cn(
          "group/notif relative flex items-start gap-3 transition-colors duration-fast",
          compact
            ? "px-4 py-3.5"
            : "rounded-xl border px-4 py-4 shadow-joya-xs sm:px-5",
          !compact && (isUnread ? "border-coral/20 bg-white" : "border-line bg-white/70"),
          isUnread ? "hover:bg-coral-wash" : "hover:bg-cream",
        )}
      >
        {isUnread ? (
          <span
            className={cn(
              "absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-r-full",
              category.accent,
            )}
            aria-hidden
          />
        ) : null}

        <span
          className={cn(
            "grid shrink-0 place-items-center rounded-[12px]",
            compact ? "h-9 w-9" : "h-10 w-10",
            isUnread ? category.tile : "bg-slate-100 text-slate-400",
          )}
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>

        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2",
            onOpen && "cursor-pointer",
          )}
          onClick={handleOpen}
          aria-label={`${isUnread ? "Non lue — " : ""}${item.title}`}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "font-data text-[10.5px] uppercase tracking-[0.08em]",
                isUnread ? "text-coral-dark" : "text-slate-400",
              )}
            >
              {category.label}
            </span>
            <AlertSourceChip label={item.sourceLabel} />
            {isUnread ? (
              <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-label="Non lue" />
            ) : null}
            <span className="ml-auto font-data text-[11px] text-slate-400">{item.timeLabel}</span>
          </div>
          <p
            className={cn(
              "mt-1 text-sm leading-snug",
              isUnread ? "font-semibold text-navy" : "font-medium text-slate-600",
            )}
          >
            {item.title}
          </p>
          <p
            className={cn(
              "mt-0.5 text-[13px] leading-relaxed",
              compact ? "line-clamp-2" : "line-clamp-3",
              isUnread ? "text-ink-muted" : "text-slate-500",
            )}
          >
            {item.message}
          </p>
          {onOpen && !compact ? (
            <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-coral-dark">
              Voir le détail
              <ChevronRight
                className="h-3.5 w-3.5 transition-transform duration-base group-hover/notif:translate-x-0.5"
                aria-hidden
              />
            </span>
          ) : null}
        </button>

        {onDismiss ? (
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            className="shrink-0 rounded-full p-1.5 text-slate-400 opacity-100 transition-[opacity,background-color,color] hover:bg-slate-100 hover:text-navy focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral sm:opacity-0 sm:group-hover/notif:opacity-100"
            aria-label="Masquer la notification"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  );
}
