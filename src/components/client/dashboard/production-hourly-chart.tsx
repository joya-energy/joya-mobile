"use client";

import type { IntradayPowerPoint } from "@/types/dashboard";
import { DASHBOARD_CHART_COLOR } from "./constants";
import { formatKwFr } from "./chart-interaction";
import { JoyaAreaChart, TooltipTitle, TooltipValue } from "./chart-kit";

type ProductionHourlyChartProps = {
  series: IntradayPowerPoint[];
  lastPointIndex: number | null;
  className?: string;
};

/** Hourly x labels only ("09:00", "12:00"…); spacing decides density. */
const onTheHour = (label: string) => label.endsWith(":00");

export function ProductionHourlyChart({
  series,
  lastPointIndex,
  className,
}: ProductionHourlyChartProps) {
  const tip = (() => {
    if (
      lastPointIndex != null &&
      series[lastPointIndex] != null &&
      Number.isFinite(series[lastPointIndex].valueKw)
    ) {
      return lastPointIndex;
    }
    for (let i = series.length - 1; i >= 0; i--) {
      if (Number.isFinite(series[i].valueKw)) return i;
    }
    return null;
  })();

  return (
    <JoyaAreaChart
      className={className}
      points={series.map((p) => ({ label: p.label, value: p.valueKw }))}
      color={DASHBOARD_CHART_COLOR}
      unit="kW"
      ariaLabel="Puissance solaire produite par créneau de 15 minutes"
      liveIndex={tip}
      peakLabel={(p) => `Pic ${formatKwFr(p.value ?? 0)} · ${p.label}`}
      xTickFilter={onTheHour}
      emptyMessage="Aucune mesure de puissance pour ce jour. Les données apparaîtront lorsque la production démarre."
      renderTooltip={(i) => (
        <>
          <TooltipTitle>
            {series[i].label}
            {series[i].isLive ? " · en direct" : ""}
          </TooltipTitle>
          <TooltipValue color={DASHBOARD_CHART_COLOR}>{formatKwFr(series[i].valueKw)}</TooltipValue>
        </>
      )}
    />
  );
}
