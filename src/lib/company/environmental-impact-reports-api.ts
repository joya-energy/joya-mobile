import { apiClient } from "@/lib/api";
import {
  downloadApiFile,
  type DownloadedApiFile,
} from "@/lib/files/download-api-file";

export type EnvironmentalImpactReportItem = {
  id: string;
  periodKey: string;
  periodLabel: string;
  year: number;
  month: number;
  generatedAt: string;
  filename: string;
  source: "monthly_email" | "admin" | "client" | "available";
};

export const environmentalImpactReportsApi = {
  list: async (): Promise<EnvironmentalImpactReportItem[]> => {
    const response = await apiClient.get<{
      reports: EnvironmentalImpactReportItem[];
    }>("/companies/me/environmental-impact-reports", {
      params: { _ts: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return response.data.reports ?? [];
  },

  download: async (periodKey: string): Promise<DownloadedApiFile> =>
    downloadApiFile(
      `/companies/me/environmental-impact-reports/${encodeURIComponent(periodKey)}/download`,
      `rapport-impact-environnemental-${periodKey}.pdf`,
    ),
};
