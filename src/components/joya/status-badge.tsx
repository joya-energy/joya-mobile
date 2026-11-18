import { cn } from "@/lib/utils";

export type JoyaStatus = "success" | "warning" | "danger" | "neutral" | "info";

const STATUS_STYLE: Record<JoyaStatus, { chip: string; dot: string }> = {
  success: { chip: "bg-success-soft text-success-strong border-success/20", dot: "bg-success" },
  warning: { chip: "bg-warning-soft text-warning-strong border-warning/25", dot: "bg-warning" },
  danger: { chip: "bg-danger-soft text-danger-strong border-danger/20", dot: "bg-danger" },
  info: { chip: "bg-blue-tint text-blue border-blue/15", dot: "bg-blue" },
  neutral: { chip: "bg-slate-100 text-slate-600 border-line", dot: "bg-slate-400" },
};

type JoyaStatusBadgeProps = {
  status: JoyaStatus;
  label: string;
  /** Animated halo for live states (online, in progress). */
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** Equipment / document / invoice status — always dot + text (never colour alone). */
export function JoyaStatusBadge({
  status,
  label,
  pulse = false,
  size = "md",
  className,
}: JoyaStatusBadgeProps) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-pill border font-medium",
        size === "sm" ? "h-5 px-2 text-[11px]" : "h-6 px-2.5 text-xs",
        style.chip,
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-60",
              style.dot,
            )}
          />
        ) : null}
        <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", style.dot)} />
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
