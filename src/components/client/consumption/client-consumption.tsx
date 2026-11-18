"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  CalendarRange,
  Eye,
  Gauge,
  History,
  RefreshCw,
  Timer,
  TrendingDown,
  Zap,
} from "lucide-react";
import { EnergyEfficiencySection } from "@/components/client/consumption/energy-efficiency-section";
import { translateUserMessage } from "@/lib/user-messages";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { DeviceScopeLoadingOverlay } from "@/components/client/device-scope-loading-overlay";
import { useEdgeConsumption } from "@/hooks/use-edge-consumption";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  JoyaEmptyState,
  JoyaErrorState,
  JoyaKpiCard,
  JoyaLoadingState,
  JoyaPageHeader,
  JoyaSectionHeader,
} from "@/components/joya";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DailyEnergyBarChart,
  MetricLinePanel,
  fmtMetric,
  mean,
  sumPhases,
  type ViewMode,
} from "@/components/client/consumption/edge-consumption-charts";
import { ConsumptionSkeleton } from "@/components/client/consumption/consumption-skeleton";
import { ConsumptionHistorySection } from "@/components/client/consumption/consumption-history-section";
import { ClientPowerOutageHoursChart } from "@/components/client/consumption/client-power-outage-hours-chart";
import {
  hourlyEnergyRows,
  mapDayMetricSeries,
} from "@/lib/consumption/hourly-energy";

function todayYmdLocal(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "Africa/Tunis",
  });
}

function formatDayLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function monthLabelFr(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(Date.UTC(y, m - 1, 1, 12));
  const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function trackingSinceLabel(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Tunis",
    });
  } catch {
    return null;
  }
}

