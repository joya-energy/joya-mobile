"use client";

import type { ReactNode } from "react";
import { Leaf, Wallet, Zap } from "lucide-react";
import type { IntradayDailyTotals } from "@/types/dashboard";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { formatTndSavings } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import { JOYA_TONE_CHIP, type JoyaTone } from "@/components/joya/kpi-card";

type EnergyTotalsLabels = {
  energy: string;
  savings: string;
  co2: string;
};

const DAILY_TOTAL_LABELS: EnergyTotalsLabels = {
  energy: "Écon. énergétiques journalières",
  savings: "Écon. financières journalières",
  co2: "CO₂ évité journalier",
};

type IntradayDailyTotalsProps = {
  totals: IntradayDailyTotals | undefined;
  className?: string;
  labels?: EnergyTotalsLabels;
};

function formatDailyKwh(kwh: number): string {
  return `${kwh.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}\u00a0kWh`;
}

function formatDailyCo2Kg(kg: number): string {
  return `${kg.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}\u00a0kg`;
}

type DailyTotalBadgeProps = {
  label: string;
  value: string;
  tone: JoyaTone;
  icon: ReactNode;
};

export function DailyTotalBadge({ label, value, tone, icon }: DailyTotalBadgeProps) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 overflow-hidden rounded-[16px] bg-cream-2 px-3 py-2.5">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[12px]",
          JOYA_TONE_CHIP[tone],
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0">
        <span className="block text-[11px] font-medium leading-snug text-ink-muted sm:text-[11.5px]">
          {label}
        </span>
        <span className="mt-0.5 block font-display text-sm font-bold tabular-nums tracking-tight text-navy sm:text-[15px]">
          {value}
        </span>
      </div>
    </div>
  );
}

export function IntradayDailyTotalsRow({
  totals,
  className,
  labels = DAILY_TOTAL_LABELS,
}: IntradayDailyTotalsProps) {
  const hasData = Boolean(totals && totals.productionKwh > 0);
  const energyValue = hasData
    ? formatDailyKwh(totals!.productionKwh)
    : CLIENT_DASHBOARD_MISSING;
  const savingsValue = hasData
    ? formatTndSavings(totals!.savingsTnd)
    : CLIENT_DASHBOARD_MISSING;
  const co2Value = hasData
    ? formatDailyCo2Kg(totals!.co2Kg)
    : CLIENT_DASHBOARD_MISSING;

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2.5",
        className,
      )}
      role="group"
      aria-label="Totaux journaliers du jour sélectionné"
    >
      <DailyTotalBadge
        label={labels.energy}
        value={energyValue}
        tone="coral"
        icon={<Zap className="h-4 w-4" />}
      />
      <DailyTotalBadge
        label={labels.savings}
        value={savingsValue}
        tone="blue"
        icon={<Wallet className="h-4 w-4" />}
      />
      <DailyTotalBadge
        label={labels.co2}
        value={co2Value}
        tone="sun"
        icon={<Leaf className="h-4 w-4" />}
      />
    </div>
  );
}
