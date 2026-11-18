import type {
  ClientDashboardSite,
  ClientDashboardSiteApi,
} from "@/types/dashboard";
import {
  clientDashboardOptionalNumber,
  clientDashboardOptionalText,
  clientDashboardText,
} from "./defaults";
import { emptyClientDashboardSite } from "./empty-dashboard-data";

/** Site banner date (e.g. "lundi 18 mai 2026"). */
export function formatClientDashboardDayLabel(date = new Date()): string {
  const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(
    date,
  );
  const rest = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return `${weekday} ${rest}`;
}

/** Compact date for mobile banner (e.g. "18 mai 2026"). */
export function formatClientDashboardDateShort(date = new Date()): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Short site title (e.g. "Parc Solaire — Site Nord" → "Site Nord"). */
export function getClientDashboardSiteName(siteName: string): string {
  const parts = siteName.split(/\s*[—–-]\s*/);
  if (parts.length > 1) return parts[parts.length - 1].trim();
  return siteName;
}

/** Mobile banner subtitle (e.g. "Tunis · 18 mai 2026"). */
export function formatClientDashboardMobileSubtitle(
  siteLocation: string,
  dayLabel: string,
): string {
  const date = dayLabel.trim()
    ? dayLabel.replace(/^[a-zéèêàùûîôäëü]+\s+/i, "")
    : formatClientDashboardDateShort();
  return `${siteLocation} · ${date}`;
}

/** Maps API site JSON → `ClientDashboardSite` for the banner. */
export function toClientDashboardSite(
  raw?: ClientDashboardSiteApi,
): ClientDashboardSite {
  if (!raw) return emptyClientDashboardSite;

  return {
    siteName: clientDashboardText(raw.siteName ?? raw.site_name),
    siteLocation: clientDashboardText(raw.siteLocation ?? raw.site_location),
    latitude: clientDashboardOptionalNumber(raw.latitude ?? raw.lat),
    longitude: clientDashboardOptionalNumber(
      raw.longitude ?? raw.lon ?? raw.lng,
    ),
    timezone: raw.timezone ?? raw.time_zone,
    status: raw.status ?? "offline",
    statusLabel: clientDashboardText(raw.statusLabel ?? raw.status_label),
    currentProductionKw: clientDashboardOptionalNumber(
      raw.currentProductionKw ?? raw.current_production_kw,
    ),
    currentProductionLabel: clientDashboardText(
      raw.currentProductionLabel ?? raw.current_production_label,
    ),
    temperatureLabel: clientDashboardText(
      raw.temperatureLabel ?? raw.temperature_label,
    ),
    dayLabel:
      raw.dayLabel?.trim() ||
      raw.day_label?.trim() ||
      formatClientDashboardDayLabel(),
    temperatureCelsius: clientDashboardOptionalNumber(
      raw.temperatureCelsius ?? raw.temperature_celsius,
    ),
    humidityLabel: clientDashboardText(raw.humidityLabel ?? raw.humidity_label),
    humidityPercent: clientDashboardOptionalNumber(
      raw.humidityPercent ?? raw.humidity_percent,
    ),
    lastUpdatedAt: clientDashboardText(
      raw.lastUpdatedAt ?? raw.last_updated_at,
    ),
    addressLine: clientDashboardText(raw.addressLine ?? raw.address_line),
    installedCapacityLabel: clientDashboardText(
      raw.installedCapacityLabel ?? raw.installed_capacity_label,
    ),
    theoreticalProductionLabel: clientDashboardText(
      raw.theoreticalProductionLabel ?? raw.theoretical_production_label,
    ),
    theoreticalProductionValue: clientDashboardText(
      raw.theoreticalProductionValue ?? raw.theoretical_production_value,
    ),
    theoreticalProductionFootnote:
      clientDashboardOptionalText(
        raw.theoreticalProductionFootnote ??
          raw.theoretical_production_footnote,
      ) ?? "",
    inServiceSinceLabel: clientDashboardText(
      raw.inServiceSinceLabel ?? raw.in_service_since_label,
    ),
    contactName: clientDashboardText(raw.contactName ?? raw.contact_name),
  };
}
