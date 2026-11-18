import type { DashboardKpi } from "@/types/dashboard";
import { DashboardKpiCard } from "./dashboard-kpi-card";

type DashboardInstallationKpisProps = {
  kpis: DashboardKpi[];
};

/** Top row: installation size (P crête) and theoretical annual production. */
export function DashboardInstallationKpis({ kpis }: DashboardInstallationKpisProps) {
  if (kpis.length === 0) return null;

  return (
    <div className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
      {kpis.map((kpi) => (
        <DashboardKpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
