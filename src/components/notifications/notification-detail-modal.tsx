"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notificationCategory } from "@/lib/notifications/category";
import { cn } from "@/lib/utils";
import { customerNotificationHref } from "@/lib/notifications/href";
import type { InboxNotification } from "@/types/notifications";

type NotificationDetailModalProps = {
  item: InboxNotification | null;
  open: boolean;
  onClose: () => void;
  onDismiss?: (id: string) => void;
};


export function NotificationDetailModal({
  item,
  open,
  onClose,
  onDismiss,
}: NotificationDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted || !open || !item) return null;

  const isUnread = !item.readAt;
  const actionHref = customerNotificationHref(item);

  const category = notificationCategory(item);
  const Icon = category.icon;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-navy-deep/45 backdrop-blur-[2px] animate-fade-in"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="notification-detail-title"
        className="relative z-10 flex max-h-[min(90vh,34rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-line bg-white shadow-joya-lg animate-fade-in-up sm:rounded-2xl"
      >
        <div className="flex items-start gap-4 border-b border-line px-5 py-5 sm:px-6">
          <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-[14px]", category.tile)} aria-hidden>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="font-data text-[11px] uppercase tracking-[0.08em] text-coral-dark">
                {category.label}
              </span>
              {isUnread ? (
                <Badge tone="coral" size="sm">
                  Nouveau
                </Badge>
              ) : null}
            </div>
            <h2
              id="notification-detail-title"
              className="font-display text-lg font-semibold leading-snug tracking-tight text-navy"
            >
              {item.title}
            </h2>
            <p className="mt-1 font-data text-[11.5px] text-ink-faint">{item.timeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-navy/80">
            {item.message}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line bg-cream/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {onDismiss ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onDismiss(item.id);
                onClose();
              }}
            >
              Masquer
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fermer
          </Button>
          {actionHref ? (
            <Button asChild size="sm">
              <Link href={actionHref} onClick={onClose}>
                Ouvrir
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
