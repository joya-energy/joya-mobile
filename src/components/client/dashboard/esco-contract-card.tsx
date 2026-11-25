import { useEffect, type ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Calendar, Clock, DollarSign } from "lucide-react";
import type { DashboardAlert, DashboardEscoContract } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { JoyaEyebrow } from "@/components/joya";
import { CornerGlow } from "./corner-glow";
import { DashboardAlertsKpiCard } from "./dashboard-alerts-kpi-card";
import { EscoPerformanceScale } from "./esco-performance-scale";

type EscoContractCardProps = {
  contract: DashboardEscoContract;
  alerts: DashboardAlert[];
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function remainingHuman(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
  if (rem > 0) parts.push(`${rem} mois`);
  return `${parts.join(" ") || "0 mois"} restants`;
}

function DonutProgress({ percent }: { percent: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, percent));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.value),
  }));

  return (
    <View className="h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center">
      <Svg width="100%" height="100%" viewBox="0 0 56 56">
        <G rotation={-90} origin="28, 28">
          <Circle
            cx={28}
            cy={28}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={5}
          />
          <AnimatedCircle
            cx={28}
            cy={28}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.92)"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <Text className="absolute font-display text-[1.05rem] font-bold tabular-nums leading-none text-white">
        {percent}%
      </Text>
    </View>
  );
}

function MetricMiniCard({
  surface,
  chip,
  icon,
  value,
  valueSuffix,
  label,
}: {
  surface: string;
  chip: string;
  icon: ReactNode;
  value: string;
  valueSuffix?: string;
  label: string;
}) {
  return (
    <View className={cn("min-w-0 flex-1 rounded-[18px] px-3.5 py-3.5", surface)}>
      <View className={cn("h-9 w-9 items-center justify-center rounded-[12px]", chip)}>
        {icon}
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        className="mt-3 font-display text-[1.35rem] font-bold tabular-nums leading-none tracking-tight text-navy"
      >
        {value}
        {valueSuffix ? (
          <Text className="text-[12px] font-semibold text-ink-faint">
            {" "}
            {valueSuffix}
          </Text>
        ) : null}
      </Text>
      <Text className="mt-1.5 text-[12px] font-medium leading-snug text-ink-muted">
        {label}
      </Text>
    </View>
  );
}

function YearBlock({
  label,
  months,
  isCurrentYear,
}: {
  label: string;
  months: Array<{ filled: boolean }>;
  isCurrentYear: boolean;
}) {
  return (
    <View
      className={cn(
        "min-w-[4.25rem] flex-1 rounded-[14px] px-1.5 py-2",
        isCurrentYear ? "bg-white/[0.12]" : "bg-white/[0.06]",
      )}
    >
      <Text className="mb-1.5 text-center font-data text-[10px] font-medium text-white/70">
        {label}
      </Text>
      <View className="flex-row flex-wrap justify-center gap-1">
        {months.map((m, i) => (
          <View
            key={`${label}-${i}`}
            className={cn(
              "h-[0.7rem] w-[0.7rem] rounded-[3px]",
              m.filled ? "bg-coral" : "bg-white/20",
            )}
          />
        ))}
      </View>
    </View>
  );
}

