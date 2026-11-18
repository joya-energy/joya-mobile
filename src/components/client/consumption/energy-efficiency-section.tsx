"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Building2,
  ChevronDown,
  Clock,
  Info,
  Lightbulb,
  Moon,
  Pencil,
  Search,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EdgeMetricPoint } from "@/lib/consumption/api";
import type { SeriesRow } from "@/components/client/consumption/edge-consumption-charts";
import {
  EFFICIENCY_SECTORS,
  WEEKDAYS,
  analyzeEnergyEfficiency,
  defaultEfficiencyProfile,
  hourFromHm,
  hoursForDate,
  loadEfficiencyProfile,
  normalizeJoyaSector,
  saveEfficiencyProfile,
  type DaySchedule,
  type EfficiencyAlert,
  type EnergyEfficiencyProfile,
  type WeeklySchedule,
} from "@/lib/consumption/energy-efficiency";
import { onboardingApi } from "@/lib/onboarding/api";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import {
  JoyaBarChart,
  TooltipTitle,
  formatValue,
} from "@/components/client/dashboard/chart-kit";

function weekSummary(week: WeeklySchedule): string {
  const openDays = WEEKDAYS.filter((wd) => week[wd.key]?.open);
  if (!openDays.length) return "Aucun jour ouvré";
  const first = week[openDays[0]!.key]!;
  const sameHours = openDays.every((wd) => {
    const day = week[wd.key];
    return day?.openTime === first.openTime && day?.closeTime === first.closeTime;
  });
  const labels = openDays.map((wd) => wd.short).join(", ");
  if (sameHours) {
    return `${labels} · ${first.openTime} – ${first.closeTime}`;
  }
  return `${labels} · horaires variables`;
}

function weekHoursLabel(week: WeeklySchedule): string {
  const openDays = WEEKDAYS.filter((wd) => week[wd.key]?.open);
  if (!openDays.length) return "—";
  const first = week[openDays[0]!.key]!;
  const sameHours = openDays.every((wd) => {
    const day = week[wd.key];
    return day?.openTime === first.openTime && day?.closeTime === first.closeTime;
  });
  if (!sameHours) return "Horaires variables";
  return `${first.openTime}–${first.closeTime}`;
}

function OffShareDonut({ percent }: { percent: number | null }) {
  const pct = percent != null && Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative h-[6.25rem] w-[6.25rem] shrink-0">
      <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke={JOYA_CHART.coral}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-[1.15rem] font-bold leading-none tabular-nums text-white">
          {percent != null ? `${percent}\u00a0%` : "—"}
        </span>
        <span className="mt-1 text-[9px] font-medium leading-tight text-white/55">
          hors fonct.
        </span>
      </div>
    </div>
  );
}

function tndBadge(value: number): string {
  return `≈ ${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}\u00a0TND`;
}

const OP_COLOR = JOYA_CHART.navy;
const OFF_COLOR = JOYA_CHART.coral;

