import type { DashboardAlert, DashboardKpi } from "@/types/dashboard";
import { DashboardAlertsKpiCard } from "./dashboard-alerts-kpi-card";
import { DashboardKpiCard } from "./dashboard-kpi-card";

type DashboardKpiGridProps = {
  installationKpis?: DashboardKpi[];
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
};

export function DashboardKpiGrid({
  installationKpis = [],
  kpis,
  alerts,
}: DashboardKpiGridProps) {
  const items = [...installationKpis, ...kpis];
  const totalCards = items.length + 1;

  if (totalCards === 0) return null;

  const gridCols =
    totalCards >= 5
      ? "xl:grid-cols-5"
      : totalCards === 4
        ? "lg:grid-cols-4"
        : "lg:grid-cols-3";

  return (
    <div className="flex shrink-0 flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 lg:hidden">
        Performance
      </p>

      <div className="grid grid-cols-2 gap-3 lg:hidden">
        {items.map((kpi) => (
          <DashboardKpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="lg:hidden">
        <DashboardAlertsKpiCard alerts={alerts} />
      </div>

      <div
        className={`hidden auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid lg:grid-cols-3 ${gridCols}`}
      >
        {items.map((kpi) => (
          <DashboardKpiCard key={kpi.id} kpi={kpi} />
        ))}
        <DashboardAlertsKpiCard alerts={alerts} />
      </div>
    </div>
  );
}
