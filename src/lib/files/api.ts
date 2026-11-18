import { apiClient } from "@/lib/api";

export type UploadKind = "pdf" | "image" | "excel";
export type LinkTarget =
  | "company_bill"
  | "company_roof_image"
  | "company_balance_sheet"
  | "company_bank_statement"
  | "company_trade_register"
  | "company_rne"
  | "company_manager_cin_document"
  | "company_rib_document"
  | "company_tax_declaration_document"
  | "company_insurance_document"
  | "company_warranty_document"
  | "company_contract_document"
  | "company_client_invoice";

export interface UploadIntentRequest {
  ownerType: "user" | "company";
  ownerId?: string;
  kind: UploadKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  linkTarget?: LinkTarget;
  linkContext?: {
    companyId?: string;
  };
}

export interface UploadIntentResponse {
  fileId: string;
  uploadSessionId: string;
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  headers: Record<string, string>;
}

export interface UploadFileRef {
  fileId: string;
  objectKey: string;
  fileName: string;
  uploadSessionId?: string;
  status?: "uploading" | "uploaded" | "failed";
  viewUrl?: string;
}

export const filesApi = {
  createUploadIntent: async (
    data: UploadIntentRequest,
  ): Promise<UploadIntentResponse> => {
    const response = await apiClient.post<UploadIntentResponse>(
      "/files/upload-intent",
      data,
    );
    return response.data;
  },
  getViewUrl: async (objectKey: string): Promise<{ viewUrl: string }> => {
    const response = await apiClient.post<{ viewUrl: string }>(
      "/files/view-url",
      {
        objectKey,
      },
    );
    return response.data;
  },
  deleteFile: async (
    objectKey: string,
  ): Promise<{ ok: boolean; deleted?: boolean }> => {
    const response = await apiClient.post<{ ok: boolean; deleted?: boolean }>(
      "/files/delete",
      {
        objectKey,
      },
    );
    return response.data;
  },

  confirmUpload: async (payload: {
    fileId: string;
    uploadSessionId?: string;
  }): Promise<{
    fileId: string;
    uploadSessionId: string;
    objectKey: string;
    status: "pending" | "uploaded" | "failed" | "expired";
    errorReason?: string | null;
    diagnostic?: string;
    finalizedBy: "webhook" | "confirm" | "already";
  }> => {
    const response = await apiClient.post("/files/confirm-upload", payload);
    return response.data;
  },
};
