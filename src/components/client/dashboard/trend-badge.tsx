import { TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardTrend } from "@/types/dashboard";
import { DASHBOARD_CHART_COLOR } from "./constants";

type TrendBadgeProps = {
  trend: DashboardTrend;
  className?: string;
};

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  const up = trend.value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium sm:text-sm ${
        up ? "" : "text-danger"
      } ${className ?? ""}`}
      style={up ? { color: DASHBOARD_CHART_COLOR } : undefined}
    >
      {up ? (
        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      ) : (
        <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
      )}
      {up ? "+" : ""}
      {trend.value}% {trend.label}
    </span>
  );
}
