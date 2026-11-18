/**
 * Client dashboard missing-value rules:
 * - Visible copy (labels, KPI values, amounts) → `clientDashboardText` / `formatClientDashboardNumber` → "—"
 * - Optional UI blocks (footnotes, alert time) → `clientDashboardOptionalText` → omit when absent
 * - Chart series (bars, lines) → `clientDashboardChartNumber` → 0 so SVG still draws
 */
export const CLIENT_DASHBOARD_MISSING = "—";

/** Required display string — missing or blank becomes "—". */
export function clientDashboardText(
  value: string | null | undefined,
): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : CLIENT_DASHBOARD_MISSING;
}

/** Optional copy — omit the UI block when missing (do not show "—"). */
export function clientDashboardOptionalText(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

/** Numbers passed into charts (bars/lines) — missing → 0 so SVG still renders. */
export function clientDashboardChartNumber(
  value: number | null | undefined,
): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 0;
  return value;
}

/** Optional number from API — missing stays undefined for display formatters. */
export function clientDashboardOptionalNumber(
  value: number | string | null | undefined,
): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return n;
}

/** Formatted number for KPIs, currency, kW, %, etc. */
export function formatClientDashboardNumber(
  value: number | null | undefined,
  format: (n: number) => string,
): string {
  const n = clientDashboardOptionalNumber(value);
  if (n === undefined) return CLIENT_DASHBOARD_MISSING;
  return format(n);
}
