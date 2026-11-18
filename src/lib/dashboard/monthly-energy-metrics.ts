import {
  DASHBOARD_CO2_KG_PER_KWH,
  DASHBOARD_TARIFF_SAVINGS_KPI_DT,
} from "@/lib/dashboard/business-constants";
import { formatTndSavings } from "@/lib/format/currency";

const MONTH_SHORT_TO_INDEX: Record<string, number> = {
  Jan: 0,
  Fév: 1,
  Mar: 2,
  Avr: 3,
  Mai: 4,
  Juin: 5,
  Juil: 6,
  Août: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Déc: 11,
};

const MONTH_FULL_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export type MonthlyEnergyDerived = {
  energyKwh: number;
  savingsTnd: number;
  co2Kg: number;
};

/** `valueKw` on monthly energy points is production in kWh. */
export function deriveMonthlyEnergyMetrics(energyKwh: number): MonthlyEnergyDerived {
  const kwh = Math.max(0, energyKwh);
  return {
    energyKwh: kwh,
    savingsTnd: kwh * DASHBOARD_TARIFF_SAVINGS_KPI_DT,
    co2Kg: kwh * DASHBOARD_CO2_KG_PER_KWH,
  };
}

export function formatMonthlyEnergyKwh(kwh: number): string {
  return `${kwh.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}\u00a0kWh`;
}

export function formatMonthlyCo2Kg(kg: number): string {
  return `${Math.round(kg).toLocaleString("fr-FR")}\u00a0kg`;
}

export function formatMonthlySavingsTnd(tnd: number): string {
  return formatTndSavings(tnd);
}

export function monthlyEnergyTitle(shortLabel: string, year: number): string {
  const idx = MONTH_SHORT_TO_INDEX[shortLabel];
  const name = idx != null ? MONTH_FULL_FR[idx] : shortLabel;
  return `${name} ${year}`;
}
