import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type JoyaChartCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Period selector, year picker… */
  actions?: ReactNode;
  /** Highlight values shown between header and plot. */
  summary?: ReactNode;
  legend?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

/** Standard frame for every chart: header, optional summary band, plot, legend. */
export function JoyaChartCard({
  title,
  description,
  icon,
  actions,
  summary,
  legend,
  footer,
  children,
  className,
  bodyClassName,
}: JoyaChartCardProps) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-line bg-white shadow-joya-sm",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <div className="flex min-w-0 items-start gap-2.5">
          {icon ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-coral-soft text-coral [&_svg]:h-4 [&_svg]:w-4">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <h3 className="font-display text-card-title text-navy sm:text-base">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-[12.5px] leading-snug text-ink-faint">{description}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {summary ? <div className="px-4 pt-3 sm:px-5">{summary}</div> : null}
      <div className={cn("relative min-h-0 flex-1 px-2 pb-3 pt-3 sm:px-3", bodyClassName)}>
        {children}
      </div>
      {legend ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-[12.5px] text-ink-muted sm:px-5">
          {legend}
        </div>
      ) : null}
      {footer ? <div className="border-t border-line px-4 py-3 sm:px-5">{footer}</div> : null}
    </section>
  );
}

type JoyaLegendItemProps = {
  color: string;
  label: ReactNode;
  shape?: "line" | "dot" | "bar" | "dash";
};

export function JoyaLegendItem({ color, label, shape = "line" }: JoyaLegendItemProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <i
        aria-hidden
        className={cn(
          "inline-block shrink-0",
          shape === "dot" && "h-2 w-2 rounded-full",
          shape === "line" && "h-[3px] w-4 rounded-full",
          shape === "bar" && "h-2.5 w-2.5 rounded-[3px]",
          shape === "dash" && "h-0 w-4 border-t-2 border-dashed",
        )}
        style={shape === "dash" ? { borderColor: color } : { backgroundColor: color }}
      />
      {label}
    </span>
  );
}
