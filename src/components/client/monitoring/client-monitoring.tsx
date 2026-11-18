"use client";

import { translateUserMessage } from "@/lib/user-messages";
import { useClientDashboard } from "@/hooks/use-client-dashboard";
import { DashboardChartsSection } from "@/components/client/dashboard/dashboard-charts-section";
import { DashboardInvertersSection } from "@/components/client/dashboard/dashboard-inverters-section";
import { DeviceScopeLoadingOverlay } from "@/components/client/device-scope-loading-overlay";
import { useDeviceScope } from "@/contexts/device-scope-context";
import {
  inverterFromSite,
  mergeDashboardInverters,
} from "@/lib/dashboard/inverters";
import { MonitoringSkeleton } from "./monitoring-skeleton";
import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JoyaErrorState, JoyaPageHeader } from "@/components/joya";

export type ClientMonitoringProps = {
  companyId?: string;
};

export function ClientMonitoring({ companyId }: ClientMonitoringProps) {
  const { activeSite, assetId, inverters: scopedInverters } = useDeviceScope();
  const { data, isLoading, error } = useClientDashboard({
    companyId,
    enabled: true,
  });
  const { data: siteScopeData } = useClientDashboard({
    companyId,
    enabled: true,
    siteScopeOnly: true,
  });
  const dashboard = data ?? siteScopeData;

  if ((isLoading && !dashboard) || !dashboard) {
    return <MonitoringSkeleton />;
  }

  if (error && !dashboard) {
    return (
      <JoyaErrorState
        className="rounded-2xl border border-line bg-white"
        description={translateUserMessage(
          error.message,
          "Impossible de charger les données. Vérifiez la connexion ou réessayez plus tard.",
        )}
      />
    );
  }

  const mergedInverters = mergeDashboardInverters(
    scopedInverters,
    siteScopeData?.inverters,
    data?.inverters,
  );
  const allSiteInverters =
    mergedInverters.length > 0
      ? mergedInverters
      : [
          inverterFromSite(
            dashboard.site,
            dashboard.scopeSiteId ?? siteScopeData?.scopeSiteId,
          ),
        ];
  const invertersForCard =
    assetId && allSiteInverters.some((inverter) => inverter.id === assetId)
      ? allSiteInverters.filter((inverter) => inverter.id === assetId)
      : allSiteInverters;
  const showAggregateView = !assetId && invertersForCard.length > 1;

  return (
    <div className="joya-stagger relative flex w-full flex-col gap-5 pb-6 lg:gap-6">
      <DeviceScopeLoadingOverlay />
      <JoyaPageHeader
        eyebrow="Supervision"
        image="/brand/images/hero-solar-roof-sunset.jpg"
        title="Suivi de production"
        description="Statut de vos équipements, puissance instantanée, irradiation et historique de production."
        meta={
          activeSite ? (
            <>
              <Badge
                tone="outline"
                size="lg"
                className="border-white/20 bg-white/12 text-white backdrop-blur-sm"
              >
                <Building2 className="h-3.5 w-3.5 text-coral" aria-hidden />
                {activeSite.name}
              </Badge>
              {activeSite.inverterCount > 0 ? (
                <Badge
                  tone="outline"
                  size="lg"
                  className="border-white/20 bg-white/12 font-data text-white backdrop-blur-sm"
                >
                  {activeSite.inverterCount} onduleur{activeSite.inverterCount > 1 ? "s" : ""}
                </Badge>
              ) : null}
            </>
          ) : null
        }
      />

      <DashboardInvertersSection
        inverters={invertersForCard}
        aggregateView={showAggregateView}
        siteCapacityLabel={
          siteScopeData?.site.installedCapacityLabel ??
          dashboard.site.installedCapacityLabel
        }
      />

      <DashboardChartsSection
        companyId={companyId}
        intradayEnabled
        energyByYear={dashboard.energyByYear}
        savingsComparisonByYear={
          siteScopeData?.savingsComparisonByYear ??
          dashboard.savingsComparisonByYear
        }
      />
    </div>
  );
}
