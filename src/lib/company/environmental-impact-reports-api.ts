import apiClient from "@/lib/api";

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

  download: async (
    periodKey: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get<Blob>(
      `/companies/me/environmental-impact-reports/${encodeURIComponent(periodKey)}/download`,
      { responseType: "blob" },
    );
    const disposition = String(
      response.headers["content-disposition"] ?? "",
    );
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const filename =
      match?.[1] ??
      `rapport-impact-environnemental-${periodKey}.pdf`;
    return { blob: response.data, filename };
  },
};
