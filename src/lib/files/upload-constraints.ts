import { LinkTarget, UploadKind } from "@/lib/files/api";

export const DEFAULT_MAX_FILES = {
  single: 1,
  multiple: 20,
} as const;

const LINK_TARGET_MAX_FILES: Partial<Record<LinkTarget, number>> = {
  company_trade_register: 1,
  company_rne: 1,
  company_manager_cin_document: 2,
  company_bill: 20,
  company_roof_image: 1000,
  company_balance_sheet: 20,
  company_bank_statement: 20,
  company_insurance_document: 20,
  company_warranty_document: 20,
  company_contract_document: 20,
  company_client_invoice: 120,
};

export function inferUploadKindFromMime(mimeType: string): UploadKind {
  if (
    mimeType === "application/pdf" ||
    mimeType === "application/octet-stream" ||
    mimeType === "model/vnd.sketchup.skp"
  ) {
    return "pdf";
  }
  if (mimeType.startsWith("image/")) return "image";
  return "excel";
}

export function resolveMaxFiles(
  multiple: boolean,
  overrideMaxFiles?: number,
  linkTarget?: LinkTarget,
): number {
  if (typeof overrideMaxFiles === "number" && overrideMaxFiles > 0) {
    return overrideMaxFiles;
  }
  if (linkTarget && LINK_TARGET_MAX_FILES[linkTarget]) {
    return LINK_TARGET_MAX_FILES[linkTarget] as number;
  }
  return multiple ? DEFAULT_MAX_FILES.multiple : DEFAULT_MAX_FILES.single;
}
