"use client";

import { useMemo } from "react";
import { translateUserMessage } from "@/lib/user-messages";
import type { ClientDashboardData } from "@/types/dashboard";
import { useClientDashboard } from "@/hooks/use-client-dashboard";
import { useIntradayPower } from "@/hooks/use-intraday-power";
import { useEdgeConsumption } from "@/hooks/use-edge-consumption";
import { useOnboardingSummary } from "@/hooks/use-onboarding-summary";
import { useAuth } from "@/contexts/auth-context";
import { canSeeEscoContract } from "@/lib/auth/roles";
import { DashboardPerformanceSection } from "./dashboard-performance-section";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DeviceScopeLoadingOverlay } from "@/components/client/device-scope-loading-overlay";
import { DashboardAlertsKpiCard } from "./dashboard-alerts-kpi-card";
import { EscoContractCard } from "./esco-contract-card";
import { DashboardHero } from "./dashboard-hero";
import { EnergyOverviewCard } from "./energy-overview-card";
import { JoyaErrorState } from "@/components/joya";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { formatTndSavings } from "@/lib/format/currency";
import { usableTodayProductionKwh } from "@/lib/dashboard/intraday-api";
import {
  DashboardEnergyFlowCard,
  deriveEnergyFlowDayMetrics,
} from "./dashboard-energy-flow-card";

export type ClientDashboardProps = {
  /** Pass API data directly — skips the built-in fetch. */
  data?: ClientDashboardData;
  isLoading?: boolean;
  error?: Error | null;
  companyId?: string;
};

export function ClientDashboard({
  data: dataProp,
  isLoading: isLoadingProp,
  error: errorProp,
  companyId,
}: ClientDashboardProps) {
  const { user } = useAuth();
  const showEscoContract = canSeeEscoContract(user?.role);
  const useHook = dataProp === undefined;
  const {
    data: fetchedData,
    isLoading: fetchLoading,
    isRefreshing: fetchRefreshing,
    enodeSync: fetchEnodeSync,
    error: fetchError,
    refetch,
  } = useClientDashboard({
    companyId,
    enabled: useHook,
    siteScopeOnly: true,
  });

  const data = dataProp ?? fetchedData;
  const isLoading = isLoadingProp ?? (useHook && fetchLoading);
  const isRefreshing = useHook && fetchRefreshing;
  const error = errorProp ?? (useHook ? fetchError : null);
  const { data: intraday } = useIntradayPower({
    companyId,
    enabled: useHook || dataProp !== undefined,
    siteScopeOnly: true,
  });
  const { monitor: edgeMonitor } = useEdgeConsumption({
    enabled: useHook || dataProp !== undefined,
  });
  const isToday = intraday?.date === new Date().toLocaleDateString("en-CA");

  const { summary: onboardingSummary } = useOnboardingSummary();
  const onboardingLocationQuery = onboardingSummary
    ? [
        onboardingSummary.company.installation_address,
        onboardingSummary.company.gouvernorat,
        "Tunisie",
      ]
        .filter(Boolean)
        .join(", ") || null
    : null;

  const todayProductionKwh = usableTodayProductionKwh({
    isToday,
    siteStatus: data?.site.status,
    series: intraday?.series,
    productionKwh: intraday?.dailyTotals.productionKwh,
  });

  const energyFlowMetrics = useMemo(() => {
    return deriveEnergyFlowDayMetrics({
      productionKwh: todayProductionKwh,
      consumptionKwh: isToday
        ? (edgeMonitor?.consumption.today_kwh ?? null)
        : null,
      pvSeries: isToday ? intraday?.series : undefined,
      loadPoints: isToday ? edgeMonitor?.today.points : undefined,
    });
  }, [
    edgeMonitor?.consumption.today_kwh,
    edgeMonitor?.today.points,
    intraday?.series,
    isToday,
    todayProductionKwh,
  ]);

  const dailySavingsValue = useMemo(() => {
    if (todayProductionKwh == null) return CLIENT_DASHBOARD_MISSING;
    return formatTndSavings(intraday?.dailyTotals.savingsTnd ?? 0);
  }, [intraday?.dailyTotals.savingsTnd, todayProductionKwh]);

  const energyFlowUpdatedLabel = useMemo(() => {
    const iso =
      edgeMonitor?.device.last_telemetry_at ?? edgeMonitor?.latest?.t ?? null;
    if (!iso) {
      return data?.site.lastUpdatedAt
        ? `mis à jour ${data.site.lastUpdatedAt}`
        : undefined;
    }
    try {
      const then = new Date(iso).getTime();
      const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
      if (mins < 1) return "mis à jour à l'instant";
      if (mins === 1) return "mis à jour il y a 1 min";
      if (mins < 60) return `mis à jour il y a ${mins} min`;
      return `mis à jour ${new Date(iso).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch {
      return undefined;
    }
  }, [
    data?.site.lastUpdatedAt,
    edgeMonitor?.device.last_telemetry_at,
    edgeMonitor?.latest?.t,
  ]);

  if (error && !data && !isLoading) {
    return (
      <JoyaErrorState
        className="rounded-2xl border border-line bg-white"
        description={translateUserMessage(
          error.message,
          "Impossible de charger les données. Vérifiez la connexion ou réessayez plus tard.",
        )}
        onRetry={useHook ? () => void refetch() : undefined}
      />
    );
  }

  if ((isLoading && !data) || !data) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <JoyaErrorState
        className="rounded-2xl border border-line bg-white"
        description={translateUserMessage(
          error.message,
          "Impossible de charger les données. Vérifiez la connexion ou réessayez plus tard.",
        )}
        onRetry={useHook ? () => void refetch() : undefined}
      />
    );
  }

  return (
    <div className="joya-stagger relative flex w-full flex-col gap-5 pb-6 lg:gap-6">
      <DeviceScopeLoadingOverlay />
      <DashboardHero site={data.site} dailySavingsValue={dailySavingsValue} />
      <DashboardEnergyFlowCard
        site={data.site}
        onboardingLocationQuery={onboardingLocationQuery}
        lastUpdatedLabel={energyFlowUpdatedLabel}
        metrics={energyFlowMetrics}
        onRefresh={useHook ? () => refetch() : undefined}
        isRefreshing={isRefreshing}
        enodeSync={useHook ? fetchEnodeSync : data.enodeSync}
      />
      <EnergyOverviewCard energyByYear={data.energyByYear} companyId={companyId} />
      <DashboardPerformanceSection
        data={data}
        companyId={companyId}
      />
      {showEscoContract ? (
        <EscoContractCard contract={data.escoContract} alerts={data.alerts} />
      ) : (
        <DashboardAlertsKpiCard alerts={data.alerts} />
      )}
    </div>
  );
}
