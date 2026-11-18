"use client";

import { cn } from "@/lib/utils";
import {
  DASHBOARD_CHART_COLOR,
  DASHBOARD_ENERGY_TOOLTIP_CO2_COLOR,
  DASHBOARD_ENERGY_TOOLTIP_ENERGY_COLOR,
  DASHBOARD_ENERGY_TOOLTIP_FINANCIAL_COLOR,
  DASHBOARD_IRRADIATION_COLOR,
} from "./constants";

export type ChartMetricLegendVariant = "square" | "solid" | "dashed";

export type ChartMetricLegendItem = {
  label: string;
  color: string;
  variant?: ChartMetricLegendVariant;
};

export const DASHBOARD_ENERGY_METRIC_LEGEND: ChartMetricLegendItem[] = [
  {
    label: "Écon. énergétiques",
    color: DASHBOARD_ENERGY_TOOLTIP_ENERGY_COLOR,
    variant: "square",
  },
  {
    label: "Écon. financières",
    color: DASHBOARD_ENERGY_TOOLTIP_FINANCIAL_COLOR,
    variant: "square",
  },
  {
    label: "CO₂ évité",
    color: DASHBOARD_ENERGY_TOOLTIP_CO2_COLOR,
    variant: "square",
  },
];

export const DASHBOARD_POWER_LEGEND: ChartMetricLegendItem[] = [
  {
    label: "Puissance",
    color: DASHBOARD_CHART_COLOR,
    variant: "solid",
  },
];

export const DASHBOARD_IRRADIATION_LEGEND: ChartMetricLegendItem[] = [
  {
    label: "Irradiation",
    color: DASHBOARD_IRRADIATION_COLOR,
    variant: "solid",
  },
];

function ChartMetricLegendSwatch({
  color,
  variant = "square",
}: {
  color: string;
  variant: ChartMetricLegendVariant;
}) {
  if (variant === "solid") {
    return (
      <span
        className="h-[3px] w-5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    );
  }

  if (variant === "dashed") {
    return (
      <span
        className="inline-block h-0 w-5 shrink-0 border-t-2 border-dashed"
        style={{ borderColor: color }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function ChartMetricLegend({
  items,
  className,
}: {
  items: ChartMetricLegendItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-line pt-3 text-[12.5px] text-ink-muted",
        className,
      )}
      role="list"
      aria-label="Légende du graphique"
    >
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5 font-medium"
          role="listitem"
        >
          <ChartMetricLegendSwatch
            color={item.color}
            variant={item.variant ?? "square"}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ChartTooltipMetricRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="min-w-0 text-ink-muted">{label}</span>
      <span className="ml-auto shrink-0 font-display font-semibold tabular-nums text-navy">
        {value}
      </span>
    </div>
  );
}
