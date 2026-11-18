import type { UploadFileRef } from "@/lib/files/api";
import { onboardingApi } from "@/lib/onboarding/api";
import { fetchOnboardingSummary } from "@/lib/onboarding/fetch-onboarding-summary";

export type OnboardingDocumentsState = {
  tradeRegister: UploadFileRef[];
  rne: UploadFileRef[];
  cin: UploadFileRef[];
  stegBills: UploadFileRef[];
  roofImages: UploadFileRef[];
  roofOwnership: UploadFileRef[];
  electricalPanel: UploadFileRef[];
  meter: UploadFileRef[];
  balanceSheets: UploadFileRef[];
  bankStatements: UploadFileRef[];
  rib: UploadFileRef[];
  taxDeclaration: UploadFileRef[];
  authorizesAnalysis: boolean;
  certifiesLegalRep: boolean;
  certifiesAccuracy: boolean;
  companyFields: {
    legal_name: string;
    tax_id: string;
    installation_address: string;
    gouvernorat: string;
    sector: string;
  };
  managerFields: Record<string, unknown>;
  siteInfo: Record<string, unknown>;
  financeInfo: Record<string, unknown>;
  power: string;
};

export type SubmitOnboardingUser = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phoneE164?: string | null;
};

const EMPTY_COMPANY_FIELDS = {
  legal_name: "",
  tax_id: "",
  installation_address: "",
  gouvernorat: "",
  sector: "",
};

function isPlaceholderPhone(value: unknown): boolean {
  const digits = String(value ?? "").replace(/\D/g, "");
  return !digits || /^0+$/.test(digits);
}

/** Prefer form value, then account phone — never invent 00000000. */
function resolveOnboardingPhone(
  managerPhone: unknown,
  user: SubmitOnboardingUser | undefined,
): string | undefined {
  const fromForm = String(managerPhone ?? "").trim();
  if (fromForm && !isPlaceholderPhone(fromForm)) return fromForm;
  const fromUser = String(user?.phoneE164 || user?.phone || "").trim();
  if (fromUser && !isPlaceholderPhone(fromUser)) return fromUser;
  return undefined;
}

function firstFileId(files: UploadFileRef[]): string | undefined {
  const id = files[0]?.fileId?.trim();
  return id || undefined;
}

function toFileIds(files: UploadFileRef[]): { fileId: string }[] {
  return files
    .filter((f) => f.fileId?.trim())
    .map((f) => ({ fileId: String(f.fileId).trim() }));
}

function optionalFileId(files: UploadFileRef[]): string | undefined {
  return firstFileId(files);
}

function financeSituationPayload(ribId?: string, taxId?: string) {
  return {
    current_credit: false,
    ...(ribId ? { rib_file_id: ribId } : {}),
    ...(taxId ? { tax_declaration_file_id: taxId } : {}),
  };
}

function compactRecord(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value == null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    }),
  );
}

function roofAndSitePayload(siteInfo: Record<string, unknown>, state: OnboardingDocumentsState) {
  return {
    ...compactRecord(siteInfo),
    ...(optionalFileId(state.roofOwnership)
      ? { roof_ownership_proof_file_id: optionalFileId(state.roofOwnership) }
      : {}),
    ...(optionalFileId(state.electricalPanel)
      ? { electrical_panel_img_file_id: optionalFileId(state.electricalPanel) }
      : {}),
    ...(optionalFileId(state.meter)
      ? { meter_img_file_id: optionalFileId(state.meter) }
      : {}),
  };
}

function managerPayload(
  state: OnboardingDocumentsState,
  user: SubmitOnboardingUser | undefined,
) {
  const manager = state.managerFields;
  const cinDocs = toFileIds(state.cin);
  const phoneNumber = resolveOnboardingPhone(manager.phone_number, user);
  return {
    full_name:
      String(manager.full_name || user?.full_name || "").trim() || "Représentant",
    cin_number: String(manager.cin_number || "").trim() || undefined,
    email: String(manager.email || user?.email || "").trim() || undefined,
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    address: String(manager.address || "").trim() || undefined,
    role: String(manager.role || "MANAGER"),
    ...(manager.ownership_pct != null
      ? { ownership_pct: Number(manager.ownership_pct) }
      : {}),
    cin_documents: cinDocs,
    ...(cinDocs[0] ? { cin_document_file_id: cinDocs[0].fileId } : {}),
    certifies_legal_representative: state.certifiesLegalRep,
    certifies_info_accuracy: state.certifiesAccuracy,
  };
}

function contactPayload(
  state: OnboardingDocumentsState,
  user: SubmitOnboardingUser | undefined,
  companyLegalName?: string,
) {
  const manager = state.managerFields;
  const phoneNumber = resolveOnboardingPhone(manager.phone_number, user);
  return {
    full_name:
      String(manager.full_name || user?.full_name || companyLegalName || "").trim() ||
      "Contact",
    role: "CEO" as const,
    ...(phoneNumber ? { phone_number: phoneNumber } : {}),
    email: String(manager.email || user?.email || "").trim() || undefined,
    authorizes_analysis: state.authorizesAnalysis,
    status: "SUBMITTED" as const,
  };
}

