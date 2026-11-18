/**
 * Client dashboard — business constants used for display calculations.
 * Production values come from core-api (`src/constants/client-dashboard.ts`).
 */

/** Tarif pour KPI « Économies » (DT/kWh). */
export const DASHBOARD_TARIFF_SAVINGS_KPI_DT = 0.465;

/** Tarif pour graphique « Économie réelle vs estimée » (DT/kWh). */
export const DASHBOARD_TARIFF_SAVINGS_COMPARE_DT = 0.465;

/** Tarif historique encart bannière (DT/kW) — conservé pour référence. */
export const DASHBOARD_TARIFF_LIVE_SAVINGS_DT_PER_KW = 0.319;

/** Facteur d'émission (kg CO₂ par kWh produit). */
export const DASHBOARD_CO2_KG_PER_KWH = 0.468;

export function dashboardSavingsKpiFootnote(): string {
  return `Tarif ${DASHBOARD_TARIFF_SAVINGS_KPI_DT.toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} DT/kWh`;
}
