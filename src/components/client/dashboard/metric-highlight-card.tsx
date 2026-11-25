import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import type { HighlightMetric } from "@/lib/dashboard/dashboard-performance-metrics";
import { JoyaKpiCard, type JoyaTone } from "@/components/joya";
import { cn } from "@/lib/utils";

const ACCENT_TONE: Record<HighlightMetric["accent"], JoyaTone> = {
  orange: "coral",
  green: "success",
  blue: "blue",
  yellow: "sun",
  teal: "navy",
};

const SURFACE: Partial<Record<string, "default" | "hot" | "navy">> = {
  daily: "hot",
  monthly: "navy",
  "net-gain": "navy",
  "gross-savings": "hot",
};

const SUN_BADGES = new Set(["Cumul", "Impact", "PV", "YTD", "Import"]);

const ICON_CHIP: Partial<Record<string, string>> = {
  co2: "bg-cream-2",
  monthly: "bg-blue-tint",
  "cons-monthly": "bg-blue-tint",
  "flow-auto": "bg-coral-soft",
  "flow-export": "bg-blue-tint",
  "flow-import": "bg-warning-soft",
};

function splitValueUnit(raw: string): { value: string; unit?: string } {
  if (raw === "—") return { value: raw };
  const match = raw
    .replace(/\u00a0/g, " ")
    .trim()
    .match(/^(.*)\s+(TND|kWh|MWh|kg|%)$/u);
  if (!match) return { value: raw };
  return { value: match[1].trim(), unit: match[2] };
}

function badgeClass(
  metric: HighlightMetric,
  variant: "default" | "hot" | "navy",
): string {
  if (variant === "navy") return "bg-white/12";
  if (variant === "hot") return "bg-white/85";
  if (
    metric.badge === "Auj." ||
    SUN_BADGES.has(metric.badge ?? "") ||
    metric.accent === "yellow"
  ) {
    return "bg-warning-soft";
  }
  return "bg-slate-100";
}

function badgeTextClass(
  metric: HighlightMetric,
  variant: "default" | "hot" | "navy",
): string {
  if (variant === "navy") return "text-white/80";
  if (variant === "hot") return "text-coral";
  if (
    metric.badge === "Auj." ||
    SUN_BADGES.has(metric.badge ?? "") ||
    metric.accent === "yellow"
  ) {
    return "text-warning";
  }
  return "text-navy/55";
}

type MetricHighlightCardProps = {
  metric: HighlightMetric;
  icon: LucideIcon;
  className?: string;
};

export function MetricHighlightCard({
  metric,
  icon,
  className,
}: MetricHighlightCardProps) {
  const variant = SURFACE[metric.id] ?? "default";
  const { value, unit } = splitValueUnit(metric.value);
  const missing = metric.value === "—";

  return (
    <JoyaKpiCard
      className={className}
      label={metric.label}
      value={value}
      unit={unit}
      icon={icon}
      tone={ACCENT_TONE[metric.accent]}
      chipClassName={ICON_CHIP[metric.id]}
      variant={variant}
      footnote={metric.footnote}
      progress={metric.progress}
      valueClassName={
        !missing && metric.id === "gross-savings" ? "text-coral" : undefined
      }
      badge={
        metric.badge ? (
          <View
            className={cn(
              "h-6 items-center justify-center rounded-full px-2.5",
              badgeClass(metric, variant),
            )}
          >
            <Text
              className={cn(
                "font-data text-[11px] font-semibold",
                badgeTextClass(metric, variant),
              )}
            >
              {metric.badge}
            </Text>
          </View>
        ) : null
      }
    />
  );
}
