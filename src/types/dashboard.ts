/** Period filter for dashboard header (when wired). */
export type DashboardPeriod = "today" | "7d" | "30d" | "year";

export type DashboardTrend = {
  value: number;
  label: string;
};

export type DashboardKpi = {
  id: string;
  label: string;
  displayValue: string;
  footnote?: string;
  trend?: DashboardTrend;
};

export type HourlyProductionPoint = {
  hour: number;
  valueKw: number;
};

/** Hourly kW curves for today vs yesterday (0–23). @deprecated — use IntradayPowerChartData */
export type ProductionHourlyComparison = {
  today: HourlyProductionPoint[];
  yesterday: HourlyProductionPoint[];
};

export type IntradayPowerPoint = {
  time: string;
  label: string;
  valueKw: number;
  isLive?: boolean;
};

export type IntradayIrradiationPoint = {
  time: string;
  label: string;
  /** Primary KPI series (POA when tilted, else GHI). null = future slot. */
  valueWm2: number | null;
  /** Plan horizontal (GHI). */
  ghiWm2: number | null;
  /** Plan incliné (POA); null when tilt missing or future. */
  poaWm2: number | null;
  isLive?: boolean;
};

export type IntradayDailyTotals = {
  productionKwh: number;
  savingsTnd: number;
  co2Kg: number;
};

export type MonthlyDailyProductionPoint = {
  day: number;
  date: string;
  label: string;
  productionKwh: number;
};

export type MonthlyDailyProductionChartData = {
  year: number;
  month: number;
  timezone: string;
  monthRange: {
    minYear: number;
    minMonth: number;
    maxYear: number;
    maxMonth: number;
  };
  daysInMonth: number;
  seriesStartDay: number;
  series: MonthlyDailyProductionPoint[];
  monthlyTotals: IntradayDailyTotals;
};

/** Puissance totale — courbe intraday pour un jour choisi. */
export type IntradayPowerChartData = {
  date: string;
  timezone: string;
  dateRange: { min: string; max: string };
  series: IntradayPowerPoint[];
  slotCount: number;
  lastPointIndex: number | null;
  source: "database" | "enode";
  syncedFromEnode: boolean;
  currentProductionRateKw: number | null;
  invertersConnected?: boolean;
  dailyTotals: IntradayDailyTotals;
};

/** Irradiation solaire — courbe Open-Meteo 15 min (W/m²). */
export type IntradayIrradiationChartData = {
  date: string;
  timezone: string;
  dateRange: { min: string; max: string };
  series: IntradayIrradiationPoint[];
  slotCount: number;
  lastPointIndex: number | null;
  /** Peak of primary series (inclined when available). */
  peakWm2: number;
  peakGhiWm2: number;
  peakPoaWm2: number | null;
  source: "tilted" | "horizontal";
  provider: "forecast" | "archive" | "none";
  plane: { tilt: number | null; azimuth: number } | null;
  totals: {
    poaKwhM2: number | null;
    ghiKwhM2: number | null;
    ratio: number | null;
  };
  confidence: "B" | "C" | "D" | null;
  warnings: string[];
  fetchedAt: string | null;
  siteId: string | null;
};

export type MonthlyEnergyPoint = {
  label: string;
  valueKw: number;
};

export type YearlyEnergySeries = {
  year: number;
  months: MonthlyEnergyPoint[];
};

export type SavingsComparisonPoint = {
  label: string;
  realEuro: number;
  estimatedEuro: number;
};

export type YearlySavingsComparisonSeries = {
  year: number;
  months: SavingsComparisonPoint[];
};

export type DashboardEscoContractYear = {
  label: string;
  months: Array<{ filled: boolean }>;
};

export type DashboardEscoContract = {
  configured: boolean;
  status: "active" | "ended" | "pending";
  statusLabel: string;
  monthlyAmountTnd: number | null;
  totalMonths: number;
  elapsedMonths: number;
  durationPercent: number;
  totalYears: number;
  years: DashboardEscoContractYear[];
  startLabel: string;
  endLabel: string;
  monthsUntilEnd: number;
  periodYearsLabel: string;
  elapsedMonthsLabel: string;
  elapsedHumanLabel: string;
  monthlyPerformancePercent: number | null;
  monthlyPerformanceMonthLabel: string | null;
};

export type DashboardAlertSeverity = "error" | "warning" | "info";

export type DashboardAlert = {
  id: string;
  severity: DashboardAlertSeverity;
  title: string;
  message: string;
  timeLabel?: string;
  type?: string;
  sourceLabel?: string;
  sourceType?: "asset" | "company" | "system";
  assetId?: string;
};

