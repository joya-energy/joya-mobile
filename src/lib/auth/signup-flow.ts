import { sessionStorage } from "@/platform/storage";

const PASSWORD_TOKEN_KEY = "joya_signup_password_token";
const LEAD_FACTURE_PREFIX = "joya_lead_facture_";

export function storeLeadFacture(leadId: string, facture: number) {
  sessionStorage.setItem(`${LEAD_FACTURE_PREFIX}${leadId}`, String(facture));
}

export function readLeadFacture(leadId: string): number | null {
  const raw = sessionStorage.getItem(`${LEAD_FACTURE_PREFIX}${leadId}`);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function storePasswordSetupToken(token: string) {
  sessionStorage.setItem(PASSWORD_TOKEN_KEY, token);
}

export function readPasswordSetupToken(): string | null {
  return sessionStorage.getItem(PASSWORD_TOKEN_KEY);
}

export function clearSignupFlowSession(leadId?: string) {
  sessionStorage.removeItem(PASSWORD_TOKEN_KEY);
  if (leadId) {
    sessionStorage.removeItem(`${LEAD_FACTURE_PREFIX}${leadId}`);
  }
}
