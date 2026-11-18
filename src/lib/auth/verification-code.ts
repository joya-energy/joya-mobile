export const VERIFICATION_CODE_TTL_SECONDS = 3 * 60;
export const RESEND_COOLDOWN_SECONDS = 60;

export function parseOtpDigits(raw: string, maxLength = 6): string[] {
  const digits = raw.replace(/\D/g, "").slice(0, maxLength).split("");
  return Array.from({ length: maxLength }, (_, i) => digits[i] ?? "");
}

export function computeRemainingSeconds(
  expiresAt: Date,
  nowMs = Date.now(),
): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - nowMs) / 1000));
}

export function computeResendCooldownSeconds(
  createdAt: Date,
  nowMs = Date.now(),
): number {
  const resendAvailableAt = createdAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000;
  return Math.max(0, Math.ceil((resendAvailableAt - nowMs) / 1000));
}

export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatExpiryTime(expiresAt: Date): string {
  return expiresAt.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatExpiryDateTime(expiresAt: Date): string {
  return expiresAt.toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  if (local.length <= 2) return `${local[0] ?? ""}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export const verifyExpiryStorageKey = (userId: string) =>
  `verify_expires_${userId}`;
export const verifyCreatedStorageKey = (userId: string) =>
  `verify_created_${userId}`;

export function readStoredVerificationWindow(userId: string): {
  expiresAt: Date | null;
  createdAt: Date | null;
} {
  if (typeof window === "undefined") {
    return { expiresAt: null, createdAt: null };
  }
  const expiresRaw = sessionStorage.getItem(verifyExpiryStorageKey(userId));
  const createdRaw = sessionStorage.getItem(verifyCreatedStorageKey(userId));
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  const createdAt = createdRaw ? new Date(createdRaw) : null;
  return {
    expiresAt:
      expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
    createdAt:
      createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null,
  };
}

export function storeVerificationWindow(
  userId: string,
  expiresAt: Date,
  createdAt: Date,
) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(verifyExpiryStorageKey(userId), expiresAt.toISOString());
  sessionStorage.setItem(verifyCreatedStorageKey(userId), createdAt.toISOString());
}
