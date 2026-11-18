"use client";

import type { IntradayIrradiationPoint } from "@/types/dashboard";
import {
  DASHBOARD_IRRADIATION_COLOR,
  DASHBOARD_IRRADIATION_TILTED_COLOR,
} from "./constants";
import { JoyaAreaChart, TooltipTitle, TooltipValue, formatValue } from "./chart-kit";

type IrradiationHourlyChartProps = {
  series: IntradayIrradiationPoint[];
  lastPointIndex?: number | null;
  showTilted?: boolean;
  className?: string;
};

/**
 * Focus the plot on the productive / known window (sunrise → latest point)
 * instead of a mostly empty 24 h scale.
 */
function resolveDisplayWindow(
  series: IntradayIrradiationPoint[],
  lastPointIndex: number | null,
): { start: number; end: number } {
  const n = series.length;
  if (n === 0) return { start: 0, end: -1 };

  let tip =
    lastPointIndex != null && lastPointIndex >= 0 && lastPointIndex < n
      ? lastPointIndex
      : -1;
  if (tip < 0) {
    for (let i = n - 1; i >= 0; i--) {
      if (series[i].ghiWm2 != null || series[i].poaWm2 != null) {
        tip = i;
        break;
      }
    }
  }
  if (tip < 0) return { start: 0, end: -1 };

  let start = 0;
  for (let i = 0; i <= tip; i++) {
    const ghi = series[i].ghiWm2;
    const poa = series[i].poaWm2;
    if ((ghi != null && ghi > 0) || (poa != null && poa > 0)) {
      start = i;
      break;
    }
  }
  start = Math.max(0, start - 2);

  return { start, end: tip };
}

const onTheHour = (label: string) => label.endsWith(":00");

export function IrradiationHourlyChart({
  series,
  lastPointIndex = null,
  showTilted = true,
  className,
}: IrradiationHourlyChartProps) {
  const { start, end } = resolveDisplayWindow(series, lastPointIndex);
  const display = end >= start ? series.slice(start, end + 1) : [];
  const tip =
    display.length && display[display.length - 1].isLive
      ? display.length - 1
      : null;
  const hasTilted =
    showTilted && display.some((p) => p.poaWm2 != null);

  return (
    <JoyaAreaChart
      className={className}
      points={display.map((p) => ({ label: p.label, value: p.ghiWm2 }))}
      secondary={
        hasTilted ? display.map((p) => p.poaWm2) : undefined
      }
      color={DASHBOARD_IRRADIATION_COLOR}
      secondaryColor={DASHBOARD_IRRADIATION_TILTED_COLOR}
      unit="W/m²"
      ariaLabel="Irradiation solaire par créneau de 15 minutes"
      liveIndex={tip}
      peakFromSecondary={hasTilted}
      liveLabel={(i) => {
        const p = display[i];
        const ghi = p?.ghiWm2;
        const poa = p?.poaWm2;
        if (hasTilted && ghi != null && poa != null) {
          return `Maintenant H ${Math.round(ghi)} · I ${Math.round(poa)}`;
        }
        const v = poa ?? ghi ?? 0;
        return `Maintenant ${formatValue(v, "W/m²", 0)}`;
      }}
      peakLabel={(p, i) => {
        const poa = display[i]?.poaWm2;
        if (hasTilted && poa != null) {
          return `Incliné ${Math.round(poa)} · ${p.label}`;
        }
        return `Pic ${formatValue(p.value ?? 0, "W/m²", 0)} · ${p.label}`;
      }}
      xTickFilter={onTheHour}
      emptyMessage="Aucune donnée d'irradiation pour ce jour."
      renderTooltip={(i) => (
        <>
          <TooltipTitle>
            {display[i].label}
            {display[i].isLive ? " · en direct" : ""}
          </TooltipTitle>
          <TooltipValue color={DASHBOARD_IRRADIATION_COLOR}>
            Horizontal{" "}
            {formatValue(display[i].ghiWm2 ?? 0, "W/m²", 0)}
          </TooltipValue>
          {hasTilted && display[i].poaWm2 != null ? (
            <TooltipValue color={DASHBOARD_IRRADIATION_TILTED_COLOR}>
              Incliné {formatValue(display[i].poaWm2 ?? 0, "W/m²", 0)}
            </TooltipValue>
          ) : null}
        </>
      )}
    />
  );
}
