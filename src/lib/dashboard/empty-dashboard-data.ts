import type {
  ClientDashboardSite,
  DashboardEscoContract,
} from "@/types/dashboard";
import { CLIENT_DASHBOARD_MISSING } from "./defaults";

export const emptyClientDashboardSite: ClientDashboardSite = {
  siteName: CLIENT_DASHBOARD_MISSING,
  siteLocation: CLIENT_DASHBOARD_MISSING,
  status: "offline",
  statusLabel: CLIENT_DASHBOARD_MISSING,
  currentProductionLabel: CLIENT_DASHBOARD_MISSING,
  temperatureLabel: CLIENT_DASHBOARD_MISSING,
  dayLabel: CLIENT_DASHBOARD_MISSING,
  humidityLabel: CLIENT_DASHBOARD_MISSING,
  lastUpdatedAt: CLIENT_DASHBOARD_MISSING,
  addressLine: CLIENT_DASHBOARD_MISSING,
  installedCapacityLabel: CLIENT_DASHBOARD_MISSING,
  theoreticalProductionLabel: CLIENT_DASHBOARD_MISSING,
  theoreticalProductionValue: CLIENT_DASHBOARD_MISSING,
  theoreticalProductionFootnote: CLIENT_DASHBOARD_MISSING,
  inServiceSinceLabel: CLIENT_DASHBOARD_MISSING,
  contactName: CLIENT_DASHBOARD_MISSING,
};

export const unconfiguredEscoContract: DashboardEscoContract = {
  configured: false,
  status: "pending",
  statusLabel: "Non configuré",
  monthlyAmountTnd: null,
  totalMonths: 0,
  elapsedMonths: 0,
  durationPercent: 0,
  totalYears: 0,
  years: [],
  startLabel: CLIENT_DASHBOARD_MISSING,
  endLabel: CLIENT_DASHBOARD_MISSING,
  monthsUntilEnd: 0,
  periodYearsLabel: CLIENT_DASHBOARD_MISSING,
  elapsedMonthsLabel: CLIENT_DASHBOARD_MISSING,
  elapsedHumanLabel: CLIENT_DASHBOARD_MISSING,
  monthlyPerformancePercent: null,
  monthlyPerformanceMonthLabel: null,
};
