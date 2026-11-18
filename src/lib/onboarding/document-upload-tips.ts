/** Conseils courts pour chaque zone de dépôt — affichés dans le formulaire onboarding. */
export const ONBOARDING_DOCUMENT_TIPS = {
  tradeRegister:
    "Registre de commerce (scan ou PDF lisible). Document obligatoire.",
  rne:
    "Extrait RNE officiel (registre-entreprises.tn). Vérifiez que la raison sociale et l'« IDENTIFIANT UNIQUE » sont visibles.",
  cin:
    "CIN du gérant : 1 PDF (recto+verso) ou 2 photos séparées (recto et verso). Netteté et validité obligatoires — nom et numéro lisibles.",
  stegBills:
    "Factures STEG du site à équiper. Préférez le PDF complet (adresse + puissance visibles). Évitez les captures recadrées.",
  roofImages:
    "Photos du site et de la toiture, sous plusieurs angles. Vous pouvez en ajouter autant que nécessaire.",
  roofOwnership:
    "Titre de propriété, bail ou attestation pour le bâtiment. Optionnel sauf demande de notre équipe.",
  electricalPanel:
    "Photo du tableau électrique principal. Optionnel — utile pour l'étude technique.",
  meter:
    "Photo du compteur électrique STEG. Optionnel.",
  balanceSheets:
    "Bilans ou états financiers récents (idéalement 2 exercices). Optionnel.",
  bankStatements:
    "Relevés bancaires récents du compte professionnel de l'entreprise. Document obligatoire.",
  rib:
    "RIB ou IBAN au nom de l'entreprise (pas un compte personnel). Optionnel.",
  taxDeclaration:
    "Déclaration IS ou liasse fiscale. Optionnel.",
} as const;

export type OnboardingDocumentTipKey = keyof typeof ONBOARDING_DOCUMENT_TIPS;
