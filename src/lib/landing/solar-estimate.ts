/** Joya Energy — Spec calcul devis estimatif v1.0 (Juin 2026) */

export const SOLAR_ESTIMATE_CONSTANTS = {
  TARIF_STEG: 0.465,
  IRRADIATION: 1600,
  FACTEUR_CO2: 0.4,
  SHARE_MAX: 0.95,
  SHARE_MIN: 0.85,
  CONTRACT_YEARS: 5,
  /** Affichage marketing — % d'économie sur la facture (sidebar estimation). */
  DISPLAY_ECO_FACTURE_PERCENT_MIN: 5,
  DISPLAY_ECO_FACTURE_PERCENT_MAX: 15,
} as const;

export type SolarEstimateResult = {
  factureTtc: number;
  kwc: number;
  co2Tonnes: number;
  redevanceBasse: number;
  redevanceHaute: number;
  ecoNetteMin: number;
  ecoNetteMax: number;
  ecoAnnuellesKwh: number;
  /** % d'économie sur la facture mensuelle (basé sur économie nette min/max). */
  ecoFacturePercentMin: number;
  ecoFacturePercentMax: number;
};

export function computeSolarEstimate(factureTtc: number): SolarEstimateResult {
  const bill =
    Number.isFinite(factureTtc) && factureTtc > 0 ? factureTtc : 1;

  const { TARIF_STEG, IRRADIATION, FACTEUR_CO2, SHARE_MAX, SHARE_MIN } =
    SOLAR_ESTIMATE_CONSTANTS;

  const consoAnnuelleKwh = (bill / TARIF_STEG) * 12;
  const kwc = consoAnnuelleKwh / IRRADIATION;

  const ecoAnnuellesKwh = kwc * IRRADIATION;
  const co2Tonnes = (ecoAnnuellesKwh * FACTEUR_CO2) / 1000;
  const redevanceHaute = (ecoAnnuellesKwh * TARIF_STEG * SHARE_MAX) / 12;
  const redevanceBasse = (ecoAnnuellesKwh * TARIF_STEG * SHARE_MIN) / 12;
  const ecoNetteMin = bill - redevanceHaute;
  const ecoNetteMax = bill - redevanceBasse;
  const toBillPercent = (savings: number) =>
    Math.max(0, (savings / bill) * 100);

  return {
    factureTtc: bill,
    kwc,
    co2Tonnes,
    redevanceBasse,
    redevanceHaute,
    ecoNetteMin,
    ecoNetteMax,
    ecoAnnuellesKwh,
    ecoFacturePercentMin: toBillPercent(ecoNetteMin),
    ecoFacturePercentMax: toBillPercent(ecoNetteMax),
  };
}

export function formatSavingsPercentRange(min: number, max: number): string {
  const round = (n: number) => Math.round(n);
  const low = round(min);
  const high = round(max);
  if (low === high) return `${low}%`;
  return `${low} - ${high}%`;
}

export function formatDtPerMonthRange(low: number, high: number): string {
  const fmt = (n: number) =>
    Math.round(n).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  return `${fmt(low)} - ${fmt(high)}`;
}

export function formatDtPerMonth(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} DT/mois`;
}

export function formatDtPerYear(value: number): string {
  return `${Math.round(value).toLocaleString("fr-FR")} DT/an`;
}

export function formatDtAmount(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

export function formatKwhAmount(value: number): string {
  return Math.round(value).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

export function formatKwcValue(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export function formatTonnesValue(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
