export const ONBOARDING_REVISION_ITEM_IDS = [
  "company_trade_register",
  "company_rne",
  "manager_cin",
  "company_bill",
  "company_roof_image",
  "roof_ownership",
  "electrical_panel",
  "meter",
  "company_balance_sheet",
  "company_bank_statement",
  "company_rib_document",
  "company_tax_declaration_document",
] as const;

export type OnboardingRevisionItemId =
  (typeof ONBOARDING_REVISION_ITEM_IDS)[number];

export const ONBOARDING_REVISION_ITEM_LABELS: Record<
  OnboardingRevisionItemId,
  string
> = {
  company_trade_register: "Registre de commerce",
  company_rne: "RNE",
  manager_cin: "CIN gérant",
  company_bill: "Factures STEG",
  company_roof_image: "Photos de site / toiture",
  roof_ownership: "Preuve de propriété toiture",
  electrical_panel: "Tableau électrique",
  meter: "Compteur électrique",
  company_balance_sheet: "Bilans",
  company_bank_statement: "Extraits bancaires",
  company_rib_document: "RIB",
  company_tax_declaration_document: "Déclaration fiscale",
};

export function isRevisionItemFlagged(
  itemId: OnboardingRevisionItemId,
  revisionItems: string[],
): boolean {
  return revisionItems.includes(itemId);
}
