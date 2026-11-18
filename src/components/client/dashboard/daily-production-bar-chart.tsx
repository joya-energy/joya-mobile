"use client";

import type { MonthlyDailyProductionPoint } from "@/types/dashboard";
import {
  DASHBOARD_CHART_COLOR,
  DASHBOARD_ENERGY_TOOLTIP_CO2_COLOR,
  DASHBOARD_ENERGY_TOOLTIP_ENERGY_COLOR,
  DASHBOARD_ENERGY_TOOLTIP_FINANCIAL_COLOR,
} from "./constants";
import {
  deriveMonthlyEnergyMetrics,
  formatMonthlyCo2Kg,
  formatMonthlyEnergyKwh,
  formatMonthlySavingsTnd,
} from "@/lib/dashboard/monthly-energy-metrics";
import { ChartTooltipMetricRow } from "./chart-metric-legend";
import { JoyaBarChart, TooltipTitle } from "./chart-kit";

type DailyProductionBarChartProps = {
  data: MonthlyDailyProductionPoint[];
  className?: string;
};

function formatDayTitle(dateYmd: string): string {
  const [year, month, day] = dateYmd.split("-").map(Number);
  if (!year || !month || !day) return dateYmd;
  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DailyProductionBarChart({ data, className }: DailyProductionBarChartProps) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Tunis" });
  const partial = data.findIndex((p) => p.date === today);

  return (
    <JoyaBarChart
      className={className}
      bars={data.map((p) => ({ label: p.label, value: p.productionKwh }))}
      color={DASHBOARD_CHART_COLOR}
      unit="kWh"
      ariaLabel="Production solaire par jour du mois"
      partialIndex={partial >= 0 ? partial : null}
      renderTooltip={(i) => {
        const point = data[i];
        const m = deriveMonthlyEnergyMetrics(point.productionKwh);
        return (
          <div className="min-w-[13rem] max-w-[16rem]">
            <TooltipTitle>
              {formatDayTitle(point.date)}
              {i === partial ? " · en cours" : ""}
            </TooltipTitle>
            <div className="mt-2 space-y-1.5">
              <ChartTooltipMetricRow color={DASHBOARD_ENERGY_TOOLTIP_ENERGY_COLOR} label="Énergie produite" value={formatMonthlyEnergyKwh(m.energyKwh)} />
              <ChartTooltipMetricRow color={DASHBOARD_ENERGY_TOOLTIP_FINANCIAL_COLOR} label="Économies" value={formatMonthlySavingsTnd(m.savingsTnd)} />
              <ChartTooltipMetricRow color={DASHBOARD_ENERGY_TOOLTIP_CO2_COLOR} label="CO₂ évité" value={formatMonthlyCo2Kg(m.co2Kg)} />
            </div>
          </div>
        );
      }}
    />
  );
}
