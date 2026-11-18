import apiClient from "@/lib/api";
import type {
  ClientDashboardApiResponse,
  ClientDashboardData,
  IntradayIrradiationChartData,
  IntradayPowerChartData,
  MonthlyDailyProductionChartData,
} from "@/types/dashboard";
import { withLiveWeather } from "./client-dashboard-weather";
import {
  type IntradayPowerApiResponse,
  toIntradayPowerChartData,
} from "./intraday-api";
import {
  type IntradayIrradiationApiResponse,
  toIntradayIrradiationChartData,
} from "./irradiation-api";
import {
  type MonthlyDailyProductionApiResponse,
  toMonthlyDailyProductionChartData,
} from "./monthly-daily-production-api";
import { toClientDashboardData } from "./normalize";

export type FetchClientDashboardParams = {
  companyId?: string;
  siteId?: string;
  assetId?: string;
};

export type FetchIntradayPowerParams = {
  companyId?: string;
  date?: string;
  siteId?: string;
  assetId?: string;
};

export type FetchMonthlyDailyProductionParams = {
  companyId?: string;
  year?: number;
  month?: number;
  siteId?: string;
  assetId?: string;
};

const noCacheHeaders = {
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
} as const;

export type ClientDashboardRefreshApiResponse = {
  dashboard: ClientDashboardApiResponse;
  enode_refresh?: {
    assetsProcessed?: number;
    bucketsUpserted?: number;
    hemSystemsProcessed?: number;
    hemBucketsUpserted?: number;
    errors?: Array<{ assetId: string; message: string }>;
    lookback_days?: number;
  };
  next_enode_refresh_at?: string;
};

export const clientDashboardApi = {
  /** Lecture seule — données déjà en base (+ météo). */
  fetch: async (params?: FetchClientDashboardParams): Promise<ClientDashboardData> => {
    const path = params?.companyId
      ? `/companies/${params.companyId}/dashboard`
      : "/companies/me/dashboard";

    const { data } = await apiClient.get<ClientDashboardApiResponse>(path, {
      params: {
        site_id: params?.siteId,
        asset_id: params?.assetId,
        _ts: Date.now(),
      },
      headers: noCacheHeaders,
    });

    return withLiveWeather(toClientDashboardData(data));
  },

  /** Sync Enode (365 j) puis tableau de bord — bouton Actualiser. */
  refresh: async (
    params?: FetchClientDashboardParams,
  ): Promise<{
    data: ClientDashboardData;
    enodeRefresh?: ClientDashboardRefreshApiResponse["enode_refresh"];
    nextEnodeRefreshAt?: string;
  }> => {
    const path = params?.companyId
      ? `/companies/${params.companyId}/dashboard/refresh`
      : "/companies/me/dashboard/refresh";

    const { data } = await apiClient.post<ClientDashboardRefreshApiResponse>(
      path,
      {},
      {
        params: {
        site_id: params?.siteId,
        asset_id: params?.assetId,
        _ts: Date.now(),
      },
        headers: noCacheHeaders,
      },
    );

    const mapped = await withLiveWeather(toClientDashboardData(data.dashboard));
    return {
      data: mapped,
      enodeRefresh: data.enode_refresh,
      nextEnodeRefreshAt: data.next_enode_refresh_at,
    };
  },

  fetchIntradayPower: async (
    params?: FetchIntradayPowerParams,
  ): Promise<IntradayPowerChartData> => {
    const path = params?.companyId
      ? `/companies/${params.companyId}/dashboard/intraday-power`
      : "/companies/me/dashboard/intraday-power";

    const { data } = await apiClient.get<IntradayPowerApiResponse>(path, {
      params: { date: params?.date, site_id: params?.siteId, asset_id: params?.assetId, _ts: Date.now() },
      headers: noCacheHeaders,
    });

    return toIntradayPowerChartData(data);
  },

  fetchIntradayIrradiation: async (
    params?: FetchIntradayPowerParams,
  ): Promise<IntradayIrradiationChartData> => {
    const path = params?.companyId
      ? `/companies/${params.companyId}/dashboard/intraday-irradiation`
      : "/companies/me/dashboard/intraday-irradiation";

    const { data } = await apiClient.get<IntradayIrradiationApiResponse>(path, {
      params: {
        date: params?.date,
        site_id: params?.siteId,
        asset_id: params?.assetId,
        _ts: Date.now(),
      },
      headers: noCacheHeaders,
    });

    return toIntradayIrradiationChartData(data);
  },

  fetchMonthlyDailyProduction: async (
    params?: FetchMonthlyDailyProductionParams,
  ): Promise<MonthlyDailyProductionChartData> => {
    const path = params?.companyId
      ? `/companies/${params.companyId}/dashboard/monthly-daily-production`
      : "/companies/me/dashboard/monthly-daily-production";

    const { data } = await apiClient.get<MonthlyDailyProductionApiResponse>(path, {
      params: {
        year: params?.year,
        month: params?.month,
        site_id: params?.siteId,
        asset_id: params?.assetId,
        _ts: Date.now(),
      },
      headers: noCacheHeaders,
    });

    return toMonthlyDailyProductionChartData(data);
  },
};
