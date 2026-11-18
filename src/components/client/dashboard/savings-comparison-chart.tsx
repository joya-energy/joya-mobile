"use client";

import type { SavingsComparisonPoint } from "@/types/dashboard";
import {
  DASHBOARD_SAVINGS_ESTIMATED_COLOR,
  DASHBOARD_SAVINGS_REAL_COLOR,
} from "./constants";
import { formatTndSavings } from "@/lib/format/currency";
import { fullMonthLabelFr } from "@/lib/dashboard/savings-comparison";
import { ChartTooltipMetricRow } from "./chart-metric-legend";
import { JoyaAreaChart, TooltipTitle } from "./chart-kit";

type SavingsComparisonChartProps = {
  data: SavingsComparisonPoint[];
  className?: string;
};

export function SavingsComparisonChart({ data, className }: SavingsComparisonChartProps) {
  return (
    <JoyaAreaChart
      className={className}
      points={data.map((p) => ({ label: fullMonthLabelFr(p.label), value: p.realEuro }))}
      reference={data.map((p) => p.estimatedEuro)}
      color={DASHBOARD_SAVINGS_REAL_COLOR}
      referenceColor={DASHBOARD_SAVINGS_ESTIMATED_COLOR}
      unit="TND"
      ariaLabel="Économie réelle comparée à l'économie estimée, par mois"
      showDots
      smooth={false}
      peakLabel={(p) => {
        const orig = data.find((d) => fullMonthLabelFr(d.label) === p.label);
        return `Meilleur mois · ${orig?.label ?? p.label}`;
      }}
      minXTickSpacing={30}
      emptyMessage="Aucun mois clôturé pour le moment."
      renderTooltip={(i) => {
        const p = data[i];
        const gap = p.realEuro - p.estimatedEuro;
        const pct = p.estimatedEuro > 0 ? (gap / p.estimatedEuro) * 100 : null;
        return (
          <div className="min-w-[12.5rem]">
            <TooltipTitle>{p.label}</TooltipTitle>
            <div className="mt-2 space-y-1.5">
              <ChartTooltipMetricRow color={DASHBOARD_SAVINGS_REAL_COLOR} label="Réelle" value={formatTndSavings(p.realEuro)} />
              <ChartTooltipMetricRow color={DASHBOARD_SAVINGS_ESTIMATED_COLOR} label="Estimée" value={formatTndSavings(p.estimatedEuro)} />
            </div>
            {pct != null ? (
              <p className={`mt-2 border-t border-line pt-2 text-[12.5px] font-semibold ${gap >= 0 ? "text-success-strong" : "text-danger-strong"}`}>
                {gap >= 0 ? "+" : ""}
                {pct.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % vs estimation
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
