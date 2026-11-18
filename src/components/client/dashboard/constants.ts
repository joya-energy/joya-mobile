/**
 * UI-only constants (colors, layout). Tarifs / CO₂ : `@/lib/dashboard/business-constants`
 * KPI labels and chart styling. Production KPI values come from core-api.
 */

import { JOYA_CHART } from "@/components/joya/chart-theme";

/** Joya coral — primary series (production, highlights). */
export const DASHBOARD_CHART_COLOR = JOYA_CHART.coral;

/** Production horaire — courbe « hier » */
export const DASHBOARD_PRODUCTION_YESTERDAY_COLOR = JOYA_CHART.muted;

/** Infobulle graphique Énergie — pastilles */
export const DASHBOARD_ENERGY_TOOLTIP_ENERGY_COLOR = JOYA_CHART.coral;
export const DASHBOARD_ENERGY_TOOLTIP_FINANCIAL_COLOR = JOYA_CHART.navy;
export const DASHBOARD_ENERGY_TOOLTIP_CO2_COLOR = JOYA_CHART.success;
export const DASHBOARD_CHART_COLOR_HOVER = JOYA_CHART.coralDark;
/** Second series (économie estimée) — navy reference */
export const DASHBOARD_CHART_COLOR_SECOND = JOYA_CHART.navy;

/** Savings comparison — coral = réel, navy = estimé */
export const DASHBOARD_SAVINGS_REAL_COLOR = JOYA_CHART.coral;
export const DASHBOARD_SAVINGS_ESTIMATED_COLOR = JOYA_CHART.navy;

/** Alertes KPI card — navy surface (report `.cmpx`) */
export const DASHBOARD_ALERTS_CARD_BG = JOYA_CHART.navy;
export const DASHBOARD_ALERTS_CARD_BG_HOVER = JOYA_CHART.navyDark;

/** Alertes KPI footer — matches reference panel */
export const DASHBOARD_ALERT_KPI_ATTENTION = "#F5D08A";
export const DASHBOARD_ALERT_KPI_INFO = JOYA_CHART.blueLight;
export const DASHBOARD_ALERT_KPI_MUTED = JOYA_CHART.blueLight;

export const DASHBOARD_CHART_AREA_GRADIENT_ID = "production-hourly-area-fill";
export const DASHBOARD_IRRADIATION_AREA_GRADIENT_ID =
  "irradiation-hourly-area-fill";

/** Irradiation — amber/sun = plan horizontal, coral = plan incliné */
export const DASHBOARD_IRRADIATION_COLOR = JOYA_CHART.sun;
export const DASHBOARD_IRRADIATION_TILTED_COLOR = JOYA_CHART.coral;
export const DASHBOARD_IRRADIATION_AREA_TOP = JOYA_CHART.sunLight;

/** Site banner background — navy */
export const DASHBOARD_SITE_BANNER_BG = JOYA_CHART.navy;

export const DASHBOARD_PERIOD_ACTIVE = JOYA_CHART.coral;
export const DASHBOARD_CHART_AREA_GRADIENT_TOP = JOYA_CHART.coralLight;

export { DEFAULT_TREND_LABEL } from "@/lib/dashboard/ui-constants";

/** Plot area on mobile: matches SVG viewBox ratio so the card does not reserve empty space. */
export const DASHBOARD_SAVINGS_CHART_PLOT =
  "relative w-full h-60 sm:h-64 lg:h-auto lg:min-h-[17rem] lg:flex-1";

export const DASHBOARD_PRODUCTION_CHART_PLOT =
  "relative w-full h-64 sm:h-72 lg:h-auto lg:min-h-[17rem] lg:flex-1";

export const DASHBOARD_ENERGY_CHART_PLOT =
  "relative w-full h-64 sm:h-72 lg:h-auto lg:min-h-[17rem] lg:flex-1";

/**
 * Shared band above Puissance / Irradiation plots so x-axes stay level
 * (KPI row vs pic du jour).
 */
export const DASHBOARD_INTRADAY_METRICS_BAND =
  "shrink-0 min-h-[4.75rem] flex items-stretch";

/** Desktop-only minimums for chart cards in the 2-column grid. */
export const DASHBOARD_CHART_CARD_MIN_HEIGHT = "lg:min-h-[22rem] xl:min-h-[26rem]";

export const DASHBOARD_PERIOD_OPTIONS = [
  { value: "today" as const, label: "Aujourd'hui" },
  { value: "7d" as const, label: "7 jours" },
  { value: "30d" as const, label: "30 jours" },
  { value: "year" as const, label: "Année" },
] as const;
