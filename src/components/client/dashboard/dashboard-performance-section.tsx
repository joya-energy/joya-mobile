import { useMemo } from "react";
import { Text, View } from "react-native";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  Calendar,
  DollarSign,
  Heart,
  Leaf,
  Percent,
  Shield,
  Sun,
  TrendingUp,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import type { ClientDashboardData } from "@/types/dashboard";
import { useIntradayPower } from "@/hooks/use-intraday-power";
import { usableTodayProductionKwh } from "@/lib/dashboard/intraday-api";
import { useEdgeConsumption } from "@/hooks/use-edge-consumption";
import {
  buildAnnualEnergyFlowMetrics,
  buildConsumptionMetrics,
  buildFinancialMetrics,
  buildProductionMetrics,
  formatPerformanceUpdateLine,
  getCurrentYearProductionKwh,
  type HighlightMetric,
} from "@/lib/dashboard/dashboard-performance-metrics";
import { MetricHighlightCard } from "./metric-highlight-card";
import { JoyaEyebrow, JoyaSectionHeader } from "@/components/joya";

const PRODUCTION_ICONS: Record<string, LucideIcon> = {
  daily: Sun,
  monthly: Calendar,
  annual: Activity,
  total: Zap,
};

const CONSUMPTION_ICONS: Record<string, LucideIcon> = {
  "cons-daily": Zap,
  "cons-monthly": Calendar,
  "cons-annual": Activity,
};

const FINANCIAL_ICONS: Record<string, LucideIcon> = {
  "net-gain": Heart,
  "gross-savings": DollarSign,
  "esco-fee": Shield,
  co2: Leaf,
};

const FLOW_ICONS: Record<string, LucideIcon> = {
  "flow-auto": Percent,
  "flow-export": ArrowUpFromLine,
  "flow-import": ArrowDownToLine,
};

type DashboardPerformanceSectionProps = {
  data: ClientDashboardData;
  companyId?: string;
};