export async function loadOnboardingDocuments(
  companyId: string | null,
): Promise<OnboardingDocumentsState> {
  const step1 = await onboardingApi.getStep1();
  const id = companyId || (step1?._id ? String(step1._id) : null);

  if (!id) {
    return {
      tradeRegister: [],
      rne: [],
      cin: [],
      stegBills: [],
      roofImages: [],
      roofOwnership: [],
      electricalPanel: [],
      meter: [],
      balanceSheets: [],
      bankStatements: [],
      rib: [],
      taxDeclaration: [],
      authorizesAnalysis: false,
      certifiesLegalRep: false,
      certifiesAccuracy: false,
      companyFields: { ...EMPTY_COMPANY_FIELDS },
      managerFields: {},
      siteInfo: {},
      financeInfo: {},
      power: "",
    };
  }

  const summary = await fetchOnboardingSummary(id);
  return {
    tradeRegister: summary.files.tradeRegister,
    rne: summary.files.rne,
    cin: summary.files.cin,
    stegBills: summary.files.bills,
    roofImages: summary.files.roofImages,
    roofOwnership: summary.files.roofOwnership,
    electricalPanel: summary.files.electricalPanel,
    meter: summary.files.meter,
    balanceSheets: summary.files.balanceSheets,
    bankStatements: summary.files.bankStatements,
    rib: summary.files.rib,
    taxDeclaration: summary.files.taxDeclaration,
    authorizesAnalysis: Boolean(summary.contact.authorizes_analysis),
    certifiesLegalRep: Boolean(summary.manager.certifies_legal_representative),
    certifiesAccuracy: Boolean(summary.manager.certifies_info_accuracy),
    companyFields: {
      legal_name: String(summary.company.legal_name || ""),
      tax_id: String(summary.company.tax_id || ""),
      installation_address: String(summary.company.installation_address || ""),
      gouvernorat: String(summary.company.gouvernorat || ""),
      sector: String(summary.company.sector || ""),
    },
    managerFields: { ...summary.manager },
    siteInfo: { ...summary.site },
    financeInfo: { ...summary.finance },
    power:
      summary.energy.power != null && summary.energy.power !== ""
        ? String(summary.energy.power)
        : "",
  };
}

/**
 * Persists all onboarding sections (steps 1–6) and marks the dossier as SUBMITTED.
 */
export async function submitOnboardingDossier(
  companyId: string,
  state: OnboardingDocumentsState,
  user?: SubmitOnboardingUser,
): Promise<string> {
  const tradeId = firstFileId(state.tradeRegister);
  const rneId = firstFileId(state.rne);
  const cinId = firstFileId(state.cin);
  const hasSteg = state.stegBills.some((f) => f.fileId?.trim());
  const hasBank = state.bankStatements.some((f) => f.fileId?.trim());
  const ribId = firstFileId(state.rib);
  const taxId = firstFileId(state.taxDeclaration);

  if (!tradeId || !rneId || !cinId || !hasSteg || !hasBank) {
    throw new Error(
      "Documents requis manquants (registre de commerce, RNE, CIN, facture STEG ou extrait bancaire).",
    );
  }

  const step1Res = await onboardingApi.saveStep1({
    legal_name: state.companyFields.legal_name?.trim() || undefined,
    tax_id: (state.companyFields.tax_id || "").replace(/\//g, ""),
    installation_address: state.companyFields.installation_address?.trim() || " ",
    gouvernorat: state.companyFields.gouvernorat?.trim() || " ",
    sector: state.companyFields.sector?.trim() || " ",
    trade_register_file_id: firstFileId(state.tradeRegister),
    rne_file_id: firstFileId(state.rne),
  });

  const id = String(step1Res?._id || step1Res?.id || companyId);

  await onboardingApi.saveStep(2, id, managerPayload(state, user));

  await onboardingApi.saveStep(3, id, {
    bills: toFileIds(state.stegBills),
    ...(state.power ? { power: Number(state.power) } : {}),
  });

  await onboardingApi.saveStep(4, id, {
    roofImages: toFileIds(state.roofImages),
    roofAndSiteInfo: roofAndSitePayload(state.siteInfo, state),
  });

  await onboardingApi.saveStep(5, id, {
    balanceSheets: toFileIds(state.balanceSheets),
    bankStatements: toFileIds(state.bankStatements),
    financialSituation: financeSituationPayload(ribId, taxId),
  });

  const summary = await fetchOnboardingSummary(id);

  await onboardingApi.saveStep(6, id, contactPayload(state, user, summary.company.legal_name));

  return id;
}
