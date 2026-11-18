/**
 * Mobile always talks directly to core-api (no Next.js /V1 BFF).
 * Set EXPO_PUBLIC_API_URL to the reachable host (LAN IP for devices).
 */
export function resolveApiV1BaseUrl(): string {
  const raw = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:8005").trim();
  const base = raw.replace(/\/$/, "");
  return `${base}/V1`;
}

export function resolveSocketUrl(): string {
  return (process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:8006").trim();
}
