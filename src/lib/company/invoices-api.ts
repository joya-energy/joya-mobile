import { apiClient } from "@/lib/api";
import {
  downloadApiFile,
  type DownloadedApiFile,
} from "@/lib/files/download-api-file";

export type ClientInvoiceItem = {
  id: string;
  periodKey: string;
  periodLabel: string;
  year: number;
  month: number;
  uploadedAt: string;
  filename: string;
  notifiedAt: string | null;
};

export const invoicesApi = {
  list: async (): Promise<ClientInvoiceItem[]> => {
    const response = await apiClient.get<{
      invoices: ClientInvoiceItem[];
    }>("/companies/me/invoices", {
      params: { _ts: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    });
    return response.data.invoices ?? [];
  },

  download: async (periodKey: string): Promise<DownloadedApiFile> =>
    downloadApiFile(
      `/companies/me/invoices/${encodeURIComponent(periodKey)}/download`,
      `facture-${periodKey}.pdf`,
    ),
};
