"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { DashboardAlert } from "@/types/dashboard";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { filterAlertsForDeviceScope } from "@/lib/device-scope/storage";
import { AlertSourceChip } from "./alert-source-chip";
import { cn } from "@/lib/utils";
import { JoyaEyebrow } from "@/components/joya";
import { DashboardAlertsModal } from "./dashboard-alerts-modal";

type DashboardAlertsKpiCardProps = {
  alerts: DashboardAlert[];
  className?: string;
};

const CRITICAL_PREVIEW = 2;
const ALERTS_PAGE_HREF = "/client/alerts";

function compactTimeLabel(label?: string): string | null {
  if (!label?.trim()) return null;
  return label.replace(/^Il y a\s+/i, "").trim() || label.trim();
}

function StatChip({
  label,
  count,
  dotClass,
}: {
  label: string;
  count: number;
  dotClass: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[16px] border border-line bg-white px-3.5 py-3 shadow-joya-xs">
      <div>
        <p className="text-[12px] font-medium text-ink-muted">{label}</p>
        <p className="font-display text-[1.35rem] font-bold tabular-nums leading-none text-navy">
          {count}
        </p>
      </div>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotClass)} aria-hidden />
    </div>
  );
}

export function DashboardAlertsKpiCard({
  alerts,
  className,
}: DashboardAlertsKpiCardProps) {
  const [open, setOpen] = useState(false);
  const { scope } = useDeviceScope();

  const scopedAlerts = useMemo(
    () => filterAlertsForDeviceScope(alerts, scope),
    [alerts, scope],
  );

  const { total, criticalCount, criticalRows, attentionCount, infoCount } =
    useMemo(() => {
      const errors = scopedAlerts.filter((a) => a.severity === "error");
      return {
        total: scopedAlerts.length,
        criticalCount: errors.length,
        criticalRows: errors.slice(0, CRITICAL_PREVIEW),
        attentionCount: scopedAlerts.filter((a) => a.severity === "warning").length,
        infoCount: scopedAlerts.filter((a) => a.severity === "info").length,
      };
    }, [scopedAlerts]);

  const cta =
    criticalCount > 0
      ? `Voir les ${criticalCount} alerte${criticalCount > 1 ? "s" : ""} critique${criticalCount > 1 ? "s" : ""}`
      : infoCount > 0
        ? `Voir les ${infoCount} information${infoCount > 1 ? "s" : ""}`
        : attentionCount > 0
          ? `Voir les ${attentionCount} attention${attentionCount > 1 ? "s" : ""}`
          : "Voir les alertes";

  return (
    <>
      <section
        className={cn(
          "flex h-full min-h-[16rem] flex-col overflow-hidden rounded-[28px] border border-line bg-white p-5 shadow-joya-sm sm:p-6",
          className,
        )}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <JoyaEyebrow>Surveillance</JoyaEyebrow>
            <h3 className="mt-1.5 font-display text-[1.45rem] font-bold tracking-tight text-navy">
              Alertes
            </h3>
          </div>
          <span
            className="grid h-8 min-w-8 place-items-center rounded-full bg-coral px-2 font-display text-sm font-bold tabular-nums text-white"
            aria-label={`${total} alerte${total !== 1 ? "s" : ""}`}
          >
            {total}
          </span>
        </header>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatChip label="Critique" count={criticalCount} dotClass="bg-danger" />
          <StatChip label="Attention" count={attentionCount} dotClass="bg-sun" />
          <StatChip label="Info" count={infoCount} dotClass="bg-navy" />
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col justify-center rounded-[22px] bg-coral-wash px-5 py-8 text-center">
          {criticalRows.length > 0 ? (
            <div className="space-y-3 text-left">
              {criticalRows.map((alert) => {
                const time = compactTimeLabel(alert.timeLabel);
                return (
                  <div key={alert.id} className="flex items-start gap-2.5">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-coral" aria-hidden />
                    <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-navy">
                      {alert.title}
                    </p>
                    {alert.sourceLabel ? (
                      <AlertSourceChip
                        label={alert.sourceLabel}
                        variant="modal"
                        className="max-w-[7rem] shrink-0"
                      />
                    ) : null}
                    {time ? (
                      <span className="shrink-0 text-xs font-medium tabular-nums text-ink-faint">
                        {time}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="grid h-[4.25rem] w-[4.25rem] place-items-center rounded-[22px] bg-white shadow-joya-xs">
                <ShieldCheck className="h-7 w-7 text-coral" aria-hidden />
              </span>
              <p className="mt-4 font-display text-lg font-bold tracking-tight text-navy">
                Aucune alerte critique
              </p>
              <p className="mt-1.5 max-w-[36ch] text-[13.5px] leading-relaxed text-ink-muted">
                Votre installation fonctionne normalement.
                {infoCount > 0
                  ? ` ${infoCount} information${infoCount > 1 ? "s" : ""} ${infoCount > 1 ? "sont" : "est"} disponible${infoCount > 1 ? "s" : ""}.`
                  : null}
              </p>
            </div>
          )}
        </div>

        <Link
          href={ALERTS_PAGE_HREF}
          className="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-line bg-white text-[13.5px] font-semibold text-navy transition-colors hover:bg-cream lg:hidden"
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 hidden h-11 items-center justify-center gap-2 rounded-[14px] border border-line bg-white text-[13.5px] font-semibold text-navy transition-colors hover:bg-cream lg:inline-flex"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          {cta}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </section>

      <div className="hidden lg:contents">
        <DashboardAlertsModal
          open={open}
          onClose={() => setOpen(false)}
          alerts={scopedAlerts}
        />
      </div>
    </>
  );
}
