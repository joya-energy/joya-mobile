import type { IntradayPowerChartData, IntradayPowerPoint } from "@/types/dashboard";

export type IntradayPowerApiResponse = {
  date: string;
  timezone: string;
  date_range: { min: string; max: string };
  series: Array<{
    time: string;
    label: string;
    value_kw: number;
    is_live?: boolean;
  }>;
  slot_count: number;
  last_point_index: number | null;
  source: "database" | "enode";
  synced_from_enode: boolean;
  current_production_rate_kw: number | null;
  inverters_connected?: boolean;
  daily_totals: {
    production_kwh: number;
    savings_tnd: number;
    co2_kg: number;
  };
};

/** Last Enode DAY kWh must not fill today's KPIs while the inverter is offline. */
export function usableTodayProductionKwh(args: {
  isToday: boolean;
  siteStatus?: string;
  series?: Array<{ valueKw: number; isLive?: boolean }>;
  productionKwh?: number | null;
}): number | null {
  if (!args.isToday) return null;
  const hasCurve = (args.series ?? []).some(
    (point) =>
      Number.isFinite(point.valueKw) && point.valueKw > 0 && !point.isLive,
  );
  if (args.siteStatus === "offline" && !hasCurve) return null;
  const kwh = args.productionKwh;
  if (kwh == null || !Number.isFinite(kwh) || kwh <= 0) return null;
  return kwh;
}

export function toIntradayPowerChartData(
  raw: IntradayPowerApiResponse,
): IntradayPowerChartData {
  const series: IntradayPowerPoint[] = raw.series.map((p) => ({
    time: p.time,
    label: p.label,
    valueKw: p.value_kw,
    isLive: p.is_live,
  }));

  return {
    date: raw.date,
    timezone: raw.timezone,
    dateRange: raw.date_range,
    series,
    slotCount: raw.slot_count,
    lastPointIndex: raw.last_point_index,
    source: raw.source,
    syncedFromEnode: raw.synced_from_enode,
    currentProductionRateKw: raw.current_production_rate_kw,
    invertersConnected: raw.inverters_connected ?? true,
    dailyTotals: raw.daily_totals
      ? {
          productionKwh: raw.daily_totals.production_kwh,
          savingsTnd: raw.daily_totals.savings_tnd,
          co2Kg: raw.daily_totals.co2_kg,
        }
      : { productionKwh: 0, savingsTnd: 0, co2Kg: 0 },
  };
}
