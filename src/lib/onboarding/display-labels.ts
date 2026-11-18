const REVENUE_LABELS: Record<string, string> = {
  under_1M: "Moins de 1 M TND",
  "1_TO_5M": "1 à 5 M TND",
  "5_TO_20M": "5 à 20 M TND",
  OVER_20M: "Plus de 20 M TND",
};

const STEG_LABELS: Record<string, string> = {
  ALWAYS_ON_TIME: "Toujours à jour",
  SOMETIMES_LATE: "Parfois en retard",
};

const SENIORITY_LABELS: Record<string, string> = {
  UNDER_2_YEARS: "Moins de 2 ans",
  "2_TO_5_YEARS": "2 à 5 ans",
  OVER_5_YEARS: "Plus de 5 ans",
};

const SITE_STATUS_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  TENANT: "Locataire",
};

const SITE_TYPE_LABELS: Record<string, string> = {
  FACTORY: "Usine",
  DEPOT: "Dépôt",
  SHOP: "Magasin",
  HOTEL: "Hôtel",
  CLINIC: "Clinique",
  WORKSHOP: "Atelier",
  SCHOOL: "École",
  OFFICE: "Bureau",
  OTHER: "Autre",
};

const ROOF_SURFACE_LABELS: Record<string, string> = {
  UNDER_300: "< 300 m²",
  "300_TO_800": "300 – 800 m²",
  OVER_800: "> 800 m²",
};

export function labelFrom(
  map: Record<string, string>,
  value: string | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  return map[value] ?? map[value.toUpperCase()] ?? value;
}

export const onboardingLabels = {
  annualRevenue: (v?: string) => labelFrom(REVENUE_LABELS, v),
  stegPayment: (v?: string) => labelFrom(STEG_LABELS, v),
  companySeniority: (v?: string) => labelFrom(SENIORITY_LABELS, v),
  siteStatus: (v?: string) => labelFrom(SITE_STATUS_LABELS, v),
  siteType: (v?: string) => labelFrom(SITE_TYPE_LABELS, v),
  roofSurface: (v?: string) => labelFrom(ROOF_SURFACE_LABELS, v),
  yesNo: (v?: string) =>
    v?.toUpperCase() === "YES" ? "Oui" : v?.toUpperCase() === "NO" ? "Non" : "—",
  bool: (v?: boolean) => (v ? "Oui" : "Non"),
};
