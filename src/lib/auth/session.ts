import { authApi } from "@/lib/auth/api";
import { connectSocket, updateSocketAuth } from "@/lib/socket/client";

const LEGACY_TOKEN_KEYS = ["token", "refreshToken"] as const;

/** Remove tokens persisted before the httpOnly cookie migration. */
export function clearLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;
  for (const key of LEGACY_TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
}

export async function connectSocketFromSession(): Promise<void> {
  const { accessToken } = await authApi.getSocketToken();
  connectSocket(accessToken);
  updateSocketAuth(accessToken);
}
