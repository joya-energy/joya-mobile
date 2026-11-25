import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G } from "react-native-svg";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import {
  Droplets,
  Leaf,
  Receipt,
  RefreshCw,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTndSavings } from "@/lib/format/currency";
import {
  DASHBOARD_CO2_KG_PER_KWH,
  DASHBOARD_TARIFF_SAVINGS_KPI_DT,
} from "@/lib/dashboard/business-constants";
import { useBannerWeather } from "@/hooks/use-banner-weather";
import {
  formatEnodeCooldownShort,
  useEnodeCooldown,
} from "@/hooks/use-enode-cooldown";
import type {
  ClientDashboardSite,
  DashboardEnodeSync,
} from "@/types/dashboard";
import { CountUp } from "@/components/joya/count-up";
import { joyaColors } from "@/theme/colors";
import { CornerGlow } from "./corner-glow";
import { EnergyFlowScene } from "./energy-flow-scene";

const HERO_PHOTO = require("../../../../assets/brand/images/hero-solar-roof-sunset.jpg");


export type EnergyFlowMetrics = {
  productionKwh: number | null;
  consumptionKwh: number | null;
  exportKwh: number | null;
  importKwh: number | null;
  /** Σ min(PV, conso) per 15 min (kWh). */
  autoconsumptionKwh: number | null;
  autoconsumptionPct: number | null;
  /** Persist annual totals only from 15-min slots, not empty / daily-net fallbacks. */
  source?: "quarter-hour" | "daily-net" | "empty";
};

const QUARTER_HOUR_H = 0.25;
const FLOW_TZ = "Africa/Tunis";

