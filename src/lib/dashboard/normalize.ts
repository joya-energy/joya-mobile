import type {
  ClientDashboardApiResponse,
  ClientDashboardData,
  DashboardKpi,
  DashboardKpiApiItem,
  EnergyByYearApiItem,
  EnergyMonthApiItem,
  HourlyProductionPoint,
  ProductionHourlyComparison,
  DashboardAlert,
  DashboardAlertSeverity,
  DashboardEnodeSync,
  DashboardEscoContract,
  SavingsComparisonPoint,
  YearlyEnergySeries,
  YearlySavingsComparisonSeries,
} from "@/types/dashboard";
import {
  normalizeSavingsMonths,
  type SavingsComparisonByYearApiItem,
} from "./savings-comparison";
import { DEFAULT_TREND_LABEL } from "@/lib/dashboard/ui-constants";
import {
  clientDashboardChartNumber,
  clientDashboardOptionalNumber,
  clientDashboardOptionalText,
  clientDashboardText,
} from "./defaults";
import { normalizeEnergyMonths, sortEnergyByYear } from "./energy";
import { toClientDashboardSite } from "./client-dashboard-site";
import { normalizeInverters } from "./inverters";
import {
  unconfiguredEscoContract,
} from "./empty-dashboard-data";

function normalizeKpiList(
  list: DashboardKpiApiItem[],
  idPrefix: string,
  withDefaultTrend: boolean,
): DashboardKpi[] {
  return list.map((item, index) => {
    const kpi: DashboardKpi = {
      id: item.id?.trim() || `${idPrefix}-${index}`,
      label: clientDashboardText(item.label),
      displayValue: clientDashboardText(item.displayValue ?? item.display_value),
      footnote: clientDashboardOptionalText(item.footnote),
    };
    if (item.trend !== undefined || withDefaultTrend) {
      const trendValue = clientDashboardOptionalNumber(item.trend?.value);
      kpi.trend = {
        value: trendValue ?? 0,
        label: clientDashboardText(item.trend?.label ?? DEFAULT_TREND_LABEL),
      };
    }
    return kpi;
  });
}

function normalizeHourlyPointList(
  list: Array<{ hour?: number; value_kw?: number; valueKw?: number }>,
): HourlyProductionPoint[] {
  return list
    .map((p, index) => ({
      hour: clientDashboardChartNumber(p.hour ?? index),
      valueKw: clientDashboardChartNumber(p.valueKw ?? p.value_kw),
    }))
    .sort((a, b) => a.hour - b.hour);
}

function emptyHourlyComparison(): ProductionHourlyComparison {
  return {
    today: Array.from({ length: 24 }, (_, hour) => ({ hour, valueKw: 0 })),
    yesterday: Array.from({ length: 24 }, (_, hour) => ({ hour, valueKw: 0 })),
  };
}

function normalizeProductionHourly(
  raw: ClientDashboardApiResponse,
): ProductionHourlyComparison {
  const source = raw.productionHourly ?? raw.production_hourly;
  if (!source) return emptyHourlyComparison();

  if (Array.isArray(source)) {
    return {
      today: normalizeHourlyPointList(source),
      yesterday: emptyHourlyComparison().yesterday,
    };
  }

  return {
    today: normalizeHourlyPointList(source.today ?? []),
    yesterday: normalizeHourlyPointList(source.yesterday ?? []),
  };
}

function normalizeEnergyByYear(raw: ClientDashboardApiResponse): YearlyEnergySeries[] {
  const byYear = raw.energyByYear ?? raw.energy_by_year;

  if (byYear) {
    if (Array.isArray(byYear)) {
      return sortEnergyByYear(
        byYear
          .map((entry: EnergyByYearApiItem) => ({
            year: clientDashboardChartNumber(entry.year ?? new Date().getFullYear()),
            months: normalizeEnergyMonths(entry.months ?? []),
          }))
          .filter((s) => s.months.length > 0),
      );
    }

    const record = byYear as Record<string, EnergyMonthApiItem[]>;
    return sortEnergyByYear(
      Object.entries(record).map(([yearKey, months]) => ({
        year: clientDashboardChartNumber(Number(yearKey)),
        months: normalizeEnergyMonths(months),
      })),
    );
  }

  return [];
}

function normalizeSavingsComparison(
  raw: ClientDashboardApiResponse,
): SavingsComparisonPoint[] {
  const list = raw.savingsComparison ?? raw.savings_comparison ?? [];
  return normalizeSavingsMonths(list);
}

function normalizeSavingsComparisonByYear(
  raw: ClientDashboardApiResponse,
): YearlySavingsComparisonSeries[] {
  const source =
    raw.savingsComparisonByYear ?? raw.savings_comparison_by_year ?? [];

  if (Array.isArray(source) && source.length > 0) {
    return [...source]
      .map((entry: SavingsComparisonByYearApiItem) => ({
        year: clientDashboardChartNumber(
          entry.year ?? new Date().getFullYear(),
        ),
        months: normalizeSavingsMonths(entry.months ?? []),
      }))
      .filter((s) => s.months.length > 0)
      .sort((a, b) => b.year - a.year);
  }

  const flat = normalizeSavingsComparison(raw);
  if (flat.length === 0) return [];

  const year = new Date().getFullYear();
  return [{ year, months: flat }];
}

