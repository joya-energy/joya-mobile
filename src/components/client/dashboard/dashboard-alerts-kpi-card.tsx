import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { DashboardAlert } from "@/types/dashboard";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { filterAlertsForDeviceScope } from "@/lib/device-scope/storage";
import { AlertSourceChip } from "./alert-source-chip";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";
import { JoyaEyebrow } from "@/components/joya";
import { DashboardAlertsModal } from "./dashboard-alerts-modal";

type DashboardAlertsKpiCardProps = {
  alerts: DashboardAlert[];
  className?: string;
};

const CRITICAL_PREVIEW = 2;

function compactTimeLabel(label?: string): string | null {
  if (!label?.trim()) return null;
  return label.replace(/^Il y a\s+/i, "").trim() || label.trim();
}

function StatChip({
  label,
  count,
  dotClass,
}: {
  label: string;
  count: number;
  dotClass: string;
}) {
  return (
    <View className="min-w-0 flex-1 flex-row items-center justify-between gap-2 rounded-[16px] border border-line bg-white px-3.5 py-3">
      <View>
        <Text className="text-[12px] font-medium text-ink-muted">{label}</Text>
        <Text className="font-display text-[1.35rem] font-bold tabular-nums leading-none text-navy">
          {count}
        </Text>
      </View>
      <View className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} />
    </View>
  );
}

export function DashboardAlertsKpiCard({
  alerts,
  className,
}: DashboardAlertsKpiCardProps) {
  const [open, setOpen] = useState(false);
  const { scope } = useDeviceScope();

  const scopedAlerts = useMemo(
    () => filterAlertsForDeviceScope(alerts, scope),
    [alerts, scope],
  );

  const { total, criticalCount, criticalRows, attentionCount, infoCount } =
    useMemo(() => {
      const errors = scopedAlerts.filter((a) => a.severity === "error");
      return {
        total: scopedAlerts.length,
        criticalCount: errors.length,
        criticalRows: errors.slice(0, CRITICAL_PREVIEW),
        attentionCount: scopedAlerts.filter((a) => a.severity === "warning").length,
        infoCount: scopedAlerts.filter((a) => a.severity === "info").length,
      };
    }, [scopedAlerts]);

  const cta =
    criticalCount > 0
      ? `Voir les ${criticalCount} alerte${criticalCount > 1 ? "s" : ""} critique${criticalCount > 1 ? "s" : ""}`
      : infoCount > 0
        ? `Voir les ${infoCount} information${infoCount > 1 ? "s" : ""}`
        : attentionCount > 0
          ? `Voir les ${attentionCount} attention${attentionCount > 1 ? "s" : ""}`
          : "Voir les alertes";

  return (
    <>
      <View
        className={cn(
          "min-h-[16rem] overflow-hidden rounded-[28px] border border-line bg-white p-5 shadow-sm",
          className,
        )}
      >
        <View className="flex-row items-start justify-between gap-3">
          <View>
            <JoyaEyebrow>Surveillance</JoyaEyebrow>
            <Text
              accessibilityRole="header"
              className="mt-1.5 font-display text-[1.45rem] font-bold tracking-tight text-navy"
            >
              Alertes
            </Text>
          </View>
          <View
            accessibilityLabel={`${total} alerte${total !== 1 ? "s" : ""}`}
            className="h-8 min-w-8 items-center justify-center rounded-full bg-coral px-2"
          >
            <Text className="font-display text-sm font-bold tabular-nums text-white">
              {total}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row gap-2">
          <StatChip label="Critique" count={criticalCount} dotClass="bg-danger" />
          <StatChip label="Attention" count={attentionCount} dotClass="bg-sun" />
          <StatChip label="Info" count={infoCount} dotClass="bg-navy" />
        </View>

        <View className="mt-3 flex-1 justify-center rounded-[22px] bg-coral-wash px-5 py-8">
          {criticalRows.length > 0 ? (
            <View className="gap-3">
              {criticalRows.map((alert) => {
                const time = compactTimeLabel(alert.timeLabel);
                return (
                  <View key={alert.id} className="flex-row items-start gap-2.5">
                    <View className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" />
                    <Text className="min-w-0 flex-1 text-sm font-semibold leading-snug text-navy">
                      {alert.title}
                    </Text>
                    {alert.sourceLabel ? (
                      <AlertSourceChip
                        label={alert.sourceLabel}
                        className="max-w-[7rem] shrink-0 border border-line bg-white"
                      />
                    ) : null}
                    {time ? (
                      <Text className="shrink-0 text-xs font-medium tabular-nums text-ink-faint">
                        {time}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="items-center">
              <View className="h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[22px] bg-white">
                <ShieldCheck size={28} color={joyaColors.coral} />
              </View>
              <Text className="mt-4 font-display text-lg font-bold tracking-tight text-navy">
                Aucune alerte critique
              </Text>
              <Text className="mt-1.5 text-center text-[13.5px] leading-relaxed text-ink-muted">
                Votre installation fonctionne normalement.
                {infoCount > 0
                  ? ` ${infoCount} information${infoCount > 1 ? "s" : ""} ${infoCount > 1 ? "sont" : "est"} disponible${infoCount > 1 ? "s" : ""}.`
                  : null}
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityHint="Ouvre la liste des alertes"
          className="mt-3 h-11 flex-row items-center justify-center gap-2 rounded-[14px] border border-line bg-white active:bg-cream"
        >
          <Text className="text-[13.5px] font-semibold text-navy">{cta}</Text>
          <ArrowRight size={16} color={joyaColors.navy} />
        </Pressable>
      </View>

      <DashboardAlertsModal
        open={open}
        onClose={() => setOpen(false)}
        alerts={scopedAlerts}
      />
    </>
  );
}