function quarterKeyTunis(iso: string): string | null {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: FLOW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(t));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const minute = Math.floor(Number(get("minute")) / 15) * 15;
  if (!Number.isFinite(minute)) return null;
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${String(minute).padStart(2, "0")}`;
}

function averageKwhFromKwSamples(samples: Map<string, number[]>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [key, list] of samples) {
    if (!list.length) continue;
    const avgKw = list.reduce((sum, v) => sum + v, 0) / list.length;
    out.set(key, Math.max(0, avgKw) * QUARTER_HOUR_H);
  }
  return out;
}

function sumSlotKwh(slots: Map<string, number>): number {
  let total = 0;
  for (const v of slots.values()) total += v;
  return total;
}

type DashboardEnergyFlowCardProps = {
  site: ClientDashboardSite;
  onboardingLocationQuery?: string | null;
  lastUpdatedLabel?: string;
  metrics: EnergyFlowMetrics;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  enodeSync?: DashboardEnodeSync;
  className?: string;
};

function formatKwh(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: value < 10 ? 1 : 0,
    maximumFractionDigits: value < 10 ? 2 : 1,
  });
}

function formatDailyCo2Kg(kg: number): string {
  return kg.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function todayRailStamp(timeZone = "Africa/Tunis"): string {
  const raw = new Date().toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone,
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}



const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Live status dot with an expanding pulse ring (replaces `flow-live-pulse`). */
function LiveDot() {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);
    pulse.value = 0;
    if (reducedMotion) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [reducedMotion, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 2.4 }],
  }));

  return (
    <View className="h-[7px] w-[7px] items-center justify-center">
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: "#4ade80",
          },
          ringStyle,
        ]}
      />
      <View className="h-[7px] w-[7px] rounded-full bg-[#4ade80]" />
    </View>
  );
}

/** Slow "ken burns" zoom on the scene photo (replaces `flow-ken-burns`). */
function ScenePhoto() {
  const reducedMotion = useReducedMotion();
  const zoom = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(zoom);
    if (reducedMotion) return;
    zoom.value = withTiming(1, {
      duration: 22000,
      easing: Easing.out(Easing.quad),
    });
    return () => cancelAnimation(zoom);
  }, [reducedMotion, zoom]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1.03 + 0.07 * zoom.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Image
        source={HERO_PHOTO}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        contentPosition="center"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}

function WeatherChip({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <View
      className="min-w-0 flex-row items-center gap-2 rounded-[12px] border border-white/15 bg-white/10 px-2.5 py-2"
      style={{ flexGrow: 1, flexBasis: "45%" }}
    >
      {icon}
      <View className="min-w-0 flex-1">
        <Text className="text-[10.5px] text-cream/70" numberOfLines={1}>
          {label}
        </Text>
        <Text
          className="text-[13px] font-bold tabular-nums text-cream"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function AutoconsumptionRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped / 100, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.value),
  }));

  return (
    <View
      className="h-[76px] w-[76px] shrink-0 items-center justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 48 48">
        <G rotation={-90} origin="24, 24">
          <Circle
            cx={24}
            cy={24}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={5}
          />
          <AnimatedCircle
            cx={24}
            cy={24}
            r={r}
            fill="none"
            stroke="#4ade80"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={c}
            animatedProps={animatedProps}
          />
        </G>
      </Svg>
      <Text className="absolute font-display text-[16px] font-semibold tabular-nums text-white/70">
        {Math.round(clamped)}%
      </Text>
    </View>
  );
}

const EMPTY_RING_R = 20;
const EMPTY_RING_C = 2 * Math.PI * EMPTY_RING_R;
/** Dotted ring pattern, scaled from a 100-unit path length. */
const EMPTY_RING_DASH = [
  ...Array.from({ length: 12 }, () => [2.1, 3.4]).flat(),
  2.1,
  28,
].map((n) => (n * EMPTY_RING_C) / 100);

function EmptyAutoRing() {
  return (
    <View
      className="h-[76px] w-[76px] shrink-0 items-center justify-center"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 56 56">
        <G rotation={-18} origin="28, 28">
          <Circle
            cx={28}
            cy={28}
            r={EMPTY_RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.42)"
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeDasharray={EMPTY_RING_DASH}
          />
        </G>
      </Svg>
      <Text className="absolute font-display text-[16px] font-semibold text-white/70">
        —
      </Text>
    </View>
  );
}

type PillTone = "warn" | "coral" | "sun";

const PILL_CLASS: Record<PillTone, { box: string; text: string }> = {
  warn: { box: "bg-sun/15", text: "text-sun" },
  coral: { box: "border border-coral/30 bg-white", text: "text-coral" },
  sun: { box: "bg-warning-soft", text: "text-warning" },
};

function RailPill({
  tone,
  children,
  className,
}: {
  tone: PillTone;
  children: ReactNode;
  className?: string;
}) {
  const t = PILL_CLASS[tone];
  return (
    <View
      className={cn(
        "flex-row items-center gap-1.5 self-start rounded-full px-[11px] py-[5px]",
        t.box,
        className,
      )}
    >
      {tone === "warn" ? <View className="h-[7px] w-[7px] rounded-full bg-sun" /> : null}
      <Text className={cn("text-[11.5px] font-semibold", t.text)}>{children}</Text>
    </View>
  );
}

export function deriveEnergyFlowMetrics(
  productionKwh: number | null | undefined,
  consumptionKwh: number | null | undefined,
): EnergyFlowMetrics {
  const pv =
    productionKwh != null && Number.isFinite(productionKwh)
      ? Math.max(0, productionKwh)
      : null;
  const load =
    consumptionKwh != null && Number.isFinite(consumptionKwh)
      ? Math.max(0, consumptionKwh)
      : null;

  if (pv == null && load == null) {
    return {
      productionKwh: null,
      consumptionKwh: null,
      exportKwh: null,
      importKwh: null,
      autoconsumptionKwh: null,
      autoconsumptionPct: null,
      source: "empty",
    };
  }

  const p = pv ?? 0;
  const c = load ?? 0;
  const auto = Math.min(p, c);
  const exportKwh = Math.max(p - c, 0);
  const importKwh = Math.max(c - p, 0);
  const both = pv != null && load != null;

  return {
    productionKwh: pv,
    consumptionKwh: load,
    exportKwh: both ? exportKwh : null,
    importKwh: both ? importKwh : null,
    autoconsumptionKwh: both ? auto : null,
    autoconsumptionPct: both && p > 0 ? (auto / p) * 100 : null,
    source: both ? "daily-net" : "empty",
  };
}

function kwhBySlotFromKwPoints(
  points: Array<{ time: string; valueKw: number; isLive?: boolean }>,
): Map<string, number> {
  const samples = new Map<string, number[]>();
  for (const point of points) {
    if (point.isLive) continue;
    if (!Number.isFinite(point.valueKw)) continue;
    const slot = quarterKeyTunis(point.time);
    if (slot == null) continue;
    const list = samples.get(slot) ?? [];
    list.push(Math.max(0, point.valueKw));
    samples.set(slot, list);
  }
  return averageKwhFromKwSamples(samples);
}

function kwhBySlotFromLoadPoints(
  points: Array<{ t: string; active_power_total_kw: number | null }>,
): Map<string, number> {
  const samples = new Map<string, number[]>();
  for (const point of points) {
    if (
      point.active_power_total_kw == null ||
      !Number.isFinite(point.active_power_total_kw)
    ) {
      continue;
    }
    const slot = quarterKeyTunis(point.t);
    if (slot == null) continue;
    const list = samples.get(slot) ?? [];
    list.push(Math.max(0, point.active_power_total_kw));
    samples.set(slot, list);
  }
  return averageKwhFromKwSamples(samples);
}

function flowFromQuarterHours(
  pvSlots: Map<string, number>,
  loadSlots: Map<string, number>,
): { exportKwh: number; importKwh: number; autoKwh: number } {
  let exportKwh = 0;
  let importKwh = 0;
  let autoKwh = 0;
  for (const slot of new Set([...pvSlots.keys(), ...loadSlots.keys()])) {
    const pv = pvSlots.get(slot) ?? 0;
    const load = loadSlots.get(slot) ?? 0;
    exportKwh += Math.max(pv - load, 0);
    importKwh += Math.max(load - pv, 0);
    autoKwh += Math.min(pv, load);
  }
  return { exportKwh, importKwh, autoKwh };
}

/**
 * ClickUp table (énergie du jour):
 * Production = Σ (PV kW × 0,25)
 * Consommation = Σ (conso kW × 0,25)
 * Export = Σ max(PV − conso, 0)  (same 15 min kWh)
 * Import = Σ max(conso − PV, 0)
 * Autoconsommation = Σ min(PV, conso)
 */
export function deriveEnergyFlowDayMetrics(args: {
  productionKwh?: number | null;
  consumptionKwh?: number | null;
  pvSeries?: Array<{ time: string; valueKw: number; isLive?: boolean }>;
  loadPoints?: Array<{ t: string; active_power_total_kw: number | null }>;
}): EnergyFlowMetrics {
  const pvSlots = kwhBySlotFromKwPoints(args.pvSeries ?? []);
  const loadSlots = kwhBySlotFromLoadPoints(args.loadPoints ?? []);
  const pvSum = sumSlotKwh(pvSlots);
  const loadSum = sumSlotKwh(loadSlots);

  const production =
    pvSlots.size > 0
      ? pvSum
      : finiteEnergy(args.productionKwh);
  const consumption =
    loadSlots.size > 0
      ? loadSum
      : finiteEnergy(args.consumptionKwh);

  if (pvSlots.size > 0 && loadSlots.size > 0) {
    const { exportKwh, importKwh, autoKwh } = flowFromQuarterHours(
      pvSlots,
      loadSlots,
    );
    return {
      productionKwh: production,
      consumptionKwh: consumption,
      exportKwh,
      importKwh,
      autoconsumptionKwh: autoKwh,
      autoconsumptionPct:
        production != null && production > 0
          ? (autoKwh / production) * 100
          : null,
      source: "quarter-hour",
    };
  }

  return deriveEnergyFlowMetrics(production, consumption);
}

function finiteEnergy(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, value);
}



export function DashboardEnergyFlowCard({
  site,
  onboardingLocationQuery,
  lastUpdatedLabel,
  metrics,
  onRefresh,
  isRefreshing = false,
  enodeSync,
  className,
}: DashboardEnergyFlowCardProps) {
  const { data: weather, loading: weatherLoading } = useBannerWeather(
    site,
    onboardingLocationQuery,
  );
  const cooldownSeconds = useEnodeCooldown(
    enodeSync?.nextEnodeRefreshAt ?? null,
    enodeSync?.canRefresh ?? true,
  );
  const [clickPending, setClickPending] = useState(false);
  const refreshing = isRefreshing || clickPending;
  const onCooldown = !refreshing && cooldownSeconds > 0;
  const refreshDisabled = !onRefresh || refreshing || onCooldown;

  const handleRefresh = useCallback(() => {
    if (refreshDisabled || !onRefresh) return;
    setClickPending(true);
    void Promise.resolve(onRefresh()).finally(() => setClickPending(false));
  }, [onRefresh, refreshDisabled]);

  const dash = "—";
  const temperature =
    weather != null
      ? `${weather.temperatureCelsius}°C`
      : site.temperatureCelsius != null
        ? `${Math.round(site.temperatureCelsius)}°C`
        : weatherLoading
          ? "…"
          : dash;
  const humidity =
    weather?.humidityPercent != null
      ? `${weather.humidityPercent}%`
      : site.humidityPercent != null
        ? `${site.humidityPercent}%`
        : weatherLoading
          ? "…"
          : dash;
  const wind =
    weather?.windSpeedKmh != null
      ? `${weather.windSpeedKmh} km/h`
      : weatherLoading
        ? "…"
        : dash;
  const irradiation =
    weather?.irradiationWm2 != null
      ? `${weather.irradiationWm2} W/m²`
      : weatherLoading
        ? "…"
        : dash;

  const autoPct = metrics.autoconsumptionPct;
  const autoKwh = metrics.autoconsumptionKwh;
  const productionKwh = metrics.productionKwh;
  const hasProduction =
    productionKwh != null &&
    Number.isFinite(productionKwh) &&
    productionKwh > 0;

  const dailySavingsValue = hasProduction
    ? formatTndSavings(productionKwh * DASHBOARD_TARIFF_SAVINGS_KPI_DT)
    : null;
  const dailyCo2Value = hasProduction
    ? formatDailyCo2Kg(productionKwh * DASHBOARD_CO2_KG_PER_KWH)
    : null;

  const weatherIconProps = { size: 14, color: "#f5d08a" } as const;

  return (
    <View
      className={cn(
        "w-full overflow-hidden rounded-[24px] border border-line bg-white shadow-sm",
        className,
      )}
    >
      {/* Header */}
      <View className="flex-row items-start justify-between gap-3 border-b border-line px-4 pb-3.5 pt-4">
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[18px] font-bold leading-tight tracking-tight text-navy-dark">
            Flux énergétique du site
          </Text>
          <Text className="mt-0.5 text-[12.5px] text-ink-muted">
            Production PV, consommation et bilans du jour — Énergie (kWh)
          </Text>
          {lastUpdatedLabel ? (
            <Text className="mt-1 text-[12px] font-medium text-ink-muted">
              {lastUpdatedLabel}
            </Text>
          ) : null}
        </View>
        {onRefresh ? (
          <Pressable
            onPress={handleRefresh}
            disabled={refreshDisabled}
            accessibilityRole="button"
            accessibilityState={{ disabled: refreshDisabled, busy: refreshing }}
            accessibilityLabel={
              refreshing
                ? "Synchronisation Enode en cours"
                : onCooldown
                  ? `Synchronisation disponible dans ${formatEnodeCooldownShort(cooldownSeconds)}`
                  : "Synchroniser et actualiser le tableau de bord"
            }
            hitSlop={6}
            className={cn(
              "h-[34px] w-[34px] items-center justify-center rounded-full border border-line-strong bg-white active:bg-cream",
              refreshDisabled && "opacity-55",
            )}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={joyaColors.navy} />
            ) : (
              <RefreshCw size={14} color={joyaColors.navy} />
            )}
          </Pressable>
        ) : null}
      </View>

      <View className="gap-4 p-3.5">
        {/* Photo scene */}
        <View className="relative gap-4 overflow-hidden rounded-[18px] bg-navy-dark p-3.5">
          <ScenePhoto />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(15,42,68,0.62)",
              "rgba(15,42,68,0.18)",
              "rgba(15,42,68,0.28)",
              "rgba(15,42,68,0.78)",
            ]}
            locations={[0, 0.42, 0.62, 1]}
            style={StyleSheet.absoluteFill}
          />

          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <View className="flex-row items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
              <LiveDot />
              <Text className="text-[12px] font-semibold text-cream">
                Schéma du site en direct
              </Text>
            </View>
            <Text className="font-data text-[11px] uppercase tracking-[0.08em] text-cream/70">
              Énergie du jour · kWh
            </Text>
          </View>

          <EnergyFlowScene
            productionKwh={metrics.productionKwh}
            consumptionKwh={metrics.consumptionKwh}
            exportKwh={metrics.exportKwh}
            importKwh={metrics.importKwh}
            format={formatKwh}
          />

          <View className="flex-row flex-wrap gap-2">
            <WeatherChip
              label="Température"
              value={temperature}
              icon={<Thermometer {...weatherIconProps} />}
            />
            <WeatherChip
              label="Humidité"
              value={humidity}
              icon={<Droplets {...weatherIconProps} />}
            />
            <WeatherChip
              label="Vent"
              value={wind}
              icon={<Wind {...weatherIconProps} />}
            />
            <WeatherChip
              label="Irradiation"
              value={irradiation}
              icon={<Sun {...weatherIconProps} />}
            />
          </View>
        </View>

        {/* Rail: daily balances */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between gap-2.5">
            <View className="flex-row items-center gap-2">
              <View className="h-3.5 w-[3px] rounded-full bg-coral" />
              <Text className="text-[14.5px] font-semibold tracking-tight text-navy-dark">
                Bilans du jour
              </Text>
            </View>
            <View className="rounded-full border border-line bg-white px-[11px] py-[5px]">
              <Text className="text-[12px] font-semibold text-ink-muted">
                {todayRailStamp()}
              </Text>
            </View>
          </View>

          {/* Autoconsommation */}
          <View className="overflow-hidden rounded-[22px] px-5 pb-4 pt-5">
            <LinearGradient
              pointerEvents="none"
              colors={["#1a4468", joyaColors.navy, joyaColors.navyDark]}
              locations={[0, 0.42, 1]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <CornerGlow color="#945ca8" opacity={0.55} cx={1} cy={0.85} />
            <View className="flex-row items-center gap-4">
              {autoPct != null ? (
                <AutoconsumptionRing pct={autoPct} />
              ) : (
                <EmptyAutoRing />
              )}
              <View className="min-w-0 flex-1">
                <Text className="text-[12.5px] font-medium text-cream/70">
                  Autoconsommation solaire
                </Text>
                {autoKwh != null ? (
                  <>
                    <CountUp
                      text={`${formatKwh(autoKwh)} kWh`}
                      className="mt-0.5 font-display text-[21px] font-bold tabular-nums text-white"
                    />
                    <Text className="mt-1 text-[12.5px] leading-[18px] text-cream/60">
                      {autoPct != null
                        ? `${Math.round(autoPct)}% de votre production PV consommée sur site.`
                        : "Σ min(PV, consommation) par pas de 15 min."}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="mt-0.5 font-display text-[19px] font-bold text-white">
                      En attente de données
                    </Text>
                    <Text className="mt-1 text-[12.5px] leading-[18px] text-cream/60">
                      Un compteur edge est requis pour estimer l'autoconsommation.
                    </Text>
                    <RailPill tone="warn" className="mt-3">
                      Compteur non détecté
                    </RailPill>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Économies */}
          <View className="overflow-hidden rounded-[22px] px-5 pb-4 pt-5">
            <LinearGradient
              pointerEvents="none"
              colors={["#fffdfb", joyaColors.coralWash]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <CornerGlow color={joyaColors.coral} opacity={0.16} cx={1} cy={0} />
            <View className="flex-row items-center gap-4">
              <View className="h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-white">
                <Receipt size={16} color={joyaColors.coral} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[12.5px] font-medium text-ink-muted">
                  Économies financières
                </Text>
                {dailySavingsValue ? (
                  <View className="mt-0.5 flex-row flex-wrap items-baseline">
                    <CountUp
                      text={dailySavingsValue.replace(/\u00a0TND$/, "")}
                      className="font-display text-[24px] font-bold tabular-nums text-navy-dark"
                    />
                    <Text className="text-[12.5px] font-semibold text-ink-faint">
                      {" "}
                      TND
                    </Text>
                  </View>
                ) : (
                  <Text className="mt-0.5 font-display text-[19px] font-bold text-ink-faint">
                    En attente de données
                  </Text>
                )}
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between gap-2.5 border-t border-coral/25 pt-3">
              <Text className="flex-1 text-[12.5px] text-ink-muted">
                Pour la production du jour
              </Text>
              {hasProduction && productionKwh != null ? (
                <RailPill tone="coral">
                  {formatKwh(productionKwh)} kWh produits
                </RailPill>
              ) : null}
            </View>
          </View>

          {/* CO₂ */}
          <View className="rounded-[22px] border border-navy/10 bg-white px-5 pb-4 pt-5 shadow-sm">
            <View className="flex-row items-center gap-4">
              <View className="h-[42px] w-[42px] items-center justify-center rounded-[14px] bg-cream-2">
                <Leaf size={16} color={joyaColors.coral} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[12.5px] font-medium text-ink-muted">
                  CO₂ évité
                </Text>
                {dailyCo2Value ? (
                  <View className="mt-0.5 flex-row flex-wrap items-baseline">
                    <CountUp
                      text={dailyCo2Value}
                      className="font-display text-[24px] font-bold tabular-nums text-navy-dark"
                    />
                    <Text className="text-[12.5px] font-semibold text-ink-faint">
                      {" "}
                      kg
                    </Text>
                  </View>
                ) : (
                  <Text className="mt-0.5 font-display text-[19px] font-bold text-ink-faint">
                    En attente de données
                  </Text>
                )}
              </View>
            </View>
            <View className="mt-4 flex-row items-center justify-between gap-2.5 border-t border-navy/15 pt-3">
              <Text className="flex-1 text-[12.5px] text-ink-muted">
                Impact environnemental
              </Text>
              <RailPill tone="sun">Aujourd&apos;hui</RailPill>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