function MetricSection({
  index,
  title,
  description,
  metrics,
  icons,
  indexVariant = "filled",
}: {
  index: number;
  title: string;
  description?: string;
  metrics: HighlightMetric[];
  icons: Record<string, LucideIcon>;
  indexVariant?: "wash" | "filled";
}) {
  return (
    <View className="min-w-0">
      <JoyaSectionHeader
        index={index}
        indexVariant={indexVariant}
        title={title}
        description={description}
        className="mb-4"
      />
      <View className="flex-row flex-wrap gap-3">
        {metrics.map((metric) => {
          const Icon = icons[metric.id] ?? TrendingUp;
          return (
            <View key={metric.id} className="min-w-[46%] flex-1">
              <MetricHighlightCard metric={metric} icon={Icon} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function trackingSinceLabelFr(iso: string | null | undefined): string | null {
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

function finiteOrZero(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return Math.max(0, value);
}

function positiveOrNull(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function DashboardPerformanceSection({
  data,
  companyId,
}: DashboardPerformanceSectionProps) {
  const { data: intraday } = useIntradayPower({
    companyId,
    enabled: true,
    siteScopeOnly: true,
  });
  const { monitor: edgeMonitor } = useEdgeConsumption({ enabled: true });

  const dailyTotals = intraday?.dailyTotals;
  const isToday = intraday?.date === new Date().toLocaleDateString("en-CA");
  const todayProductionKwh = usableTodayProductionKwh({
    isToday,
    siteStatus: data.site.status,
    series: intraday?.series,
    productionKwh: dailyTotals?.productionKwh,
  });

  const productionMetrics = buildProductionMetrics(data, {
    dailyProductionKwh: todayProductionKwh ?? undefined,
    dailySavingsTnd:
      todayProductionKwh != null ? dailyTotals?.savingsTnd : undefined,
  });

  const yearLabel =
    edgeMonitor?.consumption.year?.trim() ||
    String(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Tunis",
        year: "numeric",
      }).format(new Date()),
    );

  const yearLoadKwh = positiveOrNull(edgeMonitor?.consumption.year_load_kwh);
  const meterImportKwh = positiveOrNull(edgeMonitor?.consumption.year_kwh);
  const allTimeLoadKwh = positiveOrNull(
    edgeMonitor?.consumption.all_time_kwh,
  );
  const loadYtdKwh = yearLoadKwh ?? allTimeLoadKwh;

  const consumptionMetrics = useMemo(() => {
    const annualKwh = loadYtdKwh ?? meterImportKwh;
    const annualIsYtd = yearLoadKwh != null || meterImportKwh != null;
    return buildConsumptionMetrics({
      todayKwh: edgeMonitor?.consumption.today_kwh,
      monthKwh: edgeMonitor?.consumption.month_kwh,
      annualKwh,
      annualIsYtd,
      yearLabel,
      trackingSinceLabel: trackingSinceLabelFr(
        edgeMonitor?.consumption.tracking_since,
      ),
    });
  }, [
    edgeMonitor?.consumption.month_kwh,
    edgeMonitor?.consumption.today_kwh,
    edgeMonitor?.consumption.tracking_since,
    loadYtdKwh,
    meterImportKwh,
    yearLabel,
    yearLoadKwh,
  ]);

  const financialMetrics = buildFinancialMetrics(data, data.escoContract);

  const annualFlowMetrics = useMemo(() => {
    const dailyExport = finiteOrZero(
      edgeMonitor?.consumption.year_daily_export_kwh,
    );
    const dailyImport = finiteOrZero(
      edgeMonitor?.consumption.year_daily_import_kwh,
    );
    const dailyAuto = finiteOrZero(
      edgeMonitor?.consumption.year_daily_auto_kwh,
    );
    const flowDays = edgeMonitor?.consumption.year_daily_flow_days ?? 0;
    const hasDailyFlow =
      flowDays > 0 && (dailyExport != null || dailyImport != null);
    const annualProductionKwh =
      dailyAuto != null && dailyExport != null
        ? dailyAuto + dailyExport
        : getCurrentYearProductionKwh(data);

    return buildAnnualEnergyFlowMetrics({
      yearLabel,
      annualProductionKwh,
      annualAutoKwh: hasDailyFlow ? dailyAuto : null,
      annualExportKwh: hasDailyFlow ? dailyExport ?? 0 : null,
      annualImportKwh: hasDailyFlow ? dailyImport ?? 0 : null,
      flowDayCount: hasDailyFlow ? flowDays : null,
    });
  }, [data, edgeMonitor?.consumption, yearLabel]);

  const updateLine = formatPerformanceUpdateLine(data.site);

  return (
    <View className="rounded-[28px] border border-line bg-white shadow-joya-sm">
      <View className="gap-2 px-5 pb-2 pt-5">
        <View>
          <JoyaEyebrow>Performance</JoyaEyebrow>
          <Text className="mt-1.5 font-display text-[1.65rem] font-bold tracking-tight text-navy">
            Vue d'ensemble
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
          <Text className="font-data text-[12px] text-ink-faint">
            Mis à jour à {updateLine}
          </Text>
        </View>
      </View>

      <View className="gap-8 p-5 pt-4">
        <MetricSection
          index={1}
          title="Économies énergétiques"
          description="Production solaire et gains associés"
          metrics={productionMetrics}
          icons={PRODUCTION_ICONS}
        />
        <MetricSection
          index={2}
          title="Consommation"
          description="Énergie consommée par le site"
          metrics={consumptionMetrics}
          icons={CONSUMPTION_ICONS}
        />
        <MetricSection
          index={3}
          title="Bilan financier & environnemental"
          description="Ce que votre installation vous rapporte"
          metrics={financialMetrics}
          icons={FINANCIAL_ICONS}
        />
        <MetricSection
          index={4}
          title="Flux énergétique annuel"
          description="Autoconsommation, injection et soutirage réseau"
          metrics={annualFlowMetrics}
          icons={FLOW_ICONS}
        />
      </View>
    </View>
  );
}