export function EscoContractCard({ contract, alerts }: EscoContractCardProps) {
  if (!contract.configured) {
    return (
      <View className="w-full gap-5">
        <View className="min-h-[16rem] items-center justify-center rounded-[28px] border border-dashed border-line-strong bg-white px-6">
          <Text className="text-center text-sm leading-relaxed text-ink-muted">
            Le contrat ESCO n&apos;est pas encore configuré. L&apos;équipe JOYA renseignera
            le montant mensuel et la date de fin depuis votre profil.
          </Text>
        </View>
        <DashboardAlertsKpiCard alerts={alerts} />
      </View>
    );
  }

  const monthlyDisplay =
    contract.monthlyAmountTnd != null
      ? contract.monthlyAmountTnd.toLocaleString("fr-FR", {
          maximumFractionDigits: 0,
        })
      : CLIENT_DASHBOARD_MISSING;

  const currentYearIndex = Math.min(
    contract.years.length - 1,
    Math.max(0, Math.floor((contract.elapsedMonths - 1) / 12)),
  );

  const approxYears = Math.max(1, Math.round(contract.totalMonths / 12));

  return (
    <View className="w-full gap-5">
      <View className="overflow-hidden rounded-[28px] border border-line bg-white p-5 shadow-sm">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <JoyaEyebrow>Contrat ESCO</JoyaEyebrow>
            <Text
              accessibilityRole="header"
              className="mt-1.5 font-display text-[1.45rem] font-bold tracking-tight text-navy"
            >
              Suivi du contrat
            </Text>
          </View>
          <View
            className={cn(
              "shrink-0 flex-row items-center gap-1.5 rounded-full border px-2.5 py-1",
              contract.status === "active"
                ? "border-line bg-white"
                : contract.status === "ended"
                  ? "border-line bg-slate-50"
                  : "border-warning/20 bg-warning-soft",
            )}
          >
            <View
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                contract.status === "active" ? "bg-navy" : "bg-slate-400",
              )}
            />
            <Text
              className={cn(
                "text-xs font-semibold",
                contract.status === "active"
                  ? "text-navy"
                  : contract.status === "ended"
                    ? "text-ink-muted"
                    : "text-warning",
              )}
            >
              {contract.statusLabel}
            </Text>
          </View>
        </View>

        <View className="mt-4 gap-2 xs:flex-row">
          <MetricMiniCard
            surface="bg-coral-wash"
            chip="bg-white/80"
            icon={<DollarSign size={16} color={joyaColors.coral} />}
            value={monthlyDisplay}
            valueSuffix={monthlyDisplay !== CLIENT_DASHBOARD_MISSING ? "TND" : undefined}
            label="Montant mensuel"
          />
          <MetricMiniCard
            surface="border border-line bg-white"
            chip="bg-slate-100"
            icon={<Clock size={16} color={joyaColors.navy} />}
            value={String(contract.totalMonths)}
            valueSuffix="mois"
            label={`Engagement · ≈ ${approxYears} an${approxYears > 1 ? "s" : ""}`}
          />
          <MetricMiniCard
            surface="border border-line bg-white"
            chip="bg-cream-2"
            icon={<Calendar size={16} color={joyaColors.navy} />}
            value={contract.endLabel}
            label={
              contract.monthsUntilEnd > 0
                ? `Échéance · dans ${contract.monthsUntilEnd} mois`
                : "Échéance atteinte"
            }
          />
        </View>

        <View className="mt-3 overflow-hidden rounded-[22px] px-4 py-4">
          <LinearGradient
            pointerEvents="none"
            colors={["#1a4468", joyaColors.navy, joyaColors.navyDark]}
            locations={[0, 0.46, 1]}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <CornerGlow color="#945ca8" opacity={0.5} cx={1} cy={1} />
          <View className="flex-row items-center gap-4">
            <DonutProgress percent={contract.durationPercent} />
            <View className="min-w-0 flex-1">
              <Text className="font-display text-[1.15rem] font-bold tracking-tight text-white">
                {contract.elapsedMonthsLabel}
              </Text>
              <Text className="mt-0.5 text-[12.5px] text-white/60">
                Progression du contrat
              </Text>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                <View className="rounded-full bg-white/10 px-2.5 py-0.5">
                  <Text className="text-[11.5px] text-white/80">
                    {contract.elapsedMonths} mois passés
                  </Text>
                </View>
                <View className="rounded-full bg-white/10 px-2.5 py-0.5">
                  <Text className="text-[11.5px] text-white/80">
                    {remainingHuman(contract.monthsUntilEnd)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ flexGrow: 1, gap: 6, paddingBottom: 4 }}
          >
            {contract.years.map((year, index) => (
              <YearBlock
                key={year.label}
                label={year.label}
                months={year.months}
                isCurrentYear={index === currentYearIndex}
              />
            ))}
          </ScrollView>
          <View className="mt-2 flex-row justify-between">
            <Text className="font-data text-[11px] text-white/50">
              {contract.startLabel}
            </Text>
            <Text className="font-data text-[11px] text-white/50">
              {contract.endLabel}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <EscoPerformanceScale
            percent={contract.monthlyPerformancePercent}
            missingLabel={CLIENT_DASHBOARD_MISSING}
          />
        </View>
      </View>

      <DashboardAlertsKpiCard alerts={alerts} />
    </View>
  );
}
