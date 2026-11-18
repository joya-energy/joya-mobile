import { apiClient } from "@/lib/api";
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  User,
  LoginResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  VerificationCodeStatusResponse,
  ResendVerificationResponse,
} from "@/types/auth";
import {
  clearSecureTokens,
  getRefreshTokenSync,
  setSecureTokens,
} from "@/platform/secure-storage";

export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      "/users/register",
      data,
    );
    return response.data;
  },

  /**
   * Login user — stores Bearer tokens from the JSON body for mobile.
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", data);
    const body = response.data;
    const accessToken = body.accessToken ?? body.token?.accessToken;
    const refreshToken = body.refreshToken ?? body.token?.refreshToken;
    if (body.is_verified && accessToken && refreshToken) {
      await setSecureTokens({ accessToken, refreshToken });
    }
    return body;
  },

  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>("/users/me", {
      data: { confirmation: "DELETE" },
    });
    await clearSecureTokens();
    return response.data;
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await apiClient.get<{ user: User }>("/users/me");
    return response.data;
  },

  updateAvatar: async (
    fileId: string,
  ): Promise<{ message: string; user: User; avatar: string | null }> => {
    const response = await apiClient.post<{
      message: string;
      user: User;
      avatar: string | null;
    }>("/users/update-avatar", { fileId });
    return response.data;
  },

  updateProfile: async (
    payload: { full_name: string },
  ): Promise<{ message: string; user: User }> => {
    const response = await apiClient.patch<{ message: string; user: User }>(
      "/users/me",
      payload,
    );
    return response.data;
  },

  /**
   * Verify email
   */
  getVerificationCodeStatus: async (
    user_id: string,
  ): Promise<VerificationCodeStatusResponse> => {
    const response = await apiClient.get<VerificationCodeStatusResponse>(
      "/users/verification-code-status",
      { params: { user_id } },
    );
    return response.data;
  },

  verifyEmail: async (
    data: VerifyEmailRequest,
  ): Promise<VerifyEmailResponse> => {
    const response = await apiClient.post<VerifyEmailResponse>(
      "/users/verify-email",
      data,
    );
    return response.data;
  },

  /**
   * Resend email verification
   */
  resendEmailVerification: async (
    user_id: string,
  ): Promise<ResendVerificationResponse> => {
    const response = await apiClient.post<ResendVerificationResponse>(
      "/users/resend-verification-code",
      {
        user_id,
      },
    );
    return response.data;
  },

  /**
   * Logout
   */

  getSocketToken: async (): Promise<{ accessToken: string }> => {
    const response = await apiClient.get<{ accessToken: string }>(
      "/auth/socket-token",
    );
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const refreshToken = getRefreshTokenSync();
    try {
      const response = await apiClient.post<{ message: string }>(
        "/auth/logout",
        refreshToken ? { refreshToken } : {},
      );
      return response.data;
    } finally {
      await clearSecureTokens();
    }
  },

  consumeImpersonation: async (
    code: string,
  ): Promise<{
    message: string;
    expiresAt: string;
    user: { id: string; email: string; full_name?: string; role?: string };
  }> => {
    const response = await apiClient.post<{
      message: string;
      expiresAt: string;
      user: { id: string; email: string; full_name?: string; role?: string };
    }>("/auth/impersonate/consume", { code });
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/request-password-reset",
      { email },
    );
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      { token, password },
    );
    return response.data;
  },
};
