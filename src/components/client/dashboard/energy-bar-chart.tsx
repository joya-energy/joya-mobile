"use client";

import type { MonthlyEnergyPoint } from "@/types/dashboard";
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
  monthlyEnergyTitle,
} from "@/lib/dashboard/monthly-energy-metrics";
import { ChartTooltipMetricRow } from "./chart-metric-legend";
import { JoyaBarChart, TooltipTitle } from "./chart-kit";

type EnergyBarChartProps = {
  data: MonthlyEnergyPoint[];
  year: number;
  className?: string;
};

export function EnergyBarChart({ data, year, className }: EnergyBarChartProps) {
  const now = new Date();
  const partial = year === now.getFullYear() ? now.getMonth() : null;

  return (
    <JoyaBarChart
      className={className}
      bars={data.map((p) => ({ label: p.label, value: p.valueKw }))}
      color={DASHBOARD_CHART_COLOR}
      unit="kWh"
      ariaLabel={`Production solaire par mois en ${year}`}
      partialIndex={partial != null && partial < data.length ? partial : null}
      renderTooltip={(i) => {
        const point = data[i];
        const m = deriveMonthlyEnergyMetrics(point.valueKw);
        return (
          <div className="min-w-[13rem] max-w-[16rem]">
            <TooltipTitle>
              {monthlyEnergyTitle(point.label, year)}
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
