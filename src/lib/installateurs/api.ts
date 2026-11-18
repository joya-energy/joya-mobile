import { apiClient } from "@/lib/api";

export type RegisterInstallateurRequest = {
  managerName: string;
  companyName: string;
  fiscalId?: string;
  phoneNumber: string;
  email: string;
};

export type RegisterInstallateurResponse = {
  message: string;
  email: string;
  emailSent?: boolean;
  setupUrl?: string;
};

export type CreateInstallateurClientRequest = {
  annualConsumptionKwh: number;
  energyProfile: string;
  governorate: string;
  sector: string;
  companyName: string;
  /** Optional contact channels — invitation sent when provided. */
  phone?: string;
  email?: string;
  siteName?: string;
};

export type CreateInstallateurClientResponse = {
  userId: string;
  companyId: string;
  siteId: string;
  created: boolean;
  invite: {
    emailSent: boolean;
    whatsappSent: boolean;
  };
};

export type InstallateurClient = {
  company_id: string;
  user_id: string;
  site_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  governorate: string | null;
  company_status: string;
  company_status_label: string;
  funnel_stage: string | null;
  account_status: string;
  account_claimed: boolean;
  has_devis: boolean;
  has_pvsys: boolean;
  has_autres: boolean;
  created_at: string;
};

export type InstallateurSiteAutreFile = {
  file_id: string;
  object_key: string;
  file_name: string | null;
  view_url?: string | null;
};

export type InstallateurSiteDocs = {
  site_id: string;
  site_name: string;
  devis_file_id: string | null;
  devis_object_key: string | null;
  devis_view_url?: string | null;
  pvsys_file_id: string | null;
  pvsys_object_key: string | null;
  pvsys_view_url?: string | null;
  autres_files?: InstallateurSiteAutreFile[];
};

export type InstallateurLinkedFile = {
  file_id: string;
  object_key: string;
  view_url?: string | null;
};

export type InstallateurOnboardingDocs = {
  trade_register_file_id: string | null;
  trade_register_object_key: string | null;
  trade_register_view_url?: string | null;
  rne_file_id: string | null;
  rne_object_key: string | null;
  rne_view_url?: string | null;
  cin_documents: InstallateurLinkedFile[];
  bills?: InstallateurLinkedFile[];
  bank_statements?: InstallateurLinkedFile[];
  roof_images?: InstallateurLinkedFile[];
};

export type InstallateurOnboardingDocsPatch = {
  trade_register_file_id?: string | null;
  rne_file_id?: string | null;
  cin_document_file_ids?: string[] | null;
  bill_file_ids?: string[] | null;
  bank_statement_file_ids?: string[] | null;
  roof_image_file_ids?: string[] | null;
};

export const installateurApi = {
  register: async (
    data: RegisterInstallateurRequest,
  ): Promise<RegisterInstallateurResponse> => {
    const response = await apiClient.post<RegisterInstallateurResponse>(
      "/installateurs/register",
      data,
    );
    return response.data;
  },

  listClients: async (q?: string): Promise<InstallateurClient[]> => {
    const response = await apiClient.get<{ clients: InstallateurClient[] }>(
      "/installateurs/clients",
      { params: q ? { q } : undefined },
    );
    return response.data.clients;
  },

  createClient: async (
    data: CreateInstallateurClientRequest,
  ): Promise<CreateInstallateurClientResponse> => {
    const response = await apiClient.post<CreateInstallateurClientResponse>(
      "/installateurs/clients",
      data,
    );
    return response.data;
  },

  getClientSiteDocs: async (
    companyId: string,
    siteId: string,
  ): Promise<InstallateurSiteDocs> => {
    const response = await apiClient.get<InstallateurSiteDocs>(
      `/installateurs/clients/${companyId}/sites/${siteId}/pv-docs`,
    );
    return response.data;
  },

  updateClientSiteDocs: async (
    companyId: string,
    siteId: string,
    payload: {
      devis_file_id?: string | null;
      pvsys_file_id?: string | null;
      autres_file_ids?: string[] | null;
    },
  ): Promise<InstallateurSiteDocs> => {
    const response = await apiClient.patch<InstallateurSiteDocs>(
      `/installateurs/clients/${companyId}/sites/${siteId}/pv-docs`,
      payload,
    );
    return response.data;
  },

  getClientOnboardingDocs: async (
    companyId: string,
  ): Promise<InstallateurOnboardingDocs> => {
    const response = await apiClient.get<InstallateurOnboardingDocs>(
      `/installateurs/clients/${companyId}/onboarding-docs`,
    );
    return response.data;
  },

  updateClientOnboardingDocs: async (
    companyId: string,
    payload: InstallateurOnboardingDocsPatch,
  ): Promise<InstallateurOnboardingDocs> => {
    const response = await apiClient.patch<InstallateurOnboardingDocs>(
      `/installateurs/clients/${companyId}/onboarding-docs`,
      payload,
    );
    return response.data;
  },
};
