import { apiClient } from "@/lib/api";

export type CompanyMember = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
};

export const companyMembersApi = {
  async list(companyId: string): Promise<CompanyMember[]> {
    const response = await apiClient.get<{ members: CompanyMember[] }>(
      `/companies/${companyId}/members`,
    );
    return response.data.members ?? [];
  },

  async invite(
    companyId: string,
    payload: { email: string; full_name?: string },
  ): Promise<{ member: CompanyMember; email_sent: boolean }> {
    const response = await apiClient.post<{
      member: CompanyMember;
      email_sent: boolean;
    }>(`/companies/${companyId}/members/invite`, payload);
    return response.data;
  },

  async resend(
    companyId: string,
    memberId: string,
  ): Promise<{ email_sent: boolean }> {
    const response = await apiClient.post<{ email_sent: boolean }>(
      `/companies/${companyId}/members/${memberId}/resend`,
    );
    return response.data;
  },

  async revoke(companyId: string, memberId: string): Promise<CompanyMember> {
    const response = await apiClient.delete<{ member: CompanyMember }>(
      `/companies/${companyId}/members/${memberId}`,
    );
    return response.data.member;
  },
};
