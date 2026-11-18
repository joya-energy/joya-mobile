import type { UploadFileRef } from "@/lib/files/api";
import { onboardingApi } from "@/lib/onboarding/api";
import { mapUploadedList, restoreUploadedFile } from "@/lib/onboarding/restore-file";

export type OnboardingSummary = {
  completion: Record<number, boolean>;
  company: {
    legal_name?: string;
    tax_id?: string;
    installation_address?: string;
    gouvernorat?: string;
    sector?: string;
    power?: string | number;
  };
  manager: {
    full_name?: string;
    cin_number?: string;
    email?: string;
    phone_number?: string;
    address?: string;
    role?: string;
    ownership_pct?: string | number;
    certifies_legal_representative?: boolean;
    certifies_info_accuracy?: boolean;
  };
  contact: {
    authorizes_analysis?: boolean;
  };
  files: {
    tradeRegister: UploadFileRef[];
    rne: UploadFileRef[];
    cin: UploadFileRef[];
    bills: UploadFileRef[];
    roofImages: UploadFileRef[];
    roofOwnership: UploadFileRef[];
    electricalPanel: UploadFileRef[];
    meter: UploadFileRef[];
    balanceSheets: UploadFileRef[];
    bankStatements: UploadFileRef[];
    rib: UploadFileRef[];
    taxDeclaration: UploadFileRef[];
  };
  energy: { power?: string | number };
  site: {
    site_status?: string;
    site_type?: string;
    roof_exploitable?: string;
    roof_surface?: string;
  };
  finance: {
    annual_revenue?: string;
    current_credit?: boolean;
    total_monthly_payment?: string | number;
    steg_payment_history?: string;
    company_seniority?: string;
  };
};

async function singleFile(
  fileId: string | undefined,
  objectKey: string | undefined,
  fallbackName: string,
): Promise<UploadFileRef[]> {
  if (!fileId) return [];
  return [
    await restoreUploadedFile(String(fileId), objectKey || "", fallbackName),
  ];
}

export async function fetchOnboardingSummary(
  companyId: string,
): Promise<OnboardingSummary> {
  const [completion, step1, step2, step3, step4, step5, step6] =
    await Promise.all([
      onboardingApi.getCompletion(companyId),
      onboardingApi.getStep1(),
      onboardingApi.getStepData(2, companyId),
      onboardingApi.getStepData(3, companyId),
      onboardingApi.getStepData(4, companyId),
      onboardingApi.getStepData(5, companyId),
      onboardingApi.getStepData(6, companyId),
    ]);

  const s1 = step1 as Record<string, unknown>;
  const s2 = step2 as Record<string, unknown>;
  const s6 = step6 as Record<string, unknown>;
  const siteInfo = (step4 as { roofAndSiteInfo?: Record<string, unknown> })
    ?.roofAndSiteInfo;
  const financial = (
    step5 as { financialSituation?: Record<string, unknown> }
  )?.financialSituation;

  const [
    tradeRegister,
    rne,
    cin,
    roofOwnership,
    electricalPanel,
    meter,
    rib,
    taxDeclaration,
  ] = await Promise.all([
    singleFile(
      s1.trade_register_file_id as string | undefined,
      s1.trade_register_document as string | undefined,
      "registre-commerce",
    ),
    singleFile(
      s1.rne_file_id as string | undefined,
      s1.rne as string | undefined,
      "rne",
    ),
    Promise.resolve(
      mapUploadedList((step2 as { cin_documents?: unknown }).cin_documents),
    ).then(async (fromList) => {
      if (fromList.length > 0) return fromList;
      return singleFile(
        s2.cin_document_file_id as string | undefined,
        s2.cin_document_object_key as string | undefined,
        "cin",
      );
    }),
    singleFile(
      siteInfo?.roof_ownership_proof_file_id as string | undefined,
      siteInfo?.roof_ownership_proof_object_key as string | undefined,
      "preuve-propriete",
    ),
    singleFile(
      siteInfo?.electrical_panel_img_file_id as string | undefined,
      siteInfo?.electrical_panel_img_object_key as string | undefined,
      "tableau-electrique",
    ),
    singleFile(
      siteInfo?.meter_img_file_id as string | undefined,
      siteInfo?.meter_img_object_key as string | undefined,
      "compteur",
    ),
    singleFile(
      financial?.rib_file_id as string | undefined,
      financial?.rib_object_key as string | undefined,
      "rib",
    ),
    singleFile(
      financial?.tax_declaration_file_id as string | undefined,
      financial?.tax_declaration_object_key as string | undefined,
      "declaration-fiscale",
    ),
  ]);

  return {
    completion,
    company: {
      legal_name: String(s1.legal_name || ""),
      tax_id: String(s1.tax_id || ""),
      installation_address: String(s1.installation_address || ""),
      gouvernorat: String(s1.gouvernorat || ""),
      sector: String(s1.sector || ""),
      power: (step3 as { power?: string | number })?.power,
    },
    manager: {
      full_name: String(s2.full_name || ""),
      cin_number: String(s2.cin_number || ""),
      email: String(s2.email || ""),
      phone_number: String(s2.phone_number || ""),
      address: String(s2.address || ""),
      role: String(s2.role || ""),
      ownership_pct: s2.ownership_pct as string | number | undefined,
      certifies_legal_representative: Boolean(
        s2.certifies_legal_representative,
      ),
      certifies_info_accuracy: Boolean(s2.certifies_info_accuracy),
    },
    contact: {
      authorizes_analysis: Boolean(s6.authorizes_analysis),
    },
    files: {
      tradeRegister,
      rne,
      cin,
      bills: mapUploadedList((step3 as { bills?: unknown })?.bills),
      roofImages: mapUploadedList((step4 as { roofImages?: unknown })?.roofImages),
      roofOwnership,
      electricalPanel,
      meter,
      balanceSheets: mapUploadedList(
        (step5 as { balanceSheets?: unknown })?.balanceSheets,
      ),
      bankStatements: mapUploadedList(
        (step5 as { bankStatements?: unknown })?.bankStatements,
      ),
      rib,
      taxDeclaration,
    },
    energy: {
      power: (step3 as { power?: string | number })?.power,
    },
    site: {
      site_status: String(siteInfo?.site_status || ""),
      site_type: String(siteInfo?.site_type || ""),
      roof_exploitable: String(siteInfo?.roof_exploitable || ""),
      roof_surface: String(siteInfo?.roof_surface || ""),
    },
    finance: {
      annual_revenue: String(financial?.annual_revenue || ""),
      current_credit: !!financial?.current_credit,
      total_monthly_payment: financial?.total_monthly_payment as
        | string
        | number
        | undefined,
      steg_payment_history: String(financial?.steg_payment_history || ""),
      company_seniority: String(financial?.company_seniority || ""),
    },
  };
}