export type DashboardSiteStatus = "online" | "offline" | "maintenance";

export type DashboardInverterStatus =
  | "connected"
  | "degraded"
  | "offline"
  | "unknown";

/** Solar inverter visible on the client dashboard. */
export type DashboardInverter = {
  id: string;
  name: string;
  status: DashboardInverterStatus;
  statusLabel: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  ratedPowerKw?: number;
  ratedPowerLabel?: string;
  capacityLabel?: string;
  installationDate?: string;
  installationDateLabel?: string;
  locationLabel?: string;
  isProducing?: boolean;
  lastProductionRateKw?: number;
  lastUpdatedAt?: string;
};

/** Site banner at the top of the client dashboard. */
export interface ClientDashboardSite {
  siteName: string;
  siteLocation: string;
  /** Optional — skips geocoding when set with longitude. */
  latitude?: number;
  longitude?: number;
  /** IANA timezone, e.g. Africa/Tunis — from geocoding or backend. */
  timezone?: string;
  status: DashboardSiteStatus;
  statusLabel: string;
  currentProductionKw?: number;
  currentProductionLabel: string;
  temperatureLabel: string;
  /** e.g. "lundi 18 mai 2026" */
  dayLabel: string;
  /** Filled by live weather (Open-Meteo) or backend when available. */
  temperatureCelsius?: number;
  humidityLabel: string;
  humidityPercent?: number;
  /** When live production (kW) was last read — e.g. "13h42". Not weather. */
  lastUpdatedAt: string;
  addressLine: string;
  installedCapacityLabel: string;
  theoreticalProductionLabel: string;
  theoreticalProductionValue: string;
  theoreticalProductionFootnote: string;
  inServiceSinceLabel: string;
  contactName: string;
}

/** Statut du cooldown sync Enode (bouton Actualiser). */
export type DashboardEnodeSync = {
  canRefresh: boolean;
  nextEnodeRefreshAt: string | null;
  cooldownSecondsRemaining: number;
};

export type DashboardScopeSite = {
  id: string;
  name: string;
  status: string;
  inverterCount: number;
};

/** Normalized dashboard payload used by all UI components. */
export interface ClientDashboardData {
  scopeSiteId: string | null;
  scopeSites: DashboardScopeSite[];
  site: ClientDashboardSite;
  inverters: DashboardInverter[];
  /** Installation summary — shown in the top row (P crête, production théorique, …). */
  installationKpis: DashboardKpi[];
  kpis: DashboardKpi[];
  productionHourly: ProductionHourlyComparison;
  energyByYear: YearlyEnergySeries[];
  savingsComparison: SavingsComparisonPoint[];
  savingsComparisonByYear: YearlySavingsComparisonSeries[];
  escoContract: DashboardEscoContract;
  alerts: DashboardAlert[];
  enodeSync: DashboardEnodeSync;
}

export type DashboardKpiApiItem = {
  id?: string;
  label?: string;
  display_value?: string;
  displayValue?: string;
  footnote?: string;
  trend?: { value?: number; label?: string };
};

/**
 * Example API response shape — adjust field names when your backend is defined,
 * then update `toClientDashboardData` in lib/dashboard/normalize.ts.
 */
export type ClientDashboardSiteApi = {
  site_name?: string;
  siteName?: string;
  site_location?: string;
  siteLocation?: string;
  latitude?: number;
  lat?: number;
  longitude?: number;
  lon?: number;
  lng?: number;
  timezone?: string;
  time_zone?: string;
  status?: DashboardSiteStatus;
  status_label?: string;
  statusLabel?: string;
  current_production_kw?: number;
  currentProductionKw?: number;
  current_production_label?: string;
  currentProductionLabel?: string;
  temperature_label?: string;
  temperatureLabel?: string;
  day_label?: string;
  dayLabel?: string;
  temperature_celsius?: number;
  temperatureCelsius?: number;
  humidity_label?: string;
  humidityLabel?: string;
  humidity_percent?: number;
  humidityPercent?: number;
  last_updated_at?: string;
  lastUpdatedAt?: string;
  address_line?: string;
  addressLine?: string;
  installed_capacity_label?: string;
  installedCapacityLabel?: string;
  theoretical_production_label?: string;
  theoreticalProductionLabel?: string;
  theoretical_production_value?: string;
  theoreticalProductionValue?: string;
  theoretical_production_footnote?: string;
  theoreticalProductionFootnote?: string;
  in_service_since_label?: string;
  inServiceSinceLabel?: string;
  contact_name?: string;
  contactName?: string;
};

