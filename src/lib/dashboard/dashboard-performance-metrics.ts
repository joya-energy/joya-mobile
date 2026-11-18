import {
  DASHBOARD_CO2_KG_PER_KWH,
  DASHBOARD_TARIFF_SAVINGS_KPI_DT,
  dashboardSavingsKpiFootnote,
} from "@/lib/dashboard/business-constants";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import {
  deriveMonthlyEnergyMetrics,
  formatMonthlyCo2Kg,
  formatMonthlyEnergyKwh,
} from "@/lib/dashboard/monthly-energy-metrics";
import { formatTndSavings } from "@/lib/format/currency";
import type {
  ClientDashboardData,
  ClientDashboardSite,
  DashboardEscoContract,
  DashboardKpi,
  YearlyEnergySeries,
} from "@/types/dashboard";

export type HighlightMetric = {
  id: string;
  label: string;
  value: string;
  footnote?: string;
  badge?: string;
  accent: "orange" | "green" | "blue" | "yellow" | "teal";
  valueTone?: "default" | "positive";
  /** 0–100, shown as a thin bar (autoconsommation). */
  progress?: number;
};

function currentMonthBadge(timeZone = "Africa/Tunis"): string {
  const raw = new Date().toLocaleDateString("fr-FR", {
    month: "short",
    timeZone,
  });
  const cleaned = raw.replace(".", "").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function parseInstalledKwc(label: string): number | undefined {
  const match = label.replace(",", ".").match(/([\d.]+)\s*kWc?/i);
  if (!match) return undefined;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function findKpi(kpis: DashboardKpi[], id: string): DashboardKpi | undefined {
  return kpis.find((k) => k.id === id);
}

function sumYearKwh(series: YearlyEnergySeries | undefined): number {
  if (!series) return 0;
  return series.months.reduce((s, m) => s + Math.max(0, m.valueKw), 0);
}

/**
 * Prefer the calendar year; if it has no production yet, use the newest year
 * that does (energyByYear is sorted newest-first from the API).
 */
function currentYearSeries(
  energyByYear: YearlyEnergySeries[],
): YearlyEnergySeries | undefined {
  if (!energyByYear.length) return undefined;
  const year = new Date().getFullYear();
  const exact = energyByYear.find((s) => s.year === year);
  if (exact && sumYearKwh(exact) > 0) return exact;
  for (const series of energyByYear) {
    if (sumYearKwh(series) > 0) return series;
  }
  return exact ?? energyByYear[0];
}

const MWH_FR_OPTIONS = {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
} as const;

function formatKwhValue(kwh: number): string {
  if (kwh >= 1_000_000) {
    return `${(kwh / 1_000_000).toLocaleString("fr-FR", MWH_FR_OPTIONS)} MWh`;
  }
  if (kwh >= 1_000) {
    return `${(kwh / 1_000).toLocaleString("fr-FR", MWH_FR_OPTIONS)} MWh`;
  }
  return formatMonthlyEnergyKwh(kwh);
}

function tndFootnote(tnd: number, suffix = ""): string {
  const amount = formatTndSavings(tnd).replace(/\u00a0TND$/, "");
  return `≈ ${amount} TND${suffix ? ` ${suffix}` : ""}`;
}

/** Calendar-year production (kWh) from dashboard energy series. */
export function getCurrentYearProductionKwh(
  data: ClientDashboardData,
): number | null {
  const series = currentYearSeries(data.energyByYear);
  if (!series) return null;
  const total = sumYearKwh(series);
  return total > 0 ? total : null;
}

function currentMonthKwh(series: YearlyEnergySeries | undefined): number {
  if (!series) return 0;
  const idx = new Date().getMonth();
  const month = series.months[idx];
  return month ? Math.max(0, month.valueKw) : 0;
}

/**
 * Last fully elapsed calendar month (Africa/Tunis), skipping empty months.
 * Gain net must not compare a partial month of kWh to a full monthly fee.
 */
function lastClosedMonthKwh(
  energyByYear: YearlyEnergySeries[],
  timeZone = "Africa/Tunis",
): number {
  const ymd = new Date().toLocaleDateString("en-CA", { timeZone });
  let year = Number(ymd.slice(0, 4));
  let monthIdx = Number(ymd.slice(5, 7)) - 2;
  if (monthIdx < 0) {
    monthIdx = 11;
    year -= 1;
  }
  for (let step = 0; step < 24; step += 1) {
    const series = energyByYear.find((s) => s.year === year);
    const kwh = series?.months[monthIdx]
      ? Math.max(0, series.months[monthIdx]!.valueKw)
      : 0;
    if (kwh > 0) return kwh;
    monthIdx -= 1;
    if (monthIdx < 0) {
      monthIdx = 11;
      year -= 1;
    }
  }
  return 0;
}

export function buildProductionMetrics(
  data: ClientDashboardData,
  options?: {
    dailyProductionKwh?: number;
    dailySavingsTnd?: number;
  },
): HighlightMetric[] {
  const yearSeries = currentYearSeries(data.energyByYear);
  const totalKpi = findKpi(data.kpis, "total-production");
  const dailyKwh = options?.dailyProductionKwh ?? 0;
  const dailyDerived = deriveMonthlyEnergyMetrics(dailyKwh);
  const monthlyKwh = currentMonthKwh(yearSeries);
  const monthlyDerived = deriveMonthlyEnergyMetrics(monthlyKwh);
  const annualKwh = sumYearKwh(yearSeries);

  return [
    {
      id: "daily",
      label: "Écon. financières du jour",
      value:
        dailyKwh > 0
          ? formatTndSavings(options?.dailySavingsTnd ?? dailyDerived.savingsTnd)
          : CLIENT_DASHBOARD_MISSING,
      footnote:
        dailyKwh > 0
          ? `${formatMonthlyEnergyKwh(dailyKwh)} produits aujourd'hui`
          : "Jour en cours",
      badge: "Auj.",
      accent: "orange",
    },
    {
      id: "monthly",
      label: "Économies mensuelles",
      value:
        monthlyKwh > 0 ? formatMonthlyEnergyKwh(monthlyKwh) : CLIENT_DASHBOARD_MISSING,
      footnote:
        monthlyKwh > 0 ? tndFootnote(monthlyDerived.savingsTnd, "ce mois") : undefined,
      badge: currentMonthBadge(),
      accent: "green",
    },
    {
      id: "annual",
      label: "Économies annuelles",
      value: annualKwh > 0 ? formatKwhValue(annualKwh) : CLIENT_DASHBOARD_MISSING,
      footnote:
        annualKwh > 0
          ? tndFootnote(annualKwh * DASHBOARD_TARIFF_SAVINGS_KPI_DT, "cette année")
          : yearSeries
            ? String(yearSeries.year)
            : undefined,
      badge: yearSeries ? String(yearSeries.year) : undefined,
      accent: "blue",
    },
    {
      id: "total",
      label: "Économies totales",
      value: totalKpi?.displayValue ?? CLIENT_DASHBOARD_MISSING,
      footnote: "Cumul depuis l'installation",
      badge: "Cumul",
      accent: "yellow",
    },
  ];
}

export function buildFinancialMetrics(
  data: ClientDashboardData,
  escoContract: DashboardEscoContract,
): HighlightMetric[] {
  const savingsKpi = findKpi(data.kpis, "savings");
  const co2Kpi = findKpi(data.kpis, "co2");
  const ytdKwh = getCurrentYearProductionKwh(data);
  const co2Display =
    co2Kpi?.displayValue &&
    co2Kpi.displayValue !== CLIENT_DASHBOARD_MISSING
      ? co2Kpi.displayValue
      : ytdKwh != null
        ? formatMonthlyCo2Kg(ytdKwh * DASHBOARD_CO2_KG_PER_KWH)
        : CLIENT_DASHBOARD_MISSING;
  const monthSavingsTnd =
    lastClosedMonthKwh(data.energyByYear) * DASHBOARD_TARIFF_SAVINGS_KPI_DT;
  const escoMonthly =
    escoContract.monthlyAmountTnd != null &&
    Number.isFinite(escoContract.monthlyAmountTnd)
      ? Math.max(0, escoContract.monthlyAmountTnd)
      : 0;
  const netMonthly = Math.max(0, monthSavingsTnd - escoMonthly);

  const co2TonnesFootnote = co2Kpi?.footnote?.trim();

  return [
    {
      id: "net-gain",
      label: "Gain net client / mois",
      value: formatTndSavings(netMonthly),
      footnote: "Économies du dernier mois clos − redevance",
      badge: "Net",
      accent: netMonthly >= 0 ? "green" : "orange",
    },
    {
      id: "gross-savings",
      label: "Économies brutes totales",
      value: savingsKpi?.displayValue ?? CLIENT_DASHBOARD_MISSING,
      footnote: savingsKpi?.footnote?.trim() || dashboardSavingsKpiFootnote(),
      badge: "Brut",
      accent: "orange",
    },
    {
      id: "esco-fee",
      label: "Redevance Joya Energy",
      value:
        escoContract.monthlyAmountTnd != null
          ? formatTndSavings(escoContract.monthlyAmountTnd)
          : CLIENT_DASHBOARD_MISSING,
      footnote: "Loyer mensuel de l'installation",
      badge: "ESCO",
      accent: "blue",
    },
    {
      id: "co2",
      label: "CO₂ évité",
      value: co2Display,
      footnote:
        co2TonnesFootnote ||
        (ytdKwh != null
          ? `${DASHBOARD_CO2_KG_PER_KWH.toLocaleString("fr-FR")} kg/kWh`
          : undefined),
      badge: "Impact",
      accent: "green",
    },
  ];
}

export function buildConsumptionMetrics(options?: {
  todayKwh?: number | null;
  monthKwh?: number | null;
  /** Prefer year-to-date when available; falls back to all-time. */
  annualKwh?: number | null;
  /** When true, annual card is calendar YTD (not lifetime). */
  annualIsYtd?: boolean;
  yearLabel?: string | null;
  trackingSinceLabel?: string | null;
}): HighlightMetric[] {
  const today = options?.todayKwh;
  const month = options?.monthKwh;
  const annual = options?.annualKwh;
  const annualIsYtd = Boolean(options?.annualIsYtd);
  const year = options?.yearLabel?.trim();
  const since = options?.trackingSinceLabel?.trim();

  return [
    {
      id: "cons-daily",
      label: "Consommation journalière",
      value:
        today != null && today > 0
          ? formatMonthlyEnergyKwh(today)
          : CLIENT_DASHBOARD_MISSING,
      footnote: today != null && today > 0 ? "Aujourd'hui" : "Jour en cours",
      badge: "Auj.",
      accent: "orange",
    },
    {
      id: "cons-monthly",
      label: "Consommation mensuelle",
      value:
        month != null && month > 0
          ? formatMonthlyEnergyKwh(month)
          : CLIENT_DASHBOARD_MISSING,
      footnote: "Mois en cours",
      badge: currentMonthBadge(),
      accent: "green",
    },
    {
      id: "cons-annual",
      label: "Consommation annuelle",
      value:
        annual != null && annual > 0
          ? formatKwhValue(annual)
          : CLIENT_DASHBOARD_MISSING,
      footnote:
        annual != null && annual > 0
          ? annualIsYtd
            ? year
              ? `Année en cours · ${year}`
              : "Année en cours"
            : since
              ? `Depuis le ${since}`
              : "Cumul depuis l'installation"
          : "Compteur edge requis",
      badge: annual != null && annual > 0 && !annualIsYtd ? "Cumul" : "YTD",
      accent: "blue",
    },
  ];
}

function finiteOrNull(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  return value;
}

export function buildAnnualEnergyFlowMetrics(options?: {
  annualProductionKwh?: number | null;
  annualExportKwh?: number | null;
  annualImportKwh?: number | null;
  annualAutoKwh?: number | null;
  yearLabel?: string | null;
  flowDayCount?: number | null;
}): HighlightMetric[] {
  const prod = finiteOrNull(options?.annualProductionKwh);
  const exportKwh = finiteOrNull(options?.annualExportKwh);
  const importKwh = finiteOrNull(options?.annualImportKwh);
  const autoKwh = finiteOrNull(options?.annualAutoKwh);
  const year = options?.yearLabel?.trim();
  const days = options?.flowDayCount;
  const autoPct =
    autoKwh != null && prod != null && prod > 0
      ? Math.round((autoKwh / prod) * 100)
      : null;

  const dayNote =
    days != null && days > 0
      ? `${days} j`
      : null;
  const gridFootnote = year
    ? `Σ journalier · ${year}${dayNote ? ` · ${dayNote}` : ""}`
    : "Σ des imports / exports journaliers";

  return [
    {
      id: "flow-auto",
      label: "Autoconsommation moyenne",
      value:
        autoPct != null ? `${autoPct}\u00a0%` : CLIENT_DASHBOARD_MISSING,
      footnote: autoPct != null
        ? "Σ autoconsommation journalière / Σ production"
        : "Nécessite le flux 15 min de chaque jour",
      badge: "PV",
      accent: "green",
      progress: autoPct ?? undefined,
    },
    {
      id: "flow-export",
      label: "Export réseau annuel",
      value:
        exportKwh != null ? formatKwhValue(exportKwh) : CLIENT_DASHBOARD_MISSING,
      footnote: gridFootnote,
      badge: "Export",
      accent: "blue",
    },
    {
      id: "flow-import",
      label: "Import réseau annuel",
      value:
        importKwh != null ? formatKwhValue(importKwh) : CLIENT_DASHBOARD_MISSING,
      footnote: gridFootnote,
      badge: "Import",
      accent: "teal",
    },
  ];
}

export function formatPerformanceUpdateLine(site: ClientDashboardSite): string {
  const parts = [site.lastUpdatedAt, site.dayLabel].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : CLIENT_DASHBOARD_MISSING;
}
