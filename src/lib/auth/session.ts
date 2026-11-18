import { authApi } from "@/lib/auth/api";
import { connectSocket, updateSocketAuth } from "@/lib/socket/client";
import { appStorage } from "@/platform/storage";

const LEGACY_TOKEN_KEYS = ["token", "refreshToken"] as const;

/** Remove tokens persisted before the httpOnly cookie migration. */
export function clearLegacyAuthStorage(): void {
  for (const key of LEGACY_TOKEN_KEYS) {
    appStorage.removeItem(key);
  }
}

export async function connectSocketFromSession(): Promise<void> {
  const { accessToken } = await authApi.getSocketToken();
  connectSocket(accessToken);
  updateSocketAuth(accessToken);
}
