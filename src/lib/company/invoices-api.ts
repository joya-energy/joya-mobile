import apiClient from "@/lib/api";

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

  download: async (
    periodKey: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const response = await apiClient.get<Blob>(
      `/companies/me/invoices/${encodeURIComponent(periodKey)}/download`,
      { responseType: "blob" },
    );
    const disposition = String(response.headers["content-disposition"] ?? "");
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const filename = match?.[1] ?? `facture-${periodKey}.pdf`;
    return { blob: response.data, filename };
  },
};
