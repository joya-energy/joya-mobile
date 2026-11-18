import { apiClient } from "@/lib/api";
import { CreateLeadRequest } from "@/types/user";

export const usersApi = {
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> => {
    // Many backends expect snake_case; if yours expects camelCase, use { currentPassword, newPassword }
    const response = await apiClient.post<{ message: string }>(
      "/users/change-password",
      { currentPassword, newPassword },
    );
    return response.data;
  },
  createLead: async (data: CreateLeadRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/users/lead",
      data,
    );
    return response.data;
  },
};
