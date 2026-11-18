import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";

/** Millimes : 3 décimales (aligné sur core-api `DASHBOARD_TND_SAVINGS_DECIMALS`). */
export const TND_SAVINGS_DECIMALS = 3;

const tndSavingsFormatOptions = {
  minimumFractionDigits: TND_SAVINGS_DECIMALS,
  maximumFractionDigits: TND_SAVINGS_DECIMALS,
  useGrouping: true,
} as const;

/** Tunisian dinar — montants entiers (coût installation, etc.). */
export function formatTnd(value: number, maximumFractionDigits = 0): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits, useGrouping: true })}\u00a0TND`;
}

/** Économies — 3 décimales + séparateur de milliers (ex. `100 000,000 TND`). */
export function formatTndSavings(value: number): string {
  return `${value.toLocaleString("fr-FR", tndSavingsFormatOptions)}\u00a0TND`;
}

/** TND for dashboard cards — missing amount shows "—". */
export function formatTndOrMissing(
  value: number | undefined,
  maximumFractionDigits = 0,
): string {
  if (value === undefined || Number.isNaN(value)) return CLIENT_DASHBOARD_MISSING;
  return formatTnd(value, maximumFractionDigits);
}

export function formatTndSavingsOrMissing(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return CLIENT_DASHBOARD_MISSING;
  return formatTndSavings(value);
}

/** Axe graphique économies — milliers avec précision millimes sur les petites valeurs. */
export function formatTndSavingsAxis(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fr-FR", tndSavingsFormatOptions)} M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString("fr-FR", tndSavingsFormatOptions)} k`;
  }
  return value.toLocaleString("fr-FR", tndSavingsFormatOptions);
}

/** @deprecated Use formatTndSavingsAxis for savings charts. */
export function formatTndAxis(value: number): string {
  return formatTndSavingsAxis(value);
}