function fmtKwhNumber(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function ClientConsumption() {
  const { activeSite } = useDeviceScope();
  const [selectedDate, setSelectedDate] = useState(todayYmdLocal());
  const isToday = selectedDate === todayYmdLocal();

  const [modeVoltage, setModeVoltage] = useState<ViewMode>("gen");
  const [modeCurrent, setModeCurrent] = useState<ViewMode>("gen");
  const [modeActive, setModeActive] = useState<ViewMode>("gen");
  const [panel, setPanel] = useState<"analyse" | "efficiency">("analyse");

  const {
    devices,
    deviceId,
    setDeviceId,
    monitor,
    devicesLoading,
    monitorLoading,
    error,
    reload,
  } = useEdgeConsumption({
    historyDate: isToday ? undefined : selectedDate,
  });

  const latest = monitor?.latest;
  const seriesPoints = useMemo(() => {
    if (!monitor) return [];
    const historyPoints =
      monitor.history.quarter_hour.length > 0
        ? monitor.history.quarter_hour
        : monitor.history.hourly;
    if (isToday) {
      return monitor.today.points.length ? monitor.today.points : historyPoints;
    }
    if (monitor.history.date !== selectedDate) return [];
    return historyPoints;
  }, [isToday, monitor, selectedDate]);

  const voltageSeries = useMemo(
    () =>
      mapDayMetricSeries(
        seriesPoints,
        (p) => ({
          l1: p.voltage_l1,
          l2: p.voltage_l2,
          l3: p.voltage_l3,
          gen: p.voltage_avg ?? mean(p.voltage_l1, p.voltage_l2, p.voltage_l3),
        }),
        { forceMinute: true },
      ),
    [seriesPoints],
  );

  const currentSeries = useMemo(
    () =>
      mapDayMetricSeries(
        seriesPoints,
        (p) => ({
          l1: p.current_l1,
          l2: p.current_l2,
          l3: p.current_l3,
          gen: sumPhases(p.current_l1, p.current_l2, p.current_l3),
        }),
        { forceMinute: true },
      ),
    [seriesPoints],
  );

  const activeSeries = useMemo(
    () =>
      mapDayMetricSeries(
        seriesPoints,
        (p) => {
          const pf = p.power_factor ?? 0.97;
          const l2 =
            p.voltage_l2 != null && p.current_l2 != null
              ? (p.voltage_l2 * p.current_l2 * pf) / 1000
              : null;
          const l3 =
            p.voltage_l3 != null && p.current_l3 != null
              ? (p.voltage_l3 * p.current_l3 * pf) / 1000
              : null;
          return {
            l1: p.active_power_l1_kw,
            l2,
            l3,
            gen: p.active_power_total_kw,
          };
        },
        { forceMinute: true },
      ),
    [seriesPoints],
  );

  const pfSeries = useMemo(
    () =>
      mapDayMetricSeries(
        seriesPoints,
        (p) => ({
          gen: p.power_factor,
          l1: null,
          l2: null,
          l3: null,
        }),
        { forceMinute: true },
      ),
    [seriesPoints],
  );

  const voltageRows = voltageSeries.rows;
  const currentRows = currentSeries.rows;
  const activeRows = activeSeries.rows;
  const pfRows = pfSeries.rows;

  const dailyEnergy = useMemo(() => {
    if (monitor?.history.date !== selectedDate) return [];
    return hourlyEnergyRows(monitor.history.hourly) ?? [];
  }, [monitor, selectedDate]);

  const dayTotal = dailyEnergy.reduce((a, r) => a + (r.gen ?? 0), 0);
  const todayCardKwh = dayTotal > 0 ? dayTotal : null;
  const monthCardKwh = (() => {
    const m = monitor?.consumption.month_kwh ?? null;
    if (m != null && todayCardKwh != null && m + 1e-6 < todayCardKwh) {
      return todayCardKwh;
    }
    return m;
  })();
  const totalCardKwh = (() => {
    const a = monitor?.consumption.all_time_kwh ?? null;
    if (a != null && monthCardKwh != null && a + 1e-6 < monthCardKwh) {
      return monthCardKwh;
    }
    return a;
  })();

  const online =
    monitor?.device.status === "active" ||
    (monitor?.device.last_seen_at &&
      Date.now() - new Date(monitor.device.last_seen_at).getTime() < 15 * 60 * 1000);

  if (devicesLoading && !monitor) {
    return <ConsumptionSkeleton />;
  }

  if (error && !monitor) {
    return (
      <JoyaErrorState
        className="rounded-2xl border border-line bg-white"
        description={translateUserMessage(error.message, "Impossible de charger les données.")}
        onRetry={() => reload()}
      />
    );
  }

  const summaryCards = [
    {
      key: "today",
      title: "Du jour",
      subtitle: formatDayLabel(selectedDate),
      value: todayCardKwh,
      icon: Zap,
      variant: "hot" as const,
      tone: "coral" as const,
    },
    {
      key: "month",
      title: "Ce mois-ci",
      subtitle: monitor?.consumption.month
        ? monthLabelFr(monitor.consumption.month)
        : "Mois en cours",
      value: monthCardKwh,
      icon: CalendarRange,
      variant: "default" as const,
      tone: "navy" as const,
    },
    {
      key: "all",
      title: "Depuis l'installation",
      subtitle: trackingSinceLabel(monitor?.consumption.tracking_since)
        ? `Depuis le ${trackingSinceLabel(monitor?.consumption.tracking_since)}`
        : "Depuis la première mesure",
      value: totalCardKwh,
      icon: History,
      variant: "default" as const,
      tone: "navy" as const,
    },
  ];

  return (
    <div className="joya-stagger relative flex w-full flex-col gap-5 pb-8 lg:gap-6">
      <DeviceScopeLoadingOverlay />

      <JoyaPageHeader
        eyebrow="Supervision · Consommation"
        image="/brand/images/wind-turbines-dusk.jpg"
        title={panel === "efficiency" ? "Efficacité énergétique" : "Consommation"}
        description={
          panel === "efficiency"
            ? "Repérez les consommations hors activité et les pistes d'économies."
            : "Combien votre site consomme, quand, et comment cela évolue dans le temps."
        }
        meta={
          activeSite?.name ? (
            <Badge
              tone="outline"
              size="lg"
              className="border-white/20 bg-white/12 text-white backdrop-blur-sm"
            >
              <Building2 className="h-3.5 w-3.5 text-coral" aria-hidden />
              {activeSite.name}
            </Badge>
          ) : null
        }
        actions={
          <>
            <label className="flex h-10 items-center gap-2 rounded-pill border border-white/20 bg-white/12 px-3.5 text-white backdrop-blur-sm transition-[border-color,box-shadow] focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
              <CalendarDays className="h-4 w-4 text-coral" aria-hidden />
              <span className="sr-only">Jour affiché</span>
              <input
                type="date"
                value={selectedDate}
                max={todayYmdLocal()}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent font-data text-[13px] font-medium text-white outline-none [color-scheme:dark]"
              />
            </label>
            {devices.length > 1 ? (
              <Select value={deviceId ?? undefined} onValueChange={setDeviceId}>
                <SelectTrigger className="h-10 w-[170px] rounded-pill border-white/20 bg-white/12 text-white" aria-label="Compteur">
                  <SelectValue placeholder="Compteur" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((d) => (
                    <SelectItem key={d.device_id} value={d.device_id}>
                      <span className="font-data">…{d.device_id.slice(-8)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="inline-flex h-10 items-center rounded-pill border border-white/20 bg-white/12 px-3.5 text-[13px] font-medium text-white backdrop-blur-sm">
                Compteur principal
              </span>
            )}
            <Button
              type="button"
              size="sm"
              className="h-10 bg-coral px-4 text-white hover:bg-coral-dark"
              disabled={monitorLoading}
              onClick={() => reload()}
            >
              <RefreshCw className={cn("h-4 w-4", monitorLoading && "animate-spin")} aria-hidden />
              Actualiser
            </Button>
          </>
        }
      />

      <div
        className="inline-flex w-full max-w-md self-start rounded-pill border border-line bg-white p-1 shadow-joya-xs"
        role="tablist"
        aria-label="Vues consommation"
      >
        {(
          [
            { id: "analyse" as const, label: "Consommation", icon: Zap },
            { id: "efficiency" as const, label: "Efficacité énergétique", icon: TrendingDown },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={panel === tab.id}
              className={cn(
                "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-pill px-3 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-base ease-joya focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy",
                panel === tab.id
                  ? "bg-navy text-white shadow-joya-sm"
                  : "text-slate-500 hover:bg-cream hover:text-navy",
              )}
              onClick={() => setPanel(tab.id)}
            >
              <Icon className={cn("h-4 w-4", panel === tab.id ? "text-white" : "text-slate-400")} aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      {panel === "efficiency" ? (
        <EnergyEfficiencySection
          siteId={activeSite?.id ?? monitor?.device.site_id ?? null}
          selectedDate={selectedDate}
          dateLabel={formatDayLabel(selectedDate)}
          hourly={dailyEnergy}
          seriesPoints={seriesPoints}
          latest={latest ?? null}
          lastTelemetryAt={monitor?.device.last_telemetry_at}
          isToday={isToday}
          hasMeter={devices.length > 0}
        />
      ) : !devices.length ? (
        <JoyaEmptyState
          className="rounded-2xl border border-dashed border-line-strong bg-white"
          icon={Gauge}
          title="Aucun compteur de consommation sur ce site"
          description="Les données apparaîtront ici dès qu'un compteur JOYA Edge sera rattaché à votre site."
        />
      ) : (
        <>
          <section aria-labelledby="conso-summary" className="flex flex-col gap-4">
            <JoyaSectionHeader
              icon={<Eye aria-hidden />}
              iconVariant="filled"
              title={<span id="conso-summary">Votre consommation en un coup d&apos;œil</span>}
              description="Énergie consommée aujourd&apos;hui, ce mois-ci et depuis l&apos;installation"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {summaryCards.map((card) => (
                <JoyaKpiCard
                  key={card.key}
                  size="lg"
                  variant={card.variant}
                  icon={card.icon}
                  tone={card.tone}
                  label={card.title}
                  value={fmtKwhNumber(card.value)}
                  unit={card.value != null ? "kWh" : undefined}
                  valueClassName={card.variant === "hot" ? "text-coral" : undefined}
                  footnote={card.subtitle}
                />
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-line bg-white p-5 shadow-joya-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-navy text-white">
                  <Timer className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 pt-0.5">
                  <h2 className="font-display text-[1.05rem] font-bold tracking-tight text-navy">
                    Mesures du compteur
                  </h2>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Analyseur d&apos;énergie triphasé · Instantané de la dernière
                    mesure
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
                  online
                    ? "bg-coral-wash text-coral"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    online ? "bg-coral" : "bg-slate-400",
                  )}
                />
                {online ? "En ligne" : "Hors ligne"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  lbl: "Site",
                  val: activeSite?.name ?? monitor?.device.site_name ?? "—",
                  mono: false,
                },
                {
                  lbl: "Fréquence réseau",
                  val: fmtMetric(latest?.frequency_hz, 1, "Hz"),
                  mono: true,
                },
                {
                  lbl: "Facteur de puissance",
                  val: fmtMetric(latest?.power_factor, 2),
                  mono: true,
                },
              ].map((item) => (
                <div
                  key={item.lbl}
                  className="rounded-[16px] bg-cream-2/90 px-4 py-3"
                >
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    {item.lbl}
                  </p>
                  <p
                    className={cn(
                      "mt-1 truncate font-display text-[1.05rem] font-bold text-navy",
                      item.mono && "tabular-nums",
                    )}
                  >
                    {item.val}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {monitorLoading && !monitor ? (
            <JoyaLoadingState label="Chargement des courbes…" className="min-h-[16rem]" />
          ) : (
            <>
              <section className="flex flex-col gap-4">
                <JoyaSectionHeader
                  icon={<Activity aria-hidden />}
                  iconVariant="filled"
                  title="Évolution sur la journée"
                  description="Grandeurs électriques · intervalle de 15 min"
                />
                <div className="grid gap-4 lg:grid-cols-2" key={selectedDate}>
                  <MetricLinePanel
                    title="Puissance active"
                    unit="kW"
                    decimals={3}
                    rows={activeRows}
                    mode={modeActive}
                    onModeChange={setModeActive}
                    hourAxis={activeSeries.resolution === "hour"}
                  />
                  <MetricLinePanel
                    title="Tension"
                    unit="V"
                    decimals={0}
                    rows={voltageRows}
                    mode={modeVoltage}
                    onModeChange={setModeVoltage}
                    hourAxis={voltageSeries.resolution === "hour"}
                  />
                  <MetricLinePanel
                    title="Courant"
                    unit="A"
                    decimals={2}
                    rows={currentRows}
                    mode={modeCurrent}
                    onModeChange={setModeCurrent}
                    hourAxis={currentSeries.resolution === "hour"}
                  />
                  <MetricLinePanel
                    title="Facteur de puissance"
                    unit="cos φ"
                    decimals={2}
                    rows={pfRows}
                    mode="gen"
                    showPhaseToggle={false}
                    hourAxis={pfSeries.resolution === "hour"}
                  />
                </div>
              </section>

              <DailyEnergyBarChart
                data={dailyEnergy}
                dateLabel={formatDayLabel(selectedDate)}
                dayTotal={todayCardKwh}
              />

              <ConsumptionHistorySection
                deviceId={deviceId}
                trackingSince={monitor?.consumption.tracking_since}
              />
            </>
          )}

          <ClientPowerOutageHoursChart
            trackingSince={monitor?.consumption.tracking_since}
          />

          {monitor?.device.last_telemetry_at ? (
            <p className="text-center font-data text-[11px] text-ink-faint">
              Dernière mesure · {new Date(monitor.device.last_telemetry_at).toLocaleString("fr-FR")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
