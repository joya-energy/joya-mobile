"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  Droplets,
  Leaf,
  Loader2,
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
import { EnergyFlowScene } from "./energy-flow-scene";
import "./dashboard-energy-flow.css";

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
    <div className="flow-weather-chip">
      <span className="ico" aria-hidden>
        {icon}
      </span>
      <span className="l">{label}</span>
      <span className="v">{value}</span>
    </div>
  );
}

function AutoconsumptionRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = c * (1 - clamped / 100);

  return (
    <div className="flow-auto-ring" aria-hidden>
      <svg viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#E4F3EC"
          strokeWidth="5"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="#1F8A5B"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="pct">{Math.round(clamped)}%</span>
    </div>
  );
}

function EmptyAutoRing() {
  return (
    <div className="flow-auto-ring is-empty" aria-hidden>
      <svg viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 3.4 2.1 28"
        />
      </svg>
      <span className="pct">—</span>
    </div>
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

  return (
    <section className={cn("flow-card", className)}>
      <header className="flow-card-header">
        <div>
          <h2>Flux énergétique du site</h2>
          <p className="sub">
            Production PV, consommation et bilans du jour — Énergie (kWh)
          </p>
        </div>
        <div className="flow-card-header-actions">
          {lastUpdatedLabel ? (
            <p className="stamp">{lastUpdatedLabel}</p>
          ) : null}
          {onRefresh ? (
            <button
              type="button"
              className="flow-card-refresh"
              onClick={handleRefresh}
              disabled={refreshDisabled}
              aria-busy={refreshing}
              aria-label={
                refreshing
                  ? "Synchronisation Enode en cours"
                  : onCooldown
                    ? `Synchronisation disponible dans ${formatEnodeCooldownShort(cooldownSeconds)}`
                    : "Synchroniser et actualiser le tableau de bord"
              }
            >
              {refreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flow-card-body">
        <div className="flow-card-visual">
          <div className="flow-scene">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="flow-scene-photo"
              src="/brand/images/hero-solar-roof-sunset.jpg"
              alt=""
            />
            <div className="flow-scene-scrim" aria-hidden />

            <div className="flow-scene-top">
              <span className="flow-live">
                <span className="dot" aria-hidden />
                Schéma du site en direct
              </span>
              <span className="flow-scene-date">Énergie du jour · kWh</span>
            </div>

            <EnergyFlowScene
              productionKwh={metrics.productionKwh}
              consumptionKwh={metrics.consumptionKwh}
              exportKwh={metrics.exportKwh}
              importKwh={metrics.importKwh}
              format={formatKwh}
            />

            <div className="flow-weather-row">
              <WeatherChip label="Température" value={temperature} icon={<Thermometer className="h-3.5 w-3.5" />} />
              <WeatherChip label="Humidité" value={humidity} icon={<Droplets className="h-3.5 w-3.5" />} />
              <WeatherChip label="Vent" value={wind} icon={<Wind className="h-3.5 w-3.5" />} />
              <WeatherChip label="Irradiation" value={irradiation} icon={<Sun className="h-3.5 w-3.5" />} />
            </div>
          </div>
        </div>

        <aside className="flow-card-rail">
          <div className="flow-card-rail-head">
            <p className="flow-card-rail-label">Bilans du jour</p>
            <span className="flow-rail-date">{todayRailStamp()}</span>
          </div>

          <div className="flow-rail-card auto">
            <div className="row">
              {autoPct != null ? (
                <AutoconsumptionRing pct={autoPct} />
              ) : (
                <EmptyAutoRing />
              )}
              <div className="copy">
                <p className="label">Autoconsommation solaire</p>
                {autoKwh != null ? (
                  <>
                    <p className="value">
                      <CountUp text={`${formatKwh(autoKwh)} kWh`} />
                    </p>
                    <p className="hint">
                      {autoPct != null
                        ? `${Math.round(autoPct)}% de votre production PV consommée sur site.`
                        : "Σ min(PV, consommation) par pas de 15 min."}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="value is-empty">En attente de données</p>
                    <p className="hint">
                      Un compteur edge est requis pour estimer
                      l&apos;autoconsommation.
                    </p>
                    <span className="flow-rail-pill warn">
                      Compteur non détecté
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flow-rail-card savings">
            <div className="row">
              <div className="icon-slot" aria-hidden>
                <Receipt className="h-4 w-4" />
              </div>
              <div className="copy">
                <p className="label">Économies financières</p>
                {dailySavingsValue ? (
                  <p className="value">
                    <CountUp text={dailySavingsValue.replace(/\u00a0TND$/, "")} />
                    <span className="unit">TND</span>
                  </p>
                ) : (
                  <p className="value is-empty">En attente de données</p>
                )}
              </div>
            </div>
            <div className="flow-rail-foot">
              <p className="hint">Pour la production du jour</p>
              {hasProduction && productionKwh != null ? (
                <span className="flow-rail-pill coral">
                  {formatKwh(productionKwh)} kWh produits
                </span>
              ) : null}
            </div>
          </div>

          <div className="flow-rail-card co2">
            <div className="row">
              <div className="icon-slot" aria-hidden>
                <Leaf className="h-4 w-4" />
              </div>
              <div className="copy">
                <p className="label">CO₂ évité</p>
                {dailyCo2Value ? (
                  <p className="value">
                    <CountUp text={dailyCo2Value} />
                    <span className="unit">kg</span>
                  </p>
                ) : (
                  <p className="value is-empty">En attente de données</p>
                )}
              </div>
            </div>
            <div className="flow-rail-foot">
              <p className="hint">Impact environnemental</p>
              <span className="flow-rail-pill sun">Aujourd&apos;hui</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
