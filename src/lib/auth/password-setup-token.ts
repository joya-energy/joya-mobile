/**
 * Password-setup / reset tokens from core-api:
 * - legacy: 24-char hex Mongo ObjectId
 * - current: crypto.randomBytes(32).toString("base64url") (~43 chars)
 * Backend accepts 24–128 chars (auth.validation resetPassword).
 */
const PASSWORD_SETUP_TOKEN_REGEX = /^[A-Za-z0-9_-]{24,128}$/;

export function normalizePasswordSetupToken(
  token: string | null | undefined,
): string | undefined {
  const value = token?.trim();
  return value || undefined;
}

export function isPasswordSetupToken(
  token: string | null | undefined,
): token is string {
  const value = normalizePasswordSetupToken(token);
  return Boolean(value && PASSWORD_SETUP_TOKEN_REGEX.test(value));
}
