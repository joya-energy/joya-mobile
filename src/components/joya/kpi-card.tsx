import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";

export type JoyaTone = "coral" | "navy" | "blue" | "success" | "warning" | "danger" | "neutral" | "sun";

/** Icon chip colours per tone (soft background + strong foreground). */
export const JOYA_TONE_CHIP: Record<JoyaTone, string> = {
  coral: "bg-coral-soft text-coral",
  navy: "bg-navy/[0.07] text-navy",
  blue: "bg-blue-tint text-blue",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-slate-100 text-slate-600",
  sun: "bg-warning-soft text-sun",
};

type JoyaKpiCardProps = {
  label: ReactNode;
  value: ReactNode;
  /** Unit rendered smaller next to the value (kWh, DT, %…). */
  unit?: ReactNode;
  icon?: LucideIcon;
  tone?: JoyaTone;
  /** Override icon chip colours (background + foreground). */
  chipClassName?: string;
  footnote?: ReactNode;
  /** Top-right slot: trend chip, badge… */
  badge?: ReactNode;
  /**
   * `default` white card · `hot` warm coral (report `.rc--hot`) ·
   * `cream` nested tile · `tint` blue tint (report `.rc`) · `navy` dark highlight.
   */
  variant?: "default" | "hot" | "cream" | "tint" | "navy";
  size?: "sm" | "md" | "lg";
  valueClassName?: string;
  className?: string;
  /** 0–100 thin bar under the value (e.g. autoconsommation). */
  progress?: number | null;
};

const VARIANT_SURFACE: Record<NonNullable<JoyaKpiCardProps["variant"]>, string> = {
  default: "border-line/80 bg-white",
  hot: "border-transparent bg-coral-wash",
  cream: "border-transparent bg-cream-2 shadow-none hover:translate-y-0 hover:shadow-none",
  tint: "border-blue/10 bg-blue-soft",
  navy: "border-transparent text-white",
};

/**
 * KPI card — compact, label first, big Archivo figure, optional footnote.
 * Values must be pre-formatted by the caller (no business logic here).
 */
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
  const isHot = variant === "hot";
  const missing = value === "—";
  return (
    <article
      className={cn(
        "group/kpi relative isolate flex min-w-0 flex-col overflow-hidden rounded-[20px] border shadow-joya-xs transition-[box-shadow,transform] duration-base ease-joya hover:-translate-y-0.5 hover:shadow-joya-md",
        VARIANT_SURFACE[variant],
        isNavy &&
          "bg-[linear-gradient(160deg,#1a4468_0%,rgb(var(--joya-navy-rgb))_46%,rgb(var(--joya-navy-dark-rgb))_100%)]",
        size === "sm" ? "gap-2 p-3.5" : size === "lg" ? "gap-3 p-5 sm:p-6" : "gap-2.5 p-4 sm:p-5",
        className,
      )}
    >
      {isNavy ? (
        <span
          className="pointer-events-none absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-[rgb(148_92_168/0.42)] blur-2xl"
          aria-hidden
        />
      ) : null}
      {isHot ? (
        <span
          className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-coral/15 blur-2xl"
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span
              className={cn(
                "grid shrink-0 place-items-center rounded-[14px] transition-transform duration-base ease-joya group-hover/kpi:scale-110",
                size === "sm" ? "h-8 w-8" : "h-9 w-9 sm:h-10 sm:w-10",
                chipClassName ?? (isNavy ? "bg-white/12 text-coral" : JOYA_TONE_CHIP[tone]),
              )}
              aria-hidden
            >
              <Icon className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4 sm:h-[18px] sm:w-[18px]"} />
            </span>
          ) : null}
          <p
            className={cn(
              "min-w-0 text-[12.5px] font-medium leading-snug sm:text-[13px]",
              isNavy ? "text-white/70" : "text-ink-muted",
            )}
          >
            {label}
          </p>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>

      <p
        className={cn(
          "joya-kpi-value relative flex flex-wrap items-baseline gap-x-1.5 break-words",
          size === "lg" ? "text-kpi-lg" : size === "sm" ? "text-xl" : "text-kpi",
          isNavy && "text-white",
          missing && "font-sans text-[1.35rem] font-semibold tracking-normal text-ink-faint",
          missing && isNavy && "text-white/45",
          valueClassName,
        )}
      >
        <span className="min-w-0">
          {typeof value === "string" && !missing ? <CountUp text={value} /> : value}
        </span>
        {unit && !missing ? (
          <span
            className={cn(
              "font-sans text-[13px] font-semibold tracking-normal",
              isNavy ? "text-white/55" : "text-ink-faint",
            )}
          >
            {unit}
          </span>
        ) : null}
      </p>

      {progress != null && Number.isFinite(progress) ? (
        <div
          className={cn(
            "relative mt-1.5 h-1 overflow-hidden rounded-full",
            isNavy ? "bg-white/15" : "bg-slate-200",
          )}
        >
          <div
            className="h-full min-w-3 rounded-full bg-coral"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}

      {footnote ? (
        <p
          className={cn(
            "relative mt-auto text-[12.5px] leading-snug",
            isNavy ? "text-white/55" : "text-ink-faint",
          )}
        >
          {footnote}
        </p>
      ) : null}
    </article>
  );
}

type JoyaTrendProps = {
  value: number | null | undefined;
  /** Already formatted label; defaults to signed percent. */
  label?: string;
  /** When lower is better (consumption), invert colours. */
  invert?: boolean;
  className?: string;
};

/** Small trend chip (+4,2 %). */
export function JoyaTrend({ value, label, invert = false, className }: JoyaTrendProps) {
  if (value == null || !Number.isFinite(value)) return null;
  const positive = invert ? value < 0 : value > 0;
  const flat = value === 0;
  const text =
    label ??
    `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-pill px-2 font-data text-[11.5px] font-medium tabular-nums",
        flat
          ? "bg-slate-100 text-slate-600"
          : positive
            ? "bg-success-soft text-success-strong"
            : "bg-danger-soft text-danger-strong",
        className,
      )}
    >
      {text}
    </span>
  );
}
