import apiClient from "@/lib/api";

export type EdgeMetricPoint = {
  t: string;
  hour?: number;
  label?: string;
  voltage_l1: number | null;
  voltage_l2: number | null;
  voltage_l3: number | null;
  voltage_avg: number | null;
  current_l1: number | null;
  current_l2: number | null;
  current_l3: number | null;
  active_power_total_kw: number | null;
  active_power_l1_kw: number | null;
  apparent_power_total_kva: number | null;
  reactive_power_total_kvar: number | null;
  power_factor: number | null;
  frequency_hz: number | null;
  import_active_kwh: number | null;
  export_active_kwh: number | null;
  energy_kwh?: number | null;
};

export type ClientEdgeDeviceRow = {
  device_id: string;
  site_id: string | null;
  status: string;
  meter_asset_id: string | null;
  firmware_version: string | null;
  last_seen_at: string | null;
  last_telemetry_at: string | null;
  last_sample?: {
    active_power_total_kw?: number | null;
    voltage_avg?: number | null;
    frequency_hz?: number | null;
  } | null;
};

export type EdgeConsumptionMonitorResponse = {
  device: {
    device_id: string;
    status: string;
    site_id: string | null;
    site_name: string | null;
    last_seen_at: string | null;
    last_telemetry_at: string | null;
    firmware_version: string | null;
    meter_asset_id: string | null;
  };
  latest: EdgeMetricPoint | null;
  today: {
    date: string;
    points: EdgeMetricPoint[];
    sample_count: number;
  };
  history: {
    date: string;
    hourly: EdgeMetricPoint[];
    quarter_hour: Array<EdgeMetricPoint & { label?: string }>;
    sample_count: number;
    day_energy_kwh: number | null;
  };
  consumption: {
    today_kwh: number | null;
    month_kwh: number | null;
    /** Calendar-year site load YTD (∫P·dt). */
    year_load_kwh: number | null;
    /** Calendar-year grid import (YTD register). */
    year_kwh: number | null;
    all_time_kwh: number | null;
    /** Calendar-year grid export (YTD). */
    year_export_kwh: number | null;
    /** Σ export journalier 15 min (année en cours). */
    year_daily_export_kwh?: number | null;
    /** Σ import journalier 15 min (année en cours). */
    year_daily_import_kwh?: number | null;
    year_daily_auto_kwh?: number | null;
    year_daily_flow_days?: number;
    month: string;
    year?: string;
    tracking_since: string | null;
    sample_count: number;
  };
};

export type ConsumptionHistoryGrain = "hour" | "day" | "month";

export type ConsumptionHistoryPoint = {
  key: string;
  label: string;
  t: string;
  kwh: number | null;
};

export type ConsumptionHistoryResponse = {
  grain: ConsumptionHistoryGrain;
  from: string;
  to: string;
  unit: "kWh";
  points: ConsumptionHistoryPoint[];
};

export const consumptionApi = {
  listDevices: async (params?: { siteId?: string }) => {
    try {
      const response = await apiClient.get<{ devices: ClientEdgeDeviceRow[] }>(
        "/companies/me/edge-devices",
        {
          params: params?.siteId ? { site_id: params.siteId } : undefined,
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        },
      );
      return response.data.devices ?? [];
    } catch {
      return [];
    }
  },

  getMonitor: async (deviceId: string, params?: { date?: string }) => {
    const response = await apiClient.get<EdgeConsumptionMonitorResponse>(
      `/companies/me/edge-devices/${encodeURIComponent(deviceId)}/consumption-monitor`,
      {
        params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    return response.data;
  },

  getHistory: async (
    deviceId: string,
    params: { from: string; to: string; grain: ConsumptionHistoryGrain },
  ) => {
    const response = await apiClient.get<ConsumptionHistoryResponse>(
      `/companies/me/edge-devices/${encodeURIComponent(deviceId)}/consumption-history`,
      {
        params,
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    return response.data;
  },

  getPowerOutageHours: async () => {
    const response = await apiClient.get<{
      months: Array<{ start: string | null; end: string | null }>;
    }>("/companies/me/power-outage-hours", {
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return response.data;
  },
};
