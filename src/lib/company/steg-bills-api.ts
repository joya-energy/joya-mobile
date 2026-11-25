import { apiClient } from "@/lib/api";
import {
  downloadApiFile,
  type DownloadedApiFile,
} from "@/lib/files/download-api-file";

export type StegBillItem = {
  id: string;
  fileId: string;
  filename: string;
  uploadedAt: string;
  source: "whatsapp" | "upload";
  mimeType: string | null;
  kind: string | null;
  year: number | null;
  month: number | null;
  periodKey: string | null;
  periodLabel: string | null;
};

export const stegBillsApi = {
  list: async (): Promise<StegBillItem[]> => {
    const response = await apiClient.get<{ bills: StegBillItem[] }>(
      "/companies/me/steg-bills",
      {
        params: { _ts: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    const bills = response.data.bills;
    return Array.isArray(bills) ? bills.filter((bill) => Boolean(bill?.id)) : [];
  },

  attach: async (payload: {
    year: number;
    month: number;
    fileId: string;
  }): Promise<StegBillItem> => {
    const response = await apiClient.post<{ bill: StegBillItem }>(
      "/companies/me/steg-bills",
      payload,
    );
    return response.data.bill;
  },

  download: async (billId: string): Promise<DownloadedApiFile> =>
    downloadApiFile(
      `/companies/me/steg-bills/${encodeURIComponent(billId)}/download`,
      "facture-steg",
    ),

  delete: async (billId: string): Promise<void> => {
    await apiClient.delete(`/companies/me/steg-bills/${encodeURIComponent(billId)}`);
  },
};
