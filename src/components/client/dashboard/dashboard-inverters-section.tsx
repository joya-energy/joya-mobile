"use client";

import type { ReactNode } from "react";
import {
  Calendar,
  Cpu,
  MapPin,
  Zap,
} from "lucide-react";
import type { DashboardInverter, DashboardInverterStatus } from "@/types/dashboard";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { cn } from "@/lib/utils";
import { JoyaStatusBadge, type JoyaStatus } from "@/components/joya";

const STATUS_TO_JOYA: Record<DashboardInverterStatus, JoyaStatus> = {
  connected: "success",
  degraded: "warning",
  offline: "danger",
  unknown: "neutral",
};

const STATUS_PRIORITY: Record<DashboardInverterStatus, number> = {
  offline: 0,
  degraded: 1,
  unknown: 2,
  connected: 3,
};

function InverterDetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-[16px] bg-white px-3 py-2.5 shadow-joya-xs">
      <span className="mt-0.5 shrink-0 text-coral [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-muted">
          {label}
        </p>
        <p
          className={
            mono
              ? "truncate font-data text-[12.5px] font-medium leading-snug text-navy"
              : "truncate text-[13px] font-semibold leading-snug text-navy"
          }
          title={value}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function clockLabel(raw?: string): string | null {
  if (!raw?.trim()) return null;
  const match = raw.match(/(\d{1,2})[h:](\d{2})/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Tunis",
    });
  }
  return raw.trim();
}

