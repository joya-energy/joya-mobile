/**
 * Shared Auth Types
 * Used by both frontend and backend
 */

// register request/response types
export interface RegisterRequest {
  email: string;
  phone: string;
  full_name: string;
  leadApp: LeadApplication;
}

export interface RegisterResponse {
  message: string;
  /** Canonical identity after Lead→User unification */
  user?: {
    id: string;
    email: string;
  };
  /** @deprecated Compatibility alias — same as user for one release */
  lead: {
    id: string;
    email: string;
  };
  resume_verification?: boolean;
  verification_email_sent?: boolean;
  verification_expires_at?: string;
  verification_created_at?: string;
}

export type LeadSignupDecision = "approved" | "rejected";

export interface VerificationCodeStatusResponse {
  has_active_code: boolean;
  is_verified?: boolean;
  expires_at?: string;
  created_at?: string;
  server_now?: string;
  decision?: LeadSignupDecision;
  already_has_password?: boolean;
  /** Set when a password-setup email was (re)sent; token is never included on status polls. */
  approval_email_sent?: boolean;
  monthly_electricity_bill?: number;
}

export interface ResendVerificationResponse {
  message: string;
  expires_at?: string;
  created_at?: string;
  server_now?: string;
}

// login request/response types
export interface LoginRequest {
  /** E-mail or phone number (API field name kept as `email` for compatibility). */
  email: string;
  password: string;
}

export interface LoginResponse {
  /** Legacy nested shape (unused by current core-api). */
  token?: {
    tokenType: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  /** Flat tokens returned by core-api for mobile Bearer auth. */
  tokenType?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  message: string;
  is_verified: boolean;
  user: {
    id: string;
    email: string;
    role?: string;
    full_name?: string | null;
  };
}

// verify email request/response types
export interface VerifyEmailRequest {
  user_id: string;
  code: string;
}

export interface VerifyEmailResponse {
  message: string;
  decision?: LeadSignupDecision;
  approval_email_sent?: boolean;
  rejection_email_sent?: boolean;
  password_setup_token?: string;
  monthly_electricity_bill?: number;
  already_has_password?: boolean;
}

// refresh token request/response types
export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// Slimmed-down user info used in auth responses
export interface AuthUserResponse {
  id: string;
  phone?: string;
  full_name?: string;
  role?: string;
}

// Auth tokens + user returned by backend auth endpoints
export interface AuthTokensResponse {
  user: AuthUserResponse;
  token:
    | string
    | {
        tokenType: string;
        accessToken: string;
        refreshToken: string;
        expiresIn: string;
      };
  /**
   * Some backend handlers return a separate refreshToken field; keep it loose here
   * so both shapes are assignable.
   */
  refreshToken?: string;
}

// Convenience wrapper for full auth responses (tokens + optional message)
export interface AuthResponse extends AuthTokensResponse {
  message?: string;
}

// Standard auth error payload
export interface AuthError {
  message: string;
  code?: string;
}

// user type used on frontend for authenticated user state
export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  phoneE164?: string;
  role?:
    | "lead"
    | "user"
    | "agent"
    | "admin"
    | "super_admin"
    | "user_manager"
    | "user_technical_referent"
    | "installer"
    | "investor"
    /** @deprecated */
    | "user_gerant"
    /** @deprecated */
    | "user_referent_technique"
    /** @deprecated */
    | "installateur"
    /** @deprecated */
    | "investisseur";
  created_at?: string;
  is_verified?: boolean;
  avatar?: string;
  impersonation?: {
    active: true;
    adminUserId: string;
    expiresAt: string | null;
  } | null;
}

export interface LeadApplication {
  monthlyElectricityBillValue: number;
  annualConsumptionKwh?: number;
  energyProfile: string;
  taxId: string;
  governorate: string;
  buildingType?: string;
  buildingOwnerType?: string;
  revenue?: number;
  sector?: string;
  installationAddress?: string;
  contactName?: string;
  email?: string;
  phoneNumber?: string;
}