export type DashboardInverterApiItem = {
  id?: string;
  name?: string;
  status?: DashboardInverterStatus | string;
  status_label?: string;
  statusLabel?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  serialNumber?: string;
  rated_power_kw?: number;
  ratedPowerKw?: number;
  rated_power_label?: string;
  ratedPowerLabel?: string;
  capacity_label?: string;
  capacityLabel?: string;
  installation_date?: string;
  installationDate?: string;
  installation_date_label?: string;
  installationDateLabel?: string;
  location_label?: string;
  locationLabel?: string;
  is_producing?: boolean;
  isProducing?: boolean;
  last_production_rate_kw?: number;
  lastProductionRateKw?: number;
  last_updated_at?: string;
  lastUpdatedAt?: string;
};

export interface ClientDashboardApiResponse {
  scope_site_id?: string | null;
  scopeSiteId?: string | null;
  scope_site_auto_selected?: boolean;
  scope_sites?: Array<{
    id?: string;
    name?: string;
    status?: string;
    inverter_count?: number;
    inverterCount?: number;
  }>;
  scopeSites?: Array<{
    id?: string;
    name?: string;
    status?: string;
    inverter_count?: number;
    inverterCount?: number;
  }>;
  site?: ClientDashboardSiteApi;
  inverters?: DashboardInverterApiItem[];
  installation_kpis?: DashboardKpiApiItem[];
  installationKpis?: DashboardKpiApiItem[];
  kpis?: DashboardKpiApiItem[];
  production_hourly?:
    | Array<{ hour?: number; value_kw?: number; valueKw?: number }>
    | {
        today?: Array<{ hour?: number; value_kw?: number; valueKw?: number }>;
        yesterday?: Array<{ hour?: number; value_kw?: number; valueKw?: number }>;
      };
  productionHourly?:
    | Array<{ hour?: number; value_kw?: number; valueKw?: number }>
    | {
        today?: Array<{ hour?: number; value_kw?: number; valueKw?: number }>;
        yesterday?: Array<{ hour?: number; value_kw?: number; valueKw?: number }>;
      };
  energy_by_year?: EnergyByYearApiItem[] | Record<string, EnergyMonthApiItem[]>;
  energyByYear?: EnergyByYearApiItem[] | Record<string, EnergyMonthApiItem[]>;
  savings_comparison?: SavingsComparisonApiItem[];
  savingsComparison?: SavingsComparisonApiItem[];
  savings_comparison_by_year?: Array<{
    year?: number;
    months?: SavingsComparisonApiItem[];
  }>;
  savingsComparisonByYear?: Array<{
    year?: number;
    months?: SavingsComparisonApiItem[];
  }>;
  esco_contract?: EscoContractApi;
  alerts?: DashboardAlertApiItem[];
  enode_sync?: {
    can_refresh?: boolean;
    next_enode_refresh_at?: string | null;
    cooldown_seconds_remaining?: number;
  };
}

export type DashboardAlertApiItem = {
  id?: string;
  severity?: DashboardAlertSeverity;
  title?: string;
  message?: string;
  time_label?: string;
  timeLabel?: string;
  type?: string;
  source_label?: string;
  sourceLabel?: string;
  source_type?: "asset" | "company" | "system";
  sourceType?: "asset" | "company" | "system";
  asset_id?: string;
  assetId?: string;
};

export type EscoContractApi = {
  configured?: boolean;
  status?: "active" | "ended" | "pending";
  status_label?: string;
  monthly_amount_tnd?: number | null;
  total_months?: number;
  elapsed_months?: number;
  duration_percent?: number;
  total_years?: number;
  years?: Array<{
    label?: string;
    months?: Array<{ filled?: boolean }>;
  }>;
  start_label?: string;
  end_label?: string;
  months_until_end?: number;
  period_years_label?: string;
  elapsed_months_label?: string;
  elapsed_human_label?: string;
  monthly_performance_percent?: number | null;
  monthly_performance_month_label?: string | null;
};

export type SavingsComparisonApiItem = {
  label?: string;
  month?: string;
  real_euro?: number;
  realEuro?: number;
  estimated_euro?: number;
  estimatedEuro?: number;
};

export type EnergyMonthApiItem = {
  label?: string;
  month?: string;
  value_kw?: number;
  valueKw?: number;
};

export type EnergyByYearApiItem = {
  year?: number;
  months?: EnergyMonthApiItem[];
};
