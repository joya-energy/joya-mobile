import type {
  ClientDashboardSite,
  DashboardInverter,
  DashboardInverterApiItem,
  DashboardInverterStatus,
} from "@/types/dashboard";
import {
  CLIENT_DASHBOARD_MISSING,
  clientDashboardOptionalNumber,
  clientDashboardOptionalText,
  clientDashboardText,
} from "./defaults";

const INVERTER_STATUSES: DashboardInverterStatus[] = [
  "connected",
  "degraded",
  "offline",
  "unknown",
];

function normalizeInverterStatus(
  value: string | undefined,
): DashboardInverterStatus {
  if (value && INVERTER_STATUSES.includes(value as DashboardInverterStatus)) {
    return value as DashboardInverterStatus;
  }
  return "unknown";
}

function normalizeInverter(item: DashboardInverterApiItem, index: number): DashboardInverter {
  const status = normalizeInverterStatus(item.status);
  return {
    id: clientDashboardText(item.id) || `inverter-${index}`,
    name: clientDashboardText(item.name) || `Onduleur ${index + 1}`,
    status,
    statusLabel: clientDashboardText(item.statusLabel ?? item.status_label) || "Statut inconnu",
    manufacturer: clientDashboardOptionalText(item.manufacturer),
    model: clientDashboardOptionalText(item.model),
    serialNumber: clientDashboardOptionalText(item.serialNumber ?? item.serial_number),
    ratedPowerKw: clientDashboardOptionalNumber(item.ratedPowerKw ?? item.rated_power_kw),
    ratedPowerLabel: clientDashboardOptionalText(
      item.ratedPowerLabel ?? item.rated_power_label,
    ),
    capacityLabel: clientDashboardOptionalText(
      item.capacityLabel ?? item.capacity_label,
    ),
    installationDate: clientDashboardOptionalText(
      item.installationDate ?? item.installation_date,
    ),
    installationDateLabel: clientDashboardOptionalText(
      item.installationDateLabel ?? item.installation_date_label,
    ),
    locationLabel: clientDashboardOptionalText(
      item.locationLabel ?? item.location_label,
    ),
    isProducing: item.isProducing ?? item.is_producing,
    lastProductionRateKw: clientDashboardOptionalNumber(
      item.lastProductionRateKw ?? item.last_production_rate_kw,
    ),
    lastUpdatedAt: clientDashboardOptionalText(
      item.lastUpdatedAt ?? item.last_updated_at,
    ),
  };
}

export function normalizeInverters(
  raw: DashboardInverterApiItem[] | undefined,
): DashboardInverter[] {
  if (!raw?.length) return [];
  return raw.map(normalizeInverter);
}

export function mergeDashboardInverters(
  ...lists: Array<DashboardInverter[] | undefined>
): DashboardInverter[] {
  const byId = new Map<string, DashboardInverter>();
  for (const list of lists) {
    for (const inverter of list ?? []) {
      if (!byId.has(inverter.id)) byId.set(inverter.id, inverter);
    }
  }
  return [...byId.values()];
}

export function inverterFromSite(
  site: ClientDashboardSite,
  siteId?: string | null,
): DashboardInverter {
  return {
    id: siteId?.trim() || "site-inverter",
    name: site.siteName,
    status: site.status === "online" ? "connected" : "offline",
    statusLabel: site.statusLabel,
    locationLabel:
      site.siteLocation !== CLIENT_DASHBOARD_MISSING
        ? site.siteLocation
        : undefined,
    capacityLabel:
      site.installedCapacityLabel !== CLIENT_DASHBOARD_MISSING
        ? site.installedCapacityLabel
        : undefined,
    installationDateLabel:
      site.inServiceSinceLabel !== CLIENT_DASHBOARD_MISSING
        ? site.inServiceSinceLabel
        : undefined,
    lastProductionRateKw: site.currentProductionKw,
    lastUpdatedAt:
      site.lastUpdatedAt !== CLIENT_DASHBOARD_MISSING
        ? site.lastUpdatedAt
        : undefined,
  };
}
