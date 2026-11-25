import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  Activity,
  Building2,
  CalendarRange,
  Eye,
  Gauge,
  History,
  RefreshCw,
  Timer,
  TrendingDown,
  Zap,
} from "lucide-react-native";
import { EnergyEfficiencySection } from "@/components/client/consumption/energy-efficiency-section";
import { translateUserMessage } from "@/lib/user-messages";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { DeviceScopeLoadingOverlay } from "@/components/client/device-scope-loading-overlay";
import { useEdgeConsumption } from "@/hooks/use-edge-consumption";
import {
  JoyaEmptyState,
  JoyaErrorState,
  JoyaKpiCard,
  JoyaLoadingState,
  JoyaPageHeader,
  JoyaSectionHeader,
} from "@/components/joya";
import { PillSelect } from "@/components/client/onboarding-info/pill-select";
import { DatePill } from "@/components/client/consumption/date-pill";
import { cn } from "@/lib/utils";
import {
  DailyEnergyBarChart,
  MetricLinePanel,
  TABULAR,
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
import { joyaColors } from "@/theme/colors";

const HEADER_IMAGE = require("../../../../assets/brand/images/wind-turbines-dusk.jpg");

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

function isDeviceOnline(
  device: { status: string; last_seen_at: string | null } | undefined,
): boolean {
  if (!device) return false;
  if (device.status === "active") return true;
  return Boolean(
    device.last_seen_at &&
      Date.now() - new Date(device.last_seen_at).getTime() < 15 * 60 * 1000,
  );
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
  const totalCardKwh = monitor?.consumption.all_time_kwh ?? null;

  const online = isDeviceOnline(monitor?.device);

  if (devicesLoading && !monitor) {
    return <ConsumptionSkeleton />;
  }

  if (error && !monitor) {
    return (
      <JoyaErrorState
        className="rounded-2xl border border-line bg-white"
        description={translateUserMessage(
          error.message,
          "Impossible de charger les données.",
        )}
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

  const meterTiles = [
    {
      lbl: "Puissance active totale",
      val: fmtMetric(latest?.active_power_total_kw, 3, "kW"),
    },
    {
      lbl: "Puissance apparente totale",
      val: fmtMetric(latest?.apparent_power_total_kva, 3, "kVA"),
    },
    {
      lbl: "Puissance réactive totale",
      val: fmtMetric(latest?.reactive_power_total_kvar, 3, "kVAR"),
    },
    {
      lbl: "Fréquence réseau",
      val: fmtMetric(latest?.frequency_hz, 1, "Hz"),
    },
  ];

  const tabs = [
    { id: "analyse" as const, label: "Consommation", icon: Zap },
    {
      id: "efficiency" as const,
      label: "Efficacité énergétique",
      icon: TrendingDown,
    },
  ];

  return (
    <View className="relative w-full flex-col gap-5 pb-8">
      <DeviceScopeLoadingOverlay />

      <JoyaPageHeader
        eyebrow="Supervision · Consommation"
        image={HEADER_IMAGE}
        title={panel === "efficiency" ? "Efficacité énergétique" : "Consommation"}
        description={
          panel === "efficiency"
            ? "Repérez les consommations hors activité et les pistes d'économies."
            : "Combien votre site consomme, quand, et comment cela évolue dans le temps."
        }
        meta={
          activeSite?.name ? (
            <View className="h-7 flex-row items-center gap-1.5 self-start rounded-full border border-white/20 bg-white/10 px-3">
              <Building2 size={14} color={joyaColors.coral} />
              <Text
                numberOfLines={1}
                className="shrink text-[13px] font-medium text-white"
              >
                {activeSite.name}
              </Text>
            </View>
          ) : null
        }
        actions={
          <View className="flex-row flex-wrap items-center gap-2">
            <DatePill
              tone="dark"
              label="Jour affiché"
              value={selectedDate}
              max={todayYmdLocal()}
              onChange={setSelectedDate}
            />
            {devices.length > 1 ? (
              <PillSelect
                label="Compteur"
                className="h-10 w-[170px] border-white/20 bg-white"
                value={deviceId ?? ""}
                options={devices.map((d) => ({
                  value: d.device_id,
                  label: `…${d.device_id.slice(-8)}`,
                }))}
                onChange={(id) => setDeviceId(id)}
              />
            ) : (
              <View className="h-10 items-center justify-center rounded-full border border-white/20 bg-white/10 px-3.5">
                <Text className="text-[13px] font-medium text-white">
                  Compteur principal
                </Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Actualiser"
              disabled={monitorLoading}
              onPress={() => reload()}
              className={cn(
                "h-10 flex-row items-center gap-2 rounded-2xl bg-coral px-4 active:bg-coral-dark",
                monitorLoading && "opacity-60",
              )}
            >
              {monitorLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <RefreshCw size={16} color="#fff" />
              )}
              <Text className="text-sm font-semibold text-white">Actualiser</Text>
            </Pressable>
          </View>
        }
      />

      <View
        accessibilityRole="tablist"
        accessibilityLabel="Vues consommation"
        className="w-full flex-row self-start rounded-full border border-line bg-white p-1 shadow-joya-xs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = panel === tab.id;
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setPanel(tab.id)}
              className={cn(
                "h-10 flex-1 flex-row items-center justify-center gap-2 rounded-full px-3",
                active && "bg-navy shadow-joya-sm",
              )}
            >
              <Icon size={16} color={active ? "#fff" : "#94a3b8"} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                className={cn(
                  "shrink text-[13px] font-semibold",
                  active ? "text-white" : "text-slate-500",
                )}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
      ) : (
        <>
          {!devices.length ? (
            <JoyaEmptyState
              className="rounded-2xl border border-dashed border-line-strong bg-white"
              icon={Gauge}
              title="Aucun compteur de consommation sur ce site"
              description="Les données apparaîtront ici dès qu'un compteur JOYA Edge sera rattaché à votre site."
            />
          ) : (
            <>
              <View className="flex-col gap-4">
                <JoyaSectionHeader
                  className="mb-0"
                  icon={<Eye size={18} color="#fff" />}
                  iconVariant="filled"
                  title="Votre consommation en un coup d'œil"
                  description="Énergie consommée aujourd'hui, ce mois-ci et depuis l'installation"
                />
                <View className="flex-col gap-3">
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
                      valueClassName={
                        card.variant === "hot" ? "text-coral" : undefined
                      }
                      footnote={card.subtitle}
                    />
                  ))}
                </View>
              </View>

              <View className="rounded-[22px] border border-line bg-white p-5 shadow-joya-sm">
                <View className="flex-row flex-wrap items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 flex-row items-start gap-3">
                    <View className="h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-navy">
                      <Timer size={20} color="#fff" />
                    </View>
                    <View className="min-w-0 flex-1 pt-0.5">
                      <Text className="font-display text-[17px] font-bold tracking-tight text-navy">
                        Mesures du compteur
                      </Text>
                      <Text className="mt-0.5 text-[13px] text-ink-muted">
                        Analyseur d&apos;énergie triphasé · Instantané de la
                        dernière mesure
                        {activeSite?.name || monitor?.device.site_name
                          ? ` · ${activeSite?.name ?? monitor?.device.site_name}`
                          : ""}
                      </Text>
                    </View>
                  </View>
                  <View
                    className={cn(
                      "flex-row items-center gap-1.5 rounded-full px-2.5 py-1",
                      online ? "bg-coral-wash" : "bg-slate-100",
                    )}
                  >
                    <View
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        online ? "bg-coral" : "bg-slate-400",
                      )}
                    />
                    <Text
                      className={cn(
                        "text-[12px] font-semibold",
                        online ? "text-coral" : "text-slate-500",
                      )}
                    >
                      {online ? "En ligne" : "Hors ligne"}
                    </Text>
                  </View>
                </View>
                <View className="mt-4 flex-col gap-2">
                  {meterTiles.map((item) => (
                    <View
                      key={item.lbl}
                      className="rounded-[16px] bg-cream-2 px-4 py-3"
                    >
                      <Text className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                        {item.lbl}
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-1 font-display text-[17px] font-bold text-navy"
                        style={TABULAR}
                      >
                        {item.val}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {monitorLoading && !monitor ? (
                <JoyaLoadingState
                  label="Chargement des courbes…"
                  className="min-h-[256px]"
                />
              ) : (
                <>
                  <View className="flex-col gap-4">
                    <JoyaSectionHeader
                      className="mb-0"
                      icon={<Activity size={18} color="#fff" />}
                      iconVariant="filled"
                      title="Évolution sur la journée"
                      description="Grandeurs électriques · intervalle de 15 min"
                    />
                    <View key={selectedDate} className="flex-col gap-4">
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
                    </View>
                  </View>

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

              {monitor?.device.last_telemetry_at ? (
                <Text className="text-center font-data text-[11px] text-ink-faint">
                  Dernière mesure ·{" "}
                  {new Date(monitor.device.last_telemetry_at).toLocaleString(
                    "fr-FR",
                  )}
                </Text>
              ) : null}
            </>
          )}

          <ClientPowerOutageHoursChart
            trackingSince={monitor?.consumption.tracking_since}
          />
        </>
      )}
    </View>
  );
}
