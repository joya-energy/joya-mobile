"use client";

import { useEffect } from "react";
import { Bell, X } from "lucide-react";
import type { DashboardAlert } from "@/types/dashboard";
import { DASHBOARD_ALERTS_CARD_BG, DASHBOARD_CHART_COLOR } from "./constants";
import { DashboardAlertsList } from "./dashboard-alerts-list";

type DashboardAlertsModalProps = {
  open: boolean;
  onClose: () => void;
  alerts: DashboardAlert[];
  titleId?: string;
};

export function DashboardAlertsModal({
  open,
  onClose,
  alerts,
  titleId = "dashboard-alerts-dialog-title",
}: DashboardAlertsModalProps) {
  const count = alerts.length;

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", onEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const squareSide = "min(88vmin, 40rem, min(92vw, 92vh))";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy-deep/50 backdrop-blur-[2px] animate-fade-in"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[96vh] max-w-[96vw] flex-col overflow-hidden rounded-2xl border border-white/10 text-white shadow-joya-lg animate-fade-in-up"
        style={{
          backgroundColor: DASHBOARD_ALERTS_CARD_BG,
          width: squareSide,
          height: squareSide,
        }}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-white/15 px-5 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-coral/20 text-coral" aria-hidden>
            <Bell className="h-5 w-5" />
          </span>
          <h2 id={titleId} className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Alertes
          </h2>
          {count > 0 ? (
            <span
              className="flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-white sm:text-sm"
              style={{ backgroundColor: DASHBOARD_CHART_COLOR }}
            >
              {count}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            aria-label="Fermer la fenêtre"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
          <DashboardAlertsList alerts={alerts} variant="modal" />
        </div>
      </div>
    </div>
  );
}