function parseCapacityKw(label?: string, ratedKw?: number): number | null {
  if (ratedKw != null && Number.isFinite(ratedKw) && ratedKw > 0) return ratedKw;
  if (!label) return null;
  const match = label.replace(",", ".").match(/([\d.]+)\s*kWc?/i);
  if (!match) return null;
  const n = Number.parseFloat(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function LivePower({
  label,
  kw,
  suffix,
  capacityKw,
}: {
  label: string;
  kw: number;
  suffix?: string;
  capacityKw?: number | null;
}) {
  const time = clockLabel(suffix);
  const share =
    capacityKw != null && capacityKw > 0
      ? Math.round((Math.max(0, kw) / capacityKw) * 100)
      : null;

  return (
    <div className="relative isolate flex min-h-[11.5rem] flex-col justify-between overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#f4a07e_0%,var(--joya-coral)_48%,#e05a38_100%)] px-5 py-4 text-white">
      <span
        className="pointer-events-none absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-white/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-white/85">{label}</p>
        {time ? (
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-data text-[11px] font-semibold tabular-nums">
            {time}
          </span>
        ) : null}
      </div>
      <div className="relative mt-auto">
        <p className="font-display text-[2.6rem] font-bold leading-none tracking-tight tabular-nums">
          {kw.toLocaleString("fr-FR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
          <span className="ml-1.5 font-sans text-[1.05rem] font-semibold text-white/75">kW</span>
        </p>
        <div className="mt-3 h-1 rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${Math.min(100, Math.max(0, share ?? 0))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function InverterStatusPill({
  status,
  label,
}: {
  status: DashboardInverterStatus;
  label: string;
}) {
  const online = status === "connected";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        online
          ? "bg-white text-coral shadow-joya-xs"
          : status === "offline"
            ? "bg-danger-soft text-danger"
            : "bg-warning-soft text-warning",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          online ? "bg-coral" : status === "offline" ? "bg-danger" : "bg-warning",
        )}
      />
      {online ? "En ligne" : label}
    </span>
  );
}

function pickWorstStatus(inverters: DashboardInverter[]): DashboardInverter {
  return inverters.reduce((worst, inverter) =>
    STATUS_PRIORITY[inverter.status] < STATUS_PRIORITY[worst.status]
      ? inverter
      : worst,
  );
}

function formatCapacityShort(label: string): string {
  const match = label.match(/([\d.,]+)\s*kWc?/i);
  return match ? `${match[1]} kWc` : label;
}

function formatCapacityKw(kw: number): string {
  return `${kw.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} kWc`;
}

function resolveInverterCapacityLabel(
  inverter: DashboardInverter,
  siteCapacityShort?: string,
): string {
  return (
    inverter.capacityLabel ??
    siteCapacityShort ??
    inverter.ratedPowerLabel ??
    (inverter.ratedPowerKw != null && inverter.ratedPowerKw > 0
      ? formatCapacityKw(inverter.ratedPowerKw)
      : CLIENT_DASHBOARD_MISSING)
  );
}

function formatTotalCapacity(
  inverters: DashboardInverter[],
  siteCapacityShort?: string,
): string {
  if (siteCapacityShort) return siteCapacityShort;

  const totalKw = inverters.reduce(
    (sum, inverter) => sum + (inverter.ratedPowerKw ?? 0),
    0,
  );
  if (totalKw > 0) {
    return formatCapacityKw(totalKw);
  }
  const labels = inverters
    .map((inverter) => inverter.capacityLabel)
    .filter(Boolean) as string[];
  if (labels.length === 0) return CLIENT_DASHBOARD_MISSING;
  if (labels.every((label) => label === labels[0])) return labels[0];
  return `${inverters.length} onduleurs`;
}

function formatInstallationDates(inverters: DashboardInverter[]): string {
  const labels = inverters
    .map((inverter) => inverter.installationDateLabel)
    .filter(Boolean) as string[];
  if (labels.length === 0) return CLIENT_DASHBOARD_MISSING;
  if (labels.every((label) => label === labels[0])) return labels[0];
  return "Plusieurs dates";
}

function formatLocation(inverters: DashboardInverter[]): string {
  const labels = inverters
    .map((inverter) => inverter.locationLabel)
    .filter(Boolean) as string[];
  if (labels.length === 0) return CLIENT_DASHBOARD_MISSING;
  return labels[0];
}

export function InverterCard({
  inverter,
  siteCapacityShort,
}: {
  inverter: DashboardInverter;
  siteCapacityShort?: string;
}) {
  const modelLine = [inverter.manufacturer, inverter.model]
    .filter(Boolean)
    .join(" · ");
  const capacityLabel = resolveInverterCapacityLabel(inverter, siteCapacityShort);
  const capacityKw = parseCapacityKw(capacityLabel, inverter.ratedPowerKw);
  const liveKw = inverter.lastProductionRateKw ?? 0;

  return (
    <article className="rounded-[28px] border border-line bg-white p-2.5 shadow-joya-sm sm:p-3">
      <div className="grid min-w-0 gap-2.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(240px,0.72fr)]">
      <div className="flex min-w-0 flex-col rounded-[22px] bg-coral-wash px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-data text-[10.5px] uppercase tracking-[0.1em] text-coral">
              Onduleur
            </p>
            <h3 className="mt-1 break-words font-display text-lg font-bold tracking-tight text-navy sm:truncate sm:text-xl">
              {inverter.name}
            </h3>
            {modelLine ? (
              <p className="mt-0.5 break-words text-[13px] text-ink-muted sm:truncate">
                {modelLine}
              </p>
            ) : null}
          </div>
          <InverterStatusPill status={inverter.status} label={inverter.statusLabel} />
        </div>

        <div className="mt-4 grid gap-2 xs:grid-cols-2 lg:grid-cols-4">
          <InverterDetailRow
            icon={<MapPin aria-hidden />}
            label="Emplacement"
            value={inverter.locationLabel ?? CLIENT_DASHBOARD_MISSING}
          />
          <InverterDetailRow
            icon={<Calendar aria-hidden />}
            label="Date d'installation"
            value={inverter.installationDateLabel ?? CLIENT_DASHBOARD_MISSING}
          />
          <InverterDetailRow
            icon={<Zap aria-hidden />}
            label="Capacité"
            value={capacityLabel}
          />
          <InverterDetailRow
            icon={<Cpu aria-hidden />}
            label="N° de série"
            value={inverter.serialNumber ?? CLIENT_DASHBOARD_MISSING}
            mono
          />
        </div>
      </div>

      <LivePower
        label="Puissance actuelle"
        kw={liveKw}
        suffix={inverter.lastUpdatedAt ?? undefined}
        capacityKw={capacityKw}
      />
      </div>
    </article>
  );
}

function AggregatedInverterCard({
  inverters,
  siteCapacityShort,
}: {
  inverters: DashboardInverter[];
  siteCapacityShort?: string;
}) {
  const statusInverter = pickWorstStatus(inverters);
  const totalPowerKw = inverters.reduce(
    (sum, inverter) => sum + (inverter.lastProductionRateKw ?? 0),
    0,
  );
  const connectedCount = inverters.filter(
    (inverter) => inverter.status === "connected",
  ).length;
  const totalCapacityLabel = formatTotalCapacity(inverters, siteCapacityShort);
  const totalCapacityKw = parseCapacityKw(totalCapacityLabel);

  return (
    <article className="rounded-[28px] border border-line bg-white p-2.5 shadow-joya-sm sm:p-3">
      <div className="grid min-w-0 gap-2.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(240px,0.72fr)]">
      <div className="flex min-w-0 flex-col rounded-[22px] bg-coral-wash px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-data text-[10.5px] uppercase tracking-[0.1em] text-coral">Parc onduleurs</p>
          <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-navy sm:text-xl">
            Tous les onduleurs du site
          </h3>
          <p className="mt-0.5 text-[13px] text-ink-muted">
            {inverters.length} onduleur{inverters.length > 1 ? "s" : ""}
            {connectedCount > 0
              ? ` · ${connectedCount} connecté${connectedCount > 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
        <InverterStatusPill
          status={statusInverter.status}
          label={statusInverter.statusLabel}
        />
      </div>

      <div className="mt-4 grid gap-2 xs:grid-cols-2 lg:grid-cols-4">
        <InverterDetailRow
          icon={<MapPin aria-hidden />}
          label="Emplacement"
          value={formatLocation(inverters)}
        />
        <InverterDetailRow
          icon={<Calendar aria-hidden />}
          label="Date d'installation"
          value={formatInstallationDates(inverters)}
        />
        <InverterDetailRow
          icon={<Zap aria-hidden />}
          label="Capacité totale"
          value={totalCapacityLabel}
        />
        <InverterDetailRow
          icon={<Cpu aria-hidden />}
          label="Équipements"
          value={`${inverters.length} onduleur${inverters.length > 1 ? "s" : ""}`}
        />
      </div>

      <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
        {inverters.map((inverter) => (
          <li
            key={inverter.id}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <JoyaStatusBadge
                status={STATUS_TO_JOYA[inverter.status] ?? "neutral"}
                label={inverter.statusLabel}
                size="sm"
                className="hidden xs:inline-flex"
              />
              <span className="truncate font-medium text-navy">{inverter.name}</span>
            </span>
            <span className="shrink-0 font-data text-[12.5px] tabular-nums text-ink-muted">
              {inverter.lastProductionRateKw != null && inverter.lastProductionRateKw > 0
                ? `${inverter.lastProductionRateKw.toLocaleString("fr-FR", {
                    maximumFractionDigits: 2,
                  })} kW`
                : inverter.statusLabel}
            </span>
          </li>
        ))}
      </ul>
      </div>

      <LivePower
        label="Puissance actuelle"
        kw={totalPowerKw}
        capacityKw={totalCapacityKw}
      />
      </div>
    </article>
  );
}

type DashboardInvertersSectionProps = {
  inverters: DashboardInverter[];
  /** When true, show site-level totals instead of a single inverter card. */
  aggregateView?: boolean;
  /** Site PV capacity label from dashboard API (e.g. "3,5 kWc installés"). */
  siteCapacityLabel?: string;
};

export function DashboardInvertersSection({
  inverters,
  aggregateView = false,
  siteCapacityLabel,
}: DashboardInvertersSectionProps) {
  const siteCapacityShort = siteCapacityLabel
    ? formatCapacityShort(siteCapacityLabel)
    : undefined;

  if (!inverters.length) {
    return null;
  }

  if (aggregateView && inverters.length > 1) {
    return (
      <AggregatedInverterCard
        inverters={inverters}
        siteCapacityShort={siteCapacityShort}
      />
    );
  }

  return (
    <InverterCard
      inverter={inverters[0]}
      siteCapacityShort={siteCapacityShort}
    />
  );
}
