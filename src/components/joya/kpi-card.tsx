import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";
import { joyaColors } from "@/theme/colors";

export type JoyaTone =
  | "coral"
  | "navy"
  | "blue"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "sun";

/** Icon chip colours per tone (soft background + strong foreground). */
export const JOYA_TONE_CHIP: Record<JoyaTone, string> = {
  coral: "bg-coral-soft",
  navy: "bg-navy/10",
  blue: "bg-blue-tint",
  success: "bg-success-soft",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
  neutral: "bg-slate-100",
  sun: "bg-warning-soft",
};

const JOYA_TONE_ICON: Record<JoyaTone, string> = {
  coral: joyaColors.coral,
  navy: joyaColors.navy,
  blue: joyaColors.blue,
  success: joyaColors.success,
  warning: joyaColors.warning,
  danger: joyaColors.danger,
  neutral: "#475569",
  sun: joyaColors.sun ?? joyaColors.warning,
};

type JoyaKpiCardProps = {
  label: ReactNode;
  value: ReactNode;
  unit?: ReactNode;
  icon?: LucideIcon;
  tone?: JoyaTone;
  chipClassName?: string;
  footnote?: ReactNode;
  badge?: ReactNode;
  variant?: "default" | "hot" | "cream" | "tint" | "navy";
  size?: "sm" | "md" | "lg";
  valueClassName?: string;
  className?: string;
  progress?: number | null;
};

const VARIANT_SURFACE: Record<
  NonNullable<JoyaKpiCardProps["variant"]>,
  string
> = {
  default: "border-line/80 bg-white",
  hot: "border-transparent bg-coral-wash",
  cream: "border-transparent bg-cream-2 shadow-none",
  tint: "border-blue/10 bg-blue-soft",
  navy: "border-transparent",
};

export function JoyaKpiCard({
  label,
  value,
  unit,
  icon: Icon,
  tone = "coral",
  chipClassName,
  footnote,
  badge,
  variant = "default",
  size = "md",
  valueClassName,
  className,
  progress,
}: JoyaKpiCardProps) {
  const isNavy = variant === "navy";
  const missing = value === "—";
  const iconColor = isNavy ? joyaColors.coral : JOYA_TONE_ICON[tone];

  return (
    <View
      className={cn(
        "relative isolate min-w-0 overflow-hidden rounded-[20px] border shadow-joya-xs",
        VARIANT_SURFACE[variant],
        size === "sm" ? "gap-2 p-3.5" : size === "lg" ? "gap-3 p-5" : "gap-2.5 p-4",
        className,
      )}
    >
      {isNavy ? (
        <LinearGradient
          colors={["#1a4468", joyaColors.navy, joyaColors.navyDark ?? "#0f2a44"]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
      ) : null}

      <View className="relative flex-row items-start justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
          {Icon ? (
            <View
              className={cn(
                "items-center justify-center rounded-[14px]",
                size === "sm" ? "h-8 w-8" : "h-10 w-10",
                chipClassName ?? (isNavy ? "bg-white/12" : JOYA_TONE_CHIP[tone]),
              )}
            >
              <Icon size={size === "sm" ? 14 : 18} color={iconColor} />
            </View>
          ) : null}
          <Text
            className={cn(
              "min-w-0 flex-1 text-[12.5px] font-medium leading-snug",
              isNavy ? "text-white/70" : "text-ink-muted",
            )}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
        {badge ? <View className="shrink-0">{badge}</View> : null}
      </View>

      <View className="relative flex-row flex-wrap items-baseline gap-x-1.5">
        {typeof value === "string" && !missing ? (
          <CountUp
            text={value}
            className={cn(
              "font-display font-extrabold tracking-tight",
              size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl",
              isNavy && "text-white",
              valueClassName,
            )}
          />
        ) : (
          <Text
            className={cn(
              "font-display font-extrabold tracking-tight",
              size === "lg" ? "text-3xl" : size === "sm" ? "text-xl" : "text-2xl",
              isNavy && "text-white",
              missing && "font-semibold text-ink-faint",
              missing && isNavy && "text-white/45",
              valueClassName,
            )}
          >
            {value}
          </Text>
        )}
        {unit && !missing ? (
          <Text
            className={cn(
              "text-[13px] font-semibold",
              isNavy ? "text-white/55" : "text-ink-faint",
            )}
          >
            {unit}
          </Text>
        ) : null}
      </View>

      {progress != null && Number.isFinite(progress) ? (
        <View
          className={cn(
            "relative mt-1.5 h-1 overflow-hidden rounded-full",
            isNavy ? "bg-white/15" : "bg-slate-200",
          )}
        >
          <View
            className="h-full min-w-3 rounded-full bg-coral"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </View>
      ) : null}

      {footnote ? (
        <Text
          className={cn(
            "relative mt-auto text-[12.5px] leading-snug",
            isNavy ? "text-white/55" : "text-ink-faint",
          )}
        >
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

type JoyaTrendProps = {
  value: number | null | undefined;
  label?: string;
  invert?: boolean;
  className?: string;
};

export function JoyaTrend({
  value,
  label,
  invert = false,
  className,
}: JoyaTrendProps) {
  if (value == null || !Number.isFinite(value)) return null;
  const positive = invert ? value < 0 : value > 0;
  const flat = value === 0;
  const text =
    label ??
    `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR", {
      maximumFractionDigits: 1,
    })} %`;
  return (
    <View
      className={cn(
        "h-6 items-center justify-center rounded-full px-2",
        flat
          ? "bg-slate-100"
          : positive
            ? "bg-success-soft"
            : "bg-danger-soft",
        className,
      )}
    >
      <Text
        className={cn(
          "font-data text-[11.5px] font-medium tabular-nums",
          flat
            ? "text-slate-600"
            : positive
              ? "text-success-strong"
              : "text-danger-strong",
        )}
      >
        {text}
      </Text>
    </View>
  );
}
