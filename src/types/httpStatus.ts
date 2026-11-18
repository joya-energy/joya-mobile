/**
 * HTTP status codes – single source of truth for frontend and backend.
 * Use these constants everywhere instead of magic numbers to avoid drift (e.g. 401 vs 403).
 *
 * Auth semantics:
 * - 401 Unauthorized: Not authenticated (no token, invalid token, or expired token).
 *   Client should try refresh token or redirect to login.
 * - 403 Forbidden: Authenticated but not allowed (e.g. admin-only route).
 *   Client should not retry with refresh; show "access denied".
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  /** Not authenticated – no token, invalid, or expired. Use for auth middleware when token fails. */
  UNAUTHORIZED: 401,
  /** Authenticated but not allowed – e.g. requireAdmin. Do not use for invalid/expired token. */
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,

  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