function normalizeAlertSeverity(value: unknown): DashboardAlertSeverity {
  if (value === "warning" || value === "error" || value === "info") return value;
  return "info";
}

function normalizeAlerts(raw: ClientDashboardApiResponse): DashboardAlert[] {
  const list = raw.alerts ?? [];
  return list.map((item, index) => ({
    id: clientDashboardText(item.id ?? `alert-${index}`),
    severity: normalizeAlertSeverity(item.severity),
    title: clientDashboardText(item.title),
    message: clientDashboardText(item.message),
    timeLabel: clientDashboardOptionalText(item.timeLabel ?? item.time_label),
    type: clientDashboardOptionalText(item.type),
    sourceLabel: clientDashboardOptionalText(
      item.sourceLabel ?? item.source_label,
    ),
    sourceType:
      item.sourceType === "asset" ||
      item.sourceType === "company" ||
      item.sourceType === "system"
        ? item.sourceType
        : item.source_type === "asset" ||
            item.source_type === "company" ||
            item.source_type === "system"
          ? item.source_type
          : undefined,
    assetId: clientDashboardOptionalText(item.assetId ?? item.asset_id),
  }));
}

function normalizeEscoContract(raw: ClientDashboardApiResponse): DashboardEscoContract {
  const c = raw.esco_contract;
  if (!c) return unconfiguredEscoContract;

  return {
    configured: c.configured === true,
    status: c.status ?? "pending",
    statusLabel: clientDashboardText(c.status_label ?? "Non configuré"),
    monthlyAmountTnd:
      c.monthly_amount_tnd != null
        ? clientDashboardChartNumber(c.monthly_amount_tnd)
        : null,
    totalMonths: c.total_months ?? 0,
    elapsedMonths: c.elapsed_months ?? 0,
    durationPercent: Math.min(100, Math.max(0, c.duration_percent ?? 0)),
    totalYears: c.total_years ?? 0,
    years: (c.years ?? []).map((y) => ({
      label: clientDashboardText(y.label),
      months: (y.months ?? []).map((m) => ({ filled: m.filled === true })),
    })),
    startLabel: clientDashboardText(c.start_label ?? "Début"),
    endLabel: clientDashboardText(c.end_label),
    monthsUntilEnd: c.months_until_end ?? 0,
    periodYearsLabel: clientDashboardText(c.period_years_label),
    elapsedMonthsLabel: clientDashboardText(c.elapsed_months_label),
    elapsedHumanLabel: clientDashboardText(c.elapsed_human_label),
    monthlyPerformancePercent:
      c.monthly_performance_percent != null &&
      Number.isFinite(c.monthly_performance_percent)
        ? Math.round(c.monthly_performance_percent)
        : null,
    monthlyPerformanceMonthLabel:
      clientDashboardOptionalText(c.monthly_performance_month_label) ?? null,
  };
}

function normalizeEnodeSync(raw: ClientDashboardApiResponse): DashboardEnodeSync {
  const sync = raw.enode_sync;
  return {
    canRefresh: sync?.can_refresh !== false,
    nextEnodeRefreshAt: sync?.next_enode_refresh_at ?? null,
    cooldownSecondsRemaining: Math.max(
      0,
      sync?.cooldown_seconds_remaining ?? 0,
    ),
  };
}

import type { DashboardScopeSite } from "@/types/dashboard";

function normalizeScopeSites(
  raw: ClientDashboardApiResponse,
): DashboardScopeSite[] {
  const rows = raw.scopeSites ?? raw.scope_sites ?? [];
  return rows
    .filter((row) => row.id)
    .map((row) => ({
      id: String(row.id),
      name: String(row.name ?? "Site"),
      status: String(row.status ?? "draft"),
      inverterCount: Number(row.inverterCount ?? row.inverter_count ?? 0),
    }));
}

/** Map API JSON to the shape consumed by dashboard components. */
export function toClientDashboardData(
  raw: ClientDashboardApiResponse,
): ClientDashboardData {
  const installationRaw = raw.installationKpis ?? raw.installation_kpis ?? [];

  return {
    scopeSiteId: raw.scopeSiteId ?? raw.scope_site_id ?? null,
    scopeSites: normalizeScopeSites(raw),
    site: toClientDashboardSite(raw.site),
    inverters: normalizeInverters(raw.inverters),
    installationKpis: normalizeKpiList(installationRaw, "installation", false),
    kpis: normalizeKpiList(raw.kpis ?? [], "kpi", false),
    productionHourly: normalizeProductionHourly(raw),
    energyByYear: normalizeEnergyByYear(raw),
    savingsComparison: normalizeSavingsComparison(raw),
    savingsComparisonByYear: normalizeSavingsComparisonByYear(raw),
    escoContract: normalizeEscoContract(raw),
    alerts: normalizeAlerts(raw),
    enodeSync: normalizeEnodeSync(raw),
  };
}
