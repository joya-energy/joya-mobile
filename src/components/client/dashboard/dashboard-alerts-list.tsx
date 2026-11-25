import { Text, View } from "react-native";
import { AlertTriangle, Info, XCircle } from "lucide-react";
import type { DashboardAlert, DashboardAlertSeverity } from "@/types/dashboard";
import { joyaColors } from "@/theme/colors";
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
  info: joyaColors.blue,
  warning: joyaColors.warning,
  error: joyaColors.danger,
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

const modalSeverityIconColor: Record<DashboardAlertSeverity, string> = {
  error: joyaColors.dangerSoft,
  warning: joyaColors.warningSoft,
  info: joyaColors.blueLight,
};

const modalSeverityPill: Record<
  DashboardAlertSeverity,
  { box: string; text: string }
> = {
  error: {
    box: "border border-danger/35 bg-danger-strong/45",
    text: "text-danger-soft",
  },
  warning: {
    box: "border border-warning/35 bg-warning-strong/40",
    text: "text-warning-soft",
  },
  info: {
    box: "border border-blue-light/35 bg-navy-deep/40",
    text: "text-blue-tint",
  },
};

function AlertItem({
  alert,
  variant = "default",
}: {
  alert: DashboardAlert;
  variant?: "default" | "modal";
}) {
  const style = severityStyles[alert.severity];
  const Icon = style.icon;

  if (variant === "modal") {
    const typeLabel = modalSeverityLabelFr[alert.severity];
    const pill = modalSeverityPill[alert.severity];

    return (
      <View
        className={`rounded-xl border border-l-4 border-white/10 bg-white/[0.06] px-4 py-4 ${modalSeverityAccent[alert.severity]}`}
      >
        <View className="flex-row gap-3">
          <View className="mt-0.5">
            <Icon size={20} color={modalSeverityIconColor[alert.severity]} />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap items-start justify-between gap-2">
              <View className="min-w-0 flex-1 gap-1">
                <Text className="font-display text-base font-semibold leading-snug text-white">
                  {alert.title}
                </Text>
                <AlertSourceChip label={alert.sourceLabel} variant="modal" />
              </View>
              <View className={`rounded-full px-2.5 py-0.5 ${pill.box}`}>
                <Text className={`text-xs font-semibold ${pill.text}`}>
                  {typeLabel}
                </Text>
              </View>
            </View>
            <Text className="mt-1.5 text-sm leading-relaxed text-white/85">
              {alert.message}
            </Text>
            {alert.timeLabel ? (
              <Text className="mt-2 font-data text-[12px] text-white/55">
                {alert.timeLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={`rounded-xl border px-3.5 py-3 ${style.border} ${style.bg}`}>
      <View className="flex-row gap-2.5">
        <View className="mt-0.5">
          <Icon size={16} color={severityIconColor[alert.severity]} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold leading-snug text-slate-900">
            {alert.title}
          </Text>
          <AlertSourceChip label={alert.sourceLabel} className="mt-1" />
          <Text className="mt-0.5 text-xs leading-relaxed text-slate-600">
            {alert.message}
          </Text>
          {alert.timeLabel ? (
            <Text className="mt-1 font-data text-[11px] text-ink-faint">
              {alert.timeLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

type DashboardAlertsListProps = {
  alerts: DashboardAlert[];
  emptyMessage?: string;
  /** Dark navy rows + white text (matches Alertes KPI card) */
  variant?: "default" | "modal";
};

export function DashboardAlertsList({
  alerts,
  emptyMessage = "Aucune alerte pour le moment.",
  variant = "default",
}: DashboardAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <Text
        className={
          variant === "modal"
            ? "py-10 text-center text-base text-white/75"
            : "py-6 text-center text-sm text-slate-500"
        }
      >
        {emptyMessage}
      </Text>
    );
  }

  return (
    <View className={variant === "modal" ? "gap-3" : "gap-2"}>
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} variant={variant} />
      ))}
    </View>
  );
}

export function getLatestAlert(alerts: DashboardAlert[]): DashboardAlert | null {
  return alerts[0] ?? null;
}
