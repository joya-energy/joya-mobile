type NotificationHrefInput = {
  type?: string | null;
  actionUrl?: string | null;
};

const MONITORING = "/client/monitoring";
// Expo Router has no URL hash on native: the informations screen reads `section`.
const REPORTS = "/client/informations?section=impact-environnemental";
const BILLS = "/client/informations?section=factures";
const INFORMATIONS = "/client/informations";
const CONSUMPTION = "/client/consumption";

/** Alerts and reports can deep-link. Informational “mise à jour” items do not. */
const ACTION_HREF_BY_TYPE: Record<string, string> = {
  "asset.offline": MONITORING,
  "asset.degraded": MONITORING,
  "pv.inverter_stale": MONITORING,
  "pv.zero_power_high_irradiance": MONITORING,
  "pv.sudden_power_drop": MONITORING,
  "pv.power_oscillation": MONITORING,
  "pv.recurrent_shading": MONITORING,
  "pv.underperforming_vs_fleet": MONITORING,
  "report.environmental_monthly": REPORTS,
  "invoice.monthly_available": BILLS,
  "dossier.revision_requested": INFORMATIONS,
};

export function customerNotificationHref(
  item: NotificationHrefInput,
): string | null {
  const type = item.type?.trim();
  if (type?.startsWith("efficiency.")) {
    return item.actionUrl || CONSUMPTION;
  }
  if (type && ACTION_HREF_BY_TYPE[type]) {
    return ACTION_HREF_BY_TYPE[type];
  }
  return null;
}
