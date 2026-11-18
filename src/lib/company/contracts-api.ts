import apiClient from "@/lib/api";

export type ClientContractFile = {
  fileId: string;
  fileName: string;
  viewUrl: string | null;
  createdAt: string | null;
};

export type ClientContractsResponse = {
  companyId: string;
  insurance: ClientContractFile[];
  warranty: ClientContractFile[];
  contract: ClientContractFile[];
};

export const contractsApi = {
  list: async (): Promise<ClientContractsResponse> => {
    const response = await apiClient.get<ClientContractsResponse>(
      "/companies/me/contracts",
      {
        params: { _ts: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      },
    );
    return response.data;
  },
};
