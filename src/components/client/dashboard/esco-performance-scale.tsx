"use client";

type EscoPerformanceScaleProps = {
  percent: number | null;
  missingLabel?: string;
};

function monthsDeltaLabel(percent: number): string | null {
  const delta = Math.round((percent - 100) * 10) / 10;
  if (delta === 0) return "Objectif atteint";
  const abs = Math.abs(delta).toLocaleString("fr-FR");
  return delta > 0 ? `+${abs} % au-dessus` : `−${abs} % en dessous`;
}

export function EscoPerformanceScale({
  percent,
  missingLabel = "—",
}: EscoPerformanceScaleProps) {
  const hasValue = percent != null;
  const scaleMax = Math.max(110, percent ?? 100);
  const barPercent = hasValue
    ? Math.min(100, Math.max(0, (percent / scaleMax) * 100))
    : 0;
  const tickPercent = (100 / scaleMax) * 100;
  const display = hasValue
    ? `${percent.toLocaleString("fr-FR")}%`
    : missingLabel;
  const deltaLabel = hasValue ? monthsDeltaLabel(percent) : null;
  const above = hasValue && percent >= 100;

  return (
    <div className="rounded-[18px] bg-coral-wash px-4 py-3.5 sm:px-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] font-medium text-navy">
          Performance du mois dernier
        </p>
        <p
          className={
            hasValue
              ? "font-display text-[1.35rem] font-bold tabular-nums leading-none text-coral"
              : "font-display text-[1.35rem] font-bold tabular-nums leading-none text-ink-faint"
          }
        >
          {display}
        </p>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-coral/15">
        <div
          className="h-full rounded-full bg-coral transition-[width] duration-500"
          style={{ width: `${barPercent}%` }}
        />
        {hasValue ? (
          <span
            className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-navy-dark"
            style={{ left: `${tickPercent}%` }}
            aria-hidden
          />
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[12px]">
        <span className="text-ink-muted">Objectif : 100 %</span>
        {deltaLabel ? (
          <span className={above ? "font-semibold text-coral" : "font-semibold text-ink-muted"}>
            {deltaLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
