import type {
  IntradayIrradiationChartData,
  IntradayIrradiationPoint,
} from "@/types/dashboard";

export type IntradayIrradiationApiResponse = {
  date: string;
  timezone: string;
  date_range: { min: string; max: string };
  series: Array<{
    time: string;
    label: string;
    value_wm2: number | null;
    ghi_wm2?: number | null;
    poa_wm2?: number | null;
    is_live?: boolean;
  }>;
  slot_count: number;
  last_point_index?: number | null;
  peak_wm2: number;
  peak_ghi_wm2?: number;
  peak_poa_wm2?: number | null;
  source: "tilted" | "horizontal" | "open_meteo";
  provider?: "forecast" | "archive" | "none";
  plane?: { tilt: number | null; azimuth: number } | null;
  totals?: {
    poa_kwh_m2: number | null;
    ghi_kwh_m2: number | null;
    ratio: number | null;
  };
  confidence?: "B" | "C" | "D" | null;
  warnings?: string[];
  fetched_at?: string | null;
  site_id?: string | null;
};

export function toIntradayIrradiationChartData(
  raw: IntradayIrradiationApiResponse,
): IntradayIrradiationChartData {
  const series: IntradayIrradiationPoint[] = raw.series.map((p) => {
    const ghi = p.ghi_wm2 ?? p.value_wm2;
    const poa = p.poa_wm2 ?? null;
    return {
      time: p.time,
      label: p.label,
      valueWm2: p.value_wm2,
      ghiWm2: ghi,
      poaWm2: poa,
      isLive: p.is_live,
    };
  });

  let lastPointIndex = raw.last_point_index ?? null;
  if (lastPointIndex == null) {
    for (let i = series.length - 1; i >= 0; i--) {
      if (series[i].valueWm2 != null) {
        lastPointIndex = i;
        break;
      }
    }
  }

  const source: "tilted" | "horizontal" =
    raw.source === "tilted" ? "tilted" : "horizontal";

  return {
    date: raw.date,
    timezone: raw.timezone,
    dateRange: raw.date_range,
    series,
    slotCount: raw.slot_count,
    lastPointIndex,
    peakWm2: raw.peak_wm2,
    peakGhiWm2: raw.peak_ghi_wm2 ?? raw.peak_wm2,
    peakPoaWm2: raw.peak_poa_wm2 ?? null,
    source,
    provider: raw.provider ?? "none",
    plane: raw.plane ?? null,
    totals: {
      poaKwhM2: raw.totals?.poa_kwh_m2 ?? null,
      ghiKwhM2: raw.totals?.ghi_kwh_m2 ?? null,
      ratio: raw.totals?.ratio ?? null,
    },
    confidence: raw.confidence ?? null,
    warnings: raw.warnings ?? [],
    fetchedAt: raw.fetched_at ?? null,
    siteId: raw.site_id ?? null,
  };
}
