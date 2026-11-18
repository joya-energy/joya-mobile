import * as SecureStore from "expo-secure-store";

const ACCESS_KEY = "joya_access_token";
const REFRESH_KEY = "joya_refresh_token";

let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

export async function loadSecureTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  accessTokenMemory = accessToken;
  refreshTokenMemory = refreshToken;
  return { accessToken, refreshToken };
}

export function getAccessTokenSync(): string | null {
  return accessTokenMemory;
}

export function getRefreshTokenSync(): string | null {
  return refreshTokenMemory;
}

export async function setSecureTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  accessTokenMemory = tokens.accessToken;
  refreshTokenMemory = tokens.refreshToken;
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearSecureTokens(): Promise<void> {
  accessTokenMemory = null;
  refreshTokenMemory = null;
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
