import { AlertTriangle, Info, XCircle } from "lucide-react";
import type { DashboardAlert, DashboardAlertSeverity } from "@/types/dashboard";
import { AlertSourceChip } from "./alert-source-chip";

const severityStyles: Record<
  DashboardAlertSeverity,
  { border: string; bg: string; icon: typeof Info }
> = {
  info: {
    border: "border-slate-200",
    bg: "bg-slate-50",
    icon: Info,
  },
  warning: {
    border: "border-warning/20",
    bg: "bg-warning-soft",
    icon: AlertTriangle,
  },
  error: {
    border: "border-danger/20",
    bg: "bg-danger-soft",
    icon: XCircle,
  },
};

const severityIconColor: Record<DashboardAlertSeverity, string> = {
  info: "text-blue",
  warning: "text-warning",
  error: "text-danger",
};

const modalSeverityAccent: Record<DashboardAlertSeverity, string> = {
  info: "border-l-blue-light",
  warning: "border-l-warning/40",
  error: "border-l-danger/40",
};

/** French label shown in the alerts modal (matches product copy). */
const modalSeverityLabelFr: Record<DashboardAlertSeverity, string> = {
  error: "Critique",
  warning: "Attention",
  info: "Information",
};

const modalSeverityIconClass: Record<DashboardAlertSeverity, string> = {
  error: "text-danger-soft",
  warning: "text-warning-soft",
  info: "text-blue-light",
};

const modalSeverityPillClass: Record<DashboardAlertSeverity, string> = {
  error:
    "border border-danger/35 bg-danger-strong/45 px-2.5 py-0.5 text-xs font-semibold text-danger-soft sm:text-[0.8125rem]",
  warning:
    "border border-warning/35 bg-warning-strong/40 px-2.5 py-0.5 text-xs font-semibold text-warning-soft sm:text-[0.8125rem]",
  info:
    "border border-blue-light/35 bg-navy-deep/40 px-2.5 py-0.5 text-xs font-semibold text-blue-tint sm:text-[0.8125rem]",
};

function AlertItem({
  alert,
  variant = "default",
}: {
  alert: DashboardAlert;
  variant?: "default" | "modal";
}) {
  if (variant === "modal") {
    const style = severityStyles[alert.severity];
    const Icon = style.icon;
    const typeLabel = modalSeverityLabelFr[alert.severity];

    return (
      <li
        className={`rounded-xl border border-white/10 bg-white/[0.06] px-4 py-4 transition-colors hover:bg-white/[0.09] sm:px-5 border-l-4 ${modalSeverityAccent[alert.severity]}`}
      >
        <div className="flex gap-3 sm:gap-4">
          <Icon
            className={`mt-0.5 h-5 w-5 shrink-0 sm:h-6 sm:w-6 ${modalSeverityIconClass[alert.severity]}`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-display text-base font-semibold leading-snug text-white sm:text-[17px]">
                  {alert.title}
                </p>
                <AlertSourceChip label={alert.sourceLabel} variant="modal" />
              </div>
              <span
                className={`shrink-0 rounded-full ${modalSeverityPillClass[alert.severity]}`}
              >
                {typeLabel}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-white/85 sm:text-base">
              {alert.message}
            </p>
            {alert.timeLabel ? (
              <p className="mt-2 font-data text-[12px] text-white/55">{alert.timeLabel}</p>
            ) : null}
          </div>
        </div>
      </li>
    );
  }

  const style = severityStyles[alert.severity];
  const Icon = style.icon;

  return (
    <li
      className={`rounded-xl border px-3.5 py-3 ${style.border} ${style.bg}`}
    >
      <div className="flex gap-2.5">
        <Icon
          className={`mt-0.5 h-4 w-4 shrink-0 ${severityIconColor[alert.severity]}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-slate-900">
            {alert.title}
          </p>
          <AlertSourceChip
            label={alert.sourceLabel}
            className="mt-1"
          />
          <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
            {alert.message}
          </p>
          {alert.timeLabel ? (
            <p className="mt-1 font-data text-[11px] text-ink-faint">{alert.timeLabel}</p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

type DashboardAlertsListProps = {
  alerts: DashboardAlert[];
  emptyMessage?: string;
  /** Dark teal rows + white text (matches Alertes KPI card) */
  variant?: "default" | "modal";
};

export function DashboardAlertsList({
  alerts,
  emptyMessage = "Aucune alerte pour le moment.",
  variant = "default",
}: DashboardAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <p
        className={
          variant === "modal"
            ? "py-10 text-center text-base text-white/75 sm:text-lg"
            : "py-6 text-center text-sm text-slate-500"
        }
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className={variant === "modal" ? "flex flex-col gap-3 sm:gap-4" : "flex flex-col gap-2"}>
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} variant={variant} />
      ))}
    </ul>
  );
}

export function getLatestAlert(alerts: DashboardAlert[]): DashboardAlert | null {
  return alerts[0] ?? null;
}
