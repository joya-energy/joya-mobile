import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { resolveApiV1BaseUrl } from "@/lib/api-base-url";
import { HTTP_STATUS } from "@/types/httpStatus";
import {
  clearSecureTokens,
  getAccessTokenSync,
  getRefreshTokenSync,
  setSecureTokens,
} from "@/platform/secure-storage";
import { AUTH_REDIRECT_LOGIN, appEvents } from "@/platform/events";

const API_V1_BASE = resolveApiV1BaseUrl();

type QueuedRequest = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

function notifyAuthRedirect() {
  appEvents.emit(AUTH_REDIRECT_LOGIN);
}

export const apiClient = axios.create({
  baseURL: API_V1_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshAxios = axios.create({
  baseURL: API_V1_BASE,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const accessToken = getAccessTokenSync();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  // Native stacks may auto-attach Set-Cookie from login; cookies + bad Origin
  // trip CSRF on core-api. Mobile auth is Bearer-only — never send Cookie.
  if (config.headers) {
    delete (config.headers as Record<string, unknown>).Cookie;
    delete (config.headers as Record<string, unknown>).cookie;
    config.headers.set?.("Cookie", "");
  }
  return config;
});

apiClient.defaults.withCredentials = false;
refreshAxios.defaults.withCredentials = false;

const AUTH_ENDPOINTS_401_OK = [
  "/auth/login",
  "/auth/register",
  "/users/register",
  "/auth/logout",
  "/auth/impersonate/consume",
];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (
      error.response?.status !== HTTP_STATUS.UNAUTHORIZED ||
      !originalRequest ||
      (originalRequest as { _retry?: boolean })._retry
    ) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? "";
    if (AUTH_ENDPOINTS_401_OK.some((path) => requestUrl.includes(path))) {
      return Promise.reject(error);
    }

    (originalRequest as { _retry?: boolean })._retry = true;

    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => apiClient(originalRequest));
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshTokenSync();
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await refreshAxios.post<{
        accessToken?: string;
        refreshToken?: string;
      }>("/auth/refresh", { refreshToken });

      if (!data.accessToken || !data.refreshToken) {
        throw new Error("Refresh response missing tokens");
      }

      await setSecureTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      processQueue(null);
      return apiClient(originalRequest);
    } catch (err) {
      processQueue(err);
      await clearSecureTokens();
      notifyAuthRedirect();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

function processQueue(err: unknown): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
  failedQueue = [];
}

export default apiClient;