function formatDt(value: number): string {
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function alertBadge(alert: EfficiencyAlert): { top: string; bottom: string } {
  if (alert.hourLabel) {
    return { top: alert.hourLabel, bottom: alert.hourCaption ?? "REPOS" };
  }
  if (alert.id === "closed-day") return { top: "Jour", bottom: "FERMÉ" };
  if (alert.id === "pf") return { top: "cos φ", bottom: "STEG" };
  if (alert.id === "subscribed") return { top: "kVA", bottom: "CONTRAT" };
  if (alert.id === "imbalance") return { top: "3~", bottom: "PHASES" };
  if (alert.id === "meter-silence") return { top: "—", bottom: "COMPTEUR" };
  return { top: "!", bottom: "ALERTE" };
}

function FeaturedAlertCard({
  alert,
  open,
  onToggle,
}: {
  alert: EfficiencyAlert;
  open: boolean;
  onToggle: () => void;
}) {
  const badge = alertBadge(alert);
  const panelId = `${alert.id}-panel`;

  return (
    <li className="overflow-hidden rounded-[22px] border border-line bg-white shadow-joya-sm">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5"
      >
        <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-[16px] bg-coral-wash">
          <span className="font-display text-[1.05rem] font-bold leading-none tabular-nums text-coral">
            {badge.top}
          </span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-coral/75">
            {badge.bottom}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-[1.05rem] font-bold leading-snug tracking-tight text-navy sm:text-lg">
            {alert.title}
          </h4>
          <p className="mt-0.5 text-[13px] text-ink-muted">{alert.hook}</p>
          {alert.measuredLabel || alert.thresholdLabel ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {alert.measuredLabel ? (
                <span className="rounded-full bg-coral-wash px-2.5 py-0.5 text-[12px] font-semibold tabular-nums text-coral">
                  {alert.measuredLabel}
                </span>
              ) : null}
              {alert.thresholdLabel ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-medium text-navy/65">
                  {alert.thresholdLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-3">
          {alert.savingsDtMonth != null ? (
            <div className="hidden text-right xs:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                Économie / mois
              </p>
              <p className="mt-0.5 font-display text-[1.35rem] font-bold leading-none tabular-nums text-coral">
                {formatDt(alert.savingsDtMonth)}
                <span className="ml-1 align-middle font-sans text-[13px] font-semibold">
                  DT
                </span>
              </p>
            </div>
          ) : null}
          <span className="mt-1 grid h-8 w-8 place-items-center rounded-full text-ink-muted">
            <ChevronDown
              className={open ? "h-5 w-5 rotate-180 transition-transform" : "h-5 w-5 transition-transform"}
              aria-hidden
            />
          </span>
        </div>
      </button>

      {open ? (
        <div id={panelId} className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-[16px] bg-cream-2/90 px-4 py-3.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-navy">
                <Sparkles className="h-3.5 w-3.5 text-coral" aria-hidden />
                Quand l&apos;alerte se déclenche
              </p>
              <p className="text-[13.5px] leading-relaxed text-ink-muted">
                {alert.whenTrigger}
              </p>
            </div>
            <div className="rounded-[16px] bg-cream-2/90 px-4 py-3.5">
              <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-navy">
                <Info className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
                Ce que cela signifie
              </p>
              <p className="text-[13.5px] leading-relaxed text-ink-muted">
                {alert.meaning}
              </p>
            </div>
          </div>

          {alert.actions.length > 0 ? (
            <div className="rounded-[16px] border border-coral/20 bg-coral-wash/40 px-4 py-3.5">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-coral">
                Nos recommandations
              </p>
              <ul className="flex flex-col gap-2">
                {alert.actions.map((item, index) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-[12px] bg-white px-3 py-2.5 text-[13.5px] text-navy"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-coral text-[11px] font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {alert.footer ? (
            <p className="flex items-start gap-2 text-[12.5px] text-ink-muted">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
              {alert.footer}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

type Props = {
  siteId: string | null;
  selectedDate: string;
  dateLabel: string;
  hourly: SeriesRow[];
  seriesPoints: EdgeMetricPoint[];
  latest: EdgeMetricPoint | null;
  lastTelemetryAt: string | null | undefined;
  isToday: boolean;
  hasMeter: boolean;
};

export function EnergyEfficiencySection({
  siteId,
  selectedDate,
  hourly,
  seriesPoints,
  latest,
  lastTelemetryAt,
  isToday,
  hasMeter,
}: Props) {
  const [draft, setDraft] = useState<EnergyEfficiencyProfile>(() =>
    defaultEfficiencyProfile(),
  );
  const [applied, setApplied] = useState<EnergyEfficiencyProfile>(() =>
    defaultEfficiencyProfile(),
  );
  const [editing, setEditing] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [openAlertId, setOpenAlertId] = useState<string | undefined>(undefined);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scheduleOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!scheduleRef.current?.contains(event.target as Node)) {
        setScheduleOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [scheduleOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = loadEfficiencyProfile(siteId, selectedDate);

      let companySector: string | null = null;
      try {
        const step1 = await onboardingApi.getStep1();
        companySector = normalizeJoyaSector(
          (step1 as { sector?: unknown } | null)?.sector,
        );
      } catch {
        companySector = null;
      }
      if (cancelled) return;

      const next = {
        ...loaded,
        sector: companySector ?? loaded.sector,
      };
      setDraft(next);
      setApplied(next);
      setEditing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [siteId, selectedDate]);

  const dayHours = useMemo(
    () => hoursForDate(applied, selectedDate),
    [applied, selectedDate],
  );
  const operatingBand = useMemo(() => {
    if (dayHours.dayKind === "closed") return undefined;
    const fromIndex = hourFromHm(dayHours.openTime);
    const closeHour = hourFromHm(dayHours.closeTime);
    const toIndex = Math.min(24, closeHour + 1);
    if (toIndex <= fromIndex) return undefined;
    return {
      fromIndex,
      toIndex,
      label: `Heures de fonctionnement · ${dayHours.openTime}–${dayHours.closeTime}`,
    };
  }, [dayHours]);

  const snapshot = useMemo(
    () =>
      analyzeEnergyEfficiency({
        profile: applied,
        hourly,
        seriesPoints,
        latest,
        lastTelemetryAt,
        isToday,
        selectedDate,
        hasMeter,
      }),
    [
      applied,
      hourly,
      seriesPoints,
      latest,
      lastTelemetryAt,
      isToday,
      selectedDate,
      hasMeter,
    ],
  );

  const apply = () => {
    saveEfficiencyProfile(siteId, draft);
    setApplied(draft);
    setEditing(false);
    setScheduleOpen(false);
  };

  const updateDay = (key: number, patch: Partial<DaySchedule>) => {
    setDraft((p) => {
      const week = p.week.map((day, i) =>
        i === key ? { ...day, ...patch } : day,
      );
      return { ...p, week };
    });
  };

  const display = editing ? draft : applied;
  const kwhNum = (v: number | null | undefined) =>
    v != null && Number.isFinite(v)
      ? v.toLocaleString("fr-FR", { maximumFractionDigits: 1 })
      : "—";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative z-20 flex flex-wrap items-center gap-3 rounded-[28px] bg-white px-3 py-2 shadow-joya-sm sm:px-4">
        <div className="flex shrink-0 items-center gap-2.5 px-2 py-2">
          <span className="h-2 w-2 rounded-full bg-coral" aria-hidden />
          <h3 className="text-sm font-semibold text-navy">Paramètres du site</h3>
        </div>

        <div className="flex min-h-[3.25rem] min-w-[9.5rem] flex-col justify-center rounded-2xl bg-slate-50 px-4 py-2">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <Building2 className="h-3 w-3" aria-hidden />
            Secteur
          </p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-navy">
            {display.sector || "—"}
          </p>
        </div>

        <div className="flex min-h-[3.25rem] flex-col justify-center rounded-2xl bg-slate-50 px-4 py-2">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <Clock className="h-3 w-3" aria-hidden />
            Fonctionnement
          </p>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="flex items-center gap-0.5">
              {WEEKDAYS.map((wd) => {
                const open = Boolean(display.week[wd.key]?.open);
                return (
                  <span
                    key={wd.key}
                    className={
                      open
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white"
                        : "flex h-5 w-5 items-center justify-center text-[10px] font-semibold text-slate-300"
                    }
                  >
                    {wd.short.charAt(0)}
                  </span>
                );
              })}
            </span>
            <span className="text-[13px] font-semibold tabular-nums text-navy">
              {weekHoursLabel(display.week)}
            </span>
          </div>
        </div>

        <div className="flex min-h-[3.25rem] min-w-[9.5rem] flex-col justify-center rounded-2xl bg-slate-50 px-4 py-2">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
            <Zap className="h-3 w-3" aria-hidden />
            Puissance souscrite
          </p>
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-navy">
            {display.subscribedKva != null
              ? `${display.subscribedKva.toLocaleString("fr-FR")} kVA`
              : "—"}
          </p>
        </div>

        {editing ? (
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={() => {
                setDraft(applied);
                setEditing(false);
                setScheduleOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="h-11 rounded-2xl bg-navy px-5 text-white hover:bg-navy-dark"
              onClick={apply}
            >
              Enregistrer
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            className="ml-auto h-11 gap-1.5 rounded-2xl bg-navy px-5 text-white hover:bg-navy-dark"
            onClick={() => {
              setEditing(true);
              setScheduleOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Modifier
          </Button>
        )}
      </div>

      {editing ? (
      <Card className="relative z-20 overflow-visible border-line bg-white shadow-joya-sm">
        <CardContent className="overflow-visible p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:items-end">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">Secteur d&apos;activité</Label>
              <Select
                value={draft.sector || undefined}
                onValueChange={(sector) => setDraft((p) => ({ ...p, sector }))}
                disabled={!editing}
              >
                <SelectTrigger className="h-9 bg-white">
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  {EFFICIENCY_SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative space-y-1.5 sm:col-span-2 lg:col-span-1" ref={scheduleRef}>
              <Label className="text-xs text-slate-600">
                Jours et horaires de fonctionnement
              </Label>
              <button
                type="button"
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-white px-3 text-left text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setScheduleOpen((open) => !open)}
              >
                <span className="truncate">{weekSummary(draft.week)}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                    scheduleOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {scheduleOpen ? (
                <div className="absolute left-0 top-full z-50 mt-1 w-[min(calc(100vw-2rem),28rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <p className="mb-2 px-1 text-[11px] text-slate-400">
                    Cochez les jours ouvrés et l&apos;horaire de chaque jour.
                  </p>
                  <div className="grid grid-cols-[auto_1fr_6.75rem_6.75rem] gap-x-2 px-1 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    <span />
                    <span>Jour</span>
                    <span>Début</span>
                    <span>Fin</span>
                  </div>
                  {WEEKDAYS.map((wd) => {
                    const day = draft.week[wd.key] ?? {
                      open: false,
                      openTime: "08:00",
                      closeTime: "17:00",
                    };
                    return (
                      <div
                        key={wd.key}
                        className="grid grid-cols-[auto_1fr_6.75rem_6.75rem] items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-navy"
                          checked={day.open}
                          disabled={!editing}
                          onChange={(e) =>
                            updateDay(wd.key, { open: e.target.checked })
                          }
                        />
                        <span
                          className={`text-sm ${
                            day.open
                              ? "font-medium text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {wd.label}
                        </span>
                        <Input
                          type="time"
                          className="h-8"
                          disabled={!editing || !day.open}
                          value={day.openTime}
                          onChange={(e) =>
                            updateDay(wd.key, { openTime: e.target.value })
                          }
                        />
                        <Input
                          type="time"
                          className="h-8"
                          disabled={!editing || !day.open}
                          value={day.closeTime}
                          onChange={(e) =>
                            updateDay(wd.key, { closeTime: e.target.value })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600">
                Puissance souscrite (kVA)
              </Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                placeholder="ex : 12 kVA"
                className="h-9"
                disabled={!editing}
                value={draft.subscribedKva ?? ""}
                onChange={(e) => {
                  const n = e.target.value === "" ? null : Number(e.target.value);
                  setDraft((p) => ({
                    ...p,
                    subscribedKva: n != null && Number.isFinite(n) ? n : null,
                  }));
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative flex min-h-[11.5rem] overflow-hidden rounded-[24px] bg-navy-dark px-5 py-5 text-white shadow-joya-sm">
          <div
            className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-coral/25 blur-2xl"
            aria-hidden
          />
          <div className="relative flex w-full items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[13px] font-medium text-white/75">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <Activity className="h-3.5 w-3.5" aria-hidden />
                </span>
                Total du jour
              </p>
              <p className="mt-3 font-display text-[2.15rem] font-bold leading-none tracking-tight tabular-nums">
                {kwhNum(snapshot.totalKwh)}
                <span className="ml-1.5 align-middle text-[15px] font-semibold text-white/50">
                  kWh
                </span>
              </p>
              <div className="mt-4 space-y-1.5 text-[12px] text-white/70">
                <p className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-white" aria-hidden />
                  Fonctionnement
                </p>
                <p className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: OFF_COLOR }}
                    aria-hidden
                  />
                  Hors fonct.
                </p>
              </div>
              <p className="mt-4 max-w-[11rem] text-[11px] leading-snug text-white/40">
                Production équivalente non déduite
              </p>
            </div>
            <OffShareDonut percent={snapshot.offSharePct} />
          </div>
        </div>

        <div className="relative flex min-h-[11.5rem] flex-col overflow-hidden rounded-[24px] bg-white px-5 py-5 shadow-joya-sm">
          <p className="relative flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
              <Sun className="h-3.5 w-3.5 text-navy/55" aria-hidden />
            </span>
            Heures de fonctionnement
          </p>
          <p className="relative mt-4 font-display text-[2.15rem] font-bold leading-none tracking-tight tabular-nums text-navy">
            {kwhNum(snapshot.operatingKwh)}
            <span className="ml-1.5 align-middle text-[15px] font-semibold text-slate-400">
              kWh
            </span>
          </p>
          <div className="relative mt-auto flex items-end justify-between gap-2 pt-6">
            <p className="text-xs text-slate-400">Journée affichée</p>
            {snapshot.operatingDt != null ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-navy/70">
                {tndBadge(snapshot.operatingDt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative flex min-h-[11.5rem] flex-col overflow-hidden rounded-[24px] bg-white px-5 py-5 shadow-joya-sm">
          <p className="relative flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
              <Moon className="h-3.5 w-3.5 text-coral" aria-hidden />
            </span>
            Hors fonctionnement
          </p>
          <p className="relative mt-4 font-display text-[2.15rem] font-bold leading-none tracking-tight tabular-nums text-navy">
            {kwhNum(snapshot.offKwh)}
            <span className="ml-1.5 align-middle text-[15px] font-semibold text-slate-400">
              kWh
            </span>
          </p>
          <div className="relative mt-auto flex items-end justify-between gap-2 pt-6">
            <p className="text-xs text-slate-400">Gaspillage potentiel</p>
            {snapshot.offDt != null ? (
              <span className="rounded-full bg-coral-wash px-2.5 py-1 text-[11px] font-semibold tabular-nums text-coral-dark">
                {tndBadge(snapshot.offDt)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative flex min-h-[11.5rem] flex-col overflow-hidden rounded-[24px] bg-white px-5 py-5 shadow-joya-sm">
          <p className="relative flex items-center gap-2 text-[13px] font-medium text-slate-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
              <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden />
            </span>
            Part hors fonct.
          </p>
          <p className="relative mt-4 font-display text-[2.15rem] font-bold leading-none tracking-tight tabular-nums text-navy">
            {snapshot.offSharePct != null ? snapshot.offSharePct : "—"}
            <span className="ml-1.5 align-middle text-[15px] font-semibold text-slate-400">
              %
            </span>
          </p>
          <div className="relative mt-auto pt-6">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 to-coral"
                style={{ width: `${snapshot.offSharePct ?? 0}%` }}
              />
            </div>
            <p className="mt-2.5 text-xs text-slate-400">De la conso. totale</p>
          </div>
        </div>
      </div>

      <section className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-5 shadow-joya-sm sm:p-6">
        <div className="min-w-0">
          <h2 className="font-display text-[1.35rem] font-bold tracking-[-0.025em] text-navy-dark">
            Consommation horaire · 24h
          </h2>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13.5px] text-ink-muted">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: OP_COLOR }}
                aria-hidden
              />
              Heures de fonctionnement (kWh)
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: OFF_COLOR }}
                aria-hidden
              />
              Heures hors fonctionnement (kWh)
            </span>
          </div>
        </div>

        <div className="relative mt-4 h-64 sm:h-72">
          <JoyaBarChart
            bars={snapshot.bars.map((b) => ({
              label: b.label,
              value: b.operating + b.off,
              color: b.off > b.operating ? OFF_COLOR : OP_COLOR,
            }))}
            color={OP_COLOR}
            unit="kWh"
            ariaLabel="Consommation horaire, heures de fonctionnement et hors fonctionnement"
            showAverage={false}
            bestLabel=""
            highlightBand={operatingBand}
            renderTooltip={(i) => {
              const b = snapshot.bars[i];
              return (
                <div className="min-w-[13rem]">
                  <TooltipTitle>Heure {b.label}</TooltipTitle>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: OP_COLOR }}
                        aria-hidden
                      />
                      <span className="text-ink-muted">Fonctionnement</span>
                      <span className="ml-auto font-display font-bold tabular-nums text-navy">
                        {formatValue(b.operating, "kWh", 2)}
                      </span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: OFF_COLOR }}
                        aria-hidden
                      />
                      <span className="text-ink-muted">Hors fonctionnement</span>
                      <span className="ml-auto font-display font-bold tabular-nums text-navy">
                        {formatValue(b.off, "kWh", 2)}
                      </span>
                    </p>
                  </div>
                </div>
              );
            }}
          />
        </div>

        <p className="mt-3 border-t border-line pt-3 text-[13px] text-ink-muted">
          Répartition calculée à partir des kWh horaires du compteur et des
          horaires déclarés du site (même source que l&apos;onglet Consommation).
        </p>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(165deg,#f4a07e_0%,var(--joya-coral)_48%,#d85a38_100%)] text-white shadow-[0_10px_20px_-10px_rgb(227_112_81_/_0.85)]">
              <Search className="h-[18px] w-[18px] stroke-[2.4]" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-[1.2rem] font-bold tracking-tight text-navy">
                Ce que nous détectons pour vous
              </h3>
              <p className="mt-0.5 text-[13px] text-ink-muted">
                Pour chaque alerte : pourquoi elle se déclenche, ce que cela
                implique et ce que nous vous conseillons.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-stretch gap-2">
            <div className="rounded-[14px] border border-line bg-white px-3.5 py-2 text-center shadow-joya-xs">
              <p className="text-[11px] font-medium text-ink-muted">Alertes</p>
              <p className="font-display text-lg font-bold tabular-nums leading-none text-navy">
                {snapshot.alerts.length}
              </p>
            </div>
            <div className="rounded-[14px] border border-line bg-white px-3.5 py-2 text-right shadow-joya-xs">
              <p className="text-[11px] font-medium text-ink-muted">
                Économie potentielle
              </p>
              <p className="font-display text-[1.05rem] font-bold tabular-nums leading-none text-coral">
                {formatDt(
                  snapshot.alerts.reduce(
                    (sum, alert) => sum + (alert.savingsDtMonth ?? 0),
                    0,
                  ),
                )}
                <span className="ml-1 align-middle font-sans text-[12px] font-semibold">
                  DT
                </span>
                <span className="ml-0.5 align-middle font-sans text-[11px] font-medium text-ink-muted">
                  /mois
                </span>
              </p>
            </div>
          </div>
        </div>
        {snapshot.alerts.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Aucune alerte pour cette journée.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {snapshot.alerts.map((alert) => {
              const expandedId =
                openAlertId === undefined ? snapshot.alerts[0]?.id : openAlertId;
              return (
                <FeaturedAlertCard
                  key={alert.id}
                  alert={alert}
                  open={alert.id === expandedId}
                  onToggle={() =>
                    setOpenAlertId(alert.id === expandedId ? "" : alert.id)
                  }
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
