"use client";

import type { ReactNode } from "react";
import { Calendar, Clock, DollarSign } from "lucide-react";
import type { DashboardAlert, DashboardEscoContract } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { JoyaEyebrow } from "@/components/joya";
import { DashboardAlertsKpiCard } from "./dashboard-alerts-kpi-card";
import { EscoPerformanceScale } from "./esco-performance-scale";

const ESCO_ROW_GRID =
  "grid w-full flex-[0_0.5_auto] grid-cols-1 gap-y-0 lg:grid-cols-2 lg:grid-rows-1 lg:gap-x-[30px] lg:gap-y-0 lg:h-full";

type EscoContractCardProps = {
  contract: DashboardEscoContract;
  alerts: DashboardAlert[];
};

function remainingHuman(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} an${years > 1 ? "s" : ""}`);
  if (rem > 0) parts.push(`${rem} mois`);
  return `${parts.join(" ") || "0 mois"} restants`;
}

function DonutProgress({ percent }: { percent: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <div className="relative h-[4.5rem] w-[4.5rem] shrink-0">
      <svg viewBox="0 0 56 56" className="h-full w-full -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="5"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.92)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[1.05rem] font-bold tabular-nums leading-none text-white">
          {percent}%
        </span>
      </div>
    </div>
  );
}

function MetricMiniCard({
  surface,
  chip,
  icon,
  value,
  valueSuffix,
  label,
}: {
  surface: string;
  chip: string;
  icon: ReactNode;
  value: string;
  valueSuffix?: string;
  label: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-1 flex-col rounded-[18px] px-3.5 py-3.5", surface)}>
      <div className={cn("grid h-9 w-9 place-items-center rounded-[12px]", chip)}>
        {icon}
      </div>
      <p className="mt-3 leading-none">
        <span className="font-display text-[1.35rem] font-bold tabular-nums tracking-tight text-navy">
          {value}
        </span>
        {valueSuffix ? (
          <span className="ml-1 text-[12px] font-semibold text-ink-faint">
            {valueSuffix}
          </span>
        ) : null}
      </p>
      <p className="mt-1.5 text-[12px] font-medium leading-snug text-ink-muted">
        {label}
      </p>
    </div>
  );
}

function YearBlock({
  label,
  months,
  isCurrentYear,
}: {
  label: string;
  months: Array<{ filled: boolean }>;
  isCurrentYear: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col rounded-[14px] px-1.5 py-2",
        isCurrentYear ? "bg-white/12" : "bg-white/[0.06]",
      )}
    >
      <p className="mb-1.5 text-center font-data text-[10px] font-medium text-white/70">
        {label}
      </p>
      <div className="grid grid-cols-4 gap-1">
        {months.map((m, i) => (
          <span
            key={`${label}-${i}`}
            className={cn(
              "aspect-square w-full max-w-[0.7rem] justify-self-center rounded-[3px]",
              m.filled ? "bg-coral" : "bg-white/20",
            )}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}

export function EscoContractCard({ contract, alerts }: EscoContractCardProps) {
  if (!contract.configured) {
    return (
      <div className={ESCO_ROW_GRID}>
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-[28px] border border-dashed border-line-strong bg-white px-6 text-center text-sm leading-relaxed text-ink-muted shadow-joya-sm lg:min-h-[26rem]">
          Le contrat ESCO n&apos;est pas encore configuré. L&apos;équipe JOYA renseignera
          le montant mensuel et la date de fin depuis votre profil.
        </div>
        <DashboardAlertsKpiCard alerts={alerts} className="h-full" />
      </div>
    );
  }

  const monthlyDisplay =
    contract.monthlyAmountTnd != null
      ? contract.monthlyAmountTnd.toLocaleString("fr-FR", {
          maximumFractionDigits: 0,
        })
      : CLIENT_DASHBOARD_MISSING;

  const currentYearIndex = Math.min(
    contract.years.length - 1,
    Math.max(0, Math.floor((contract.elapsedMonths - 1) / 12)),
  );

  const approxYears = Math.max(1, Math.round(contract.totalMonths / 12));

  return (
    <div className={ESCO_ROW_GRID}>
      <section className="flex flex-col overflow-hidden rounded-[28px] border border-line bg-white p-5 shadow-joya-sm sm:p-6 lg:min-h-[26rem]">
        <header className="flex items-start justify-between gap-3">
          <div>
            <JoyaEyebrow>Contrat ESCO</JoyaEyebrow>
            <h3 className="mt-1.5 font-display text-[1.45rem] font-bold tracking-tight text-navy">
              Suivi du contrat
            </h3>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
              contract.status === "active"
                ? "border-line bg-white text-navy"
                : contract.status === "ended"
                  ? "border-line bg-slate-50 text-ink-muted"
                  : "border-warning/20 bg-warning-soft text-warning",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                contract.status === "active" ? "bg-navy" : "bg-slate-400",
              )}
            />
            {contract.statusLabel}
          </span>
        </header>

        <div className="mt-4 grid grid-cols-1 gap-2 xs:grid-cols-3">
          <MetricMiniCard
            surface="bg-coral-wash"
            chip="bg-white/80 text-coral"
            icon={<DollarSign className="h-4 w-4" />}
            value={monthlyDisplay}
            valueSuffix={monthlyDisplay !== CLIENT_DASHBOARD_MISSING ? "TND" : undefined}
            label="Montant mensuel"
          />
          <MetricMiniCard
            surface="border border-line bg-white"
            chip="bg-slate-100 text-navy"
            icon={<Clock className="h-4 w-4" />}
            value={String(contract.totalMonths)}
            valueSuffix="mois"
            label={`Engagement · ≈ ${approxYears} an${approxYears > 1 ? "s" : ""}`}
          />
          <MetricMiniCard
            surface="border border-line bg-white"
            chip="bg-cream-2 text-navy"
            icon={<Calendar className="h-4 w-4" />}
            value={contract.endLabel}
            label={
              contract.monthsUntilEnd > 0
                ? `Échéance · dans ${contract.monthsUntilEnd} mois`
                : "Échéance atteinte"
            }
          />
        </div>

        <div className="relative isolate mt-3 overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#1a4468_0%,rgb(var(--joya-navy-rgb))_46%,rgb(var(--joya-navy-dark-rgb))_100%)] px-4 py-4 text-white sm:px-5">
          <span
            className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-[rgb(148_92_168/0.42)] blur-2xl"
            aria-hidden
          />
          <div className="relative flex items-center gap-4">
            <DonutProgress percent={contract.durationPercent} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.15rem] font-bold tracking-tight">
                {contract.elapsedMonthsLabel}
              </p>
              <p className="mt-0.5 text-[12.5px] text-white/60">
                Progression du contrat
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] text-white/80">
                  {contract.elapsedMonths} mois passés
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] text-white/80">
                  {remainingHuman(contract.monthsUntilEnd)}
                </span>
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex gap-1.5 overflow-x-auto pb-1">
            {contract.years.map((year, index) => (
              <YearBlock
                key={year.label}
                label={year.label}
                months={year.months}
                isCurrentYear={index === currentYearIndex}
              />
            ))}
          </div>
          <div className="relative mt-2 flex justify-between font-data text-[11px] text-white/50">
            <span>{contract.startLabel}</span>
            <span>{contract.endLabel}</span>
          </div>
        </div>

        <div className="mt-3">
          <EscoPerformanceScale
            percent={contract.monthlyPerformancePercent}
            missingLabel={CLIENT_DASHBOARD_MISSING}
          />
        </div>
      </section>

      <DashboardAlertsKpiCard alerts={alerts} className="h-full" />
    </div>
  );
}
