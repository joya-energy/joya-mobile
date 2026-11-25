import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  Building2,
  Check,
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
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EdgeMetricPoint } from "@/lib/consumption/api";
import {
  TABULAR,
  type SeriesRow,
} from "@/components/client/consumption/edge-consumption-charts";
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
import { PillSelect } from "@/components/client/onboarding-info/pill-select";
import { joyaColors } from "@/theme/colors";

const joyaNeutralIcon = "#94a3b8";

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

const DONUT_SIZE = 100;

function OffShareDonut({ percent }: { percent: number | null }) {
  const pct =
    percent != null && Number.isFinite(percent)
      ? Math.min(100, Math.max(0, percent))
      : 0;
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }} className="shrink-0">
      <Svg width={DONUT_SIZE} height={DONUT_SIZE} viewBox="0 0 88 88">
        <Circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={9}
        />
        <Circle
          cx={44}
          cy={44}
          r={r}
          fill="none"
          stroke={JOYA_CHART.coral}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={[dash, c]}
          rotation={-90}
          origin="44, 44"
        />
      </Svg>
      <View className="absolute inset-0 items-center justify-center">
        <Text
          className="font-display text-[18px] font-bold leading-none text-white"
          style={TABULAR}
        >
          {percent != null ? `${percent}\u00a0%` : "—"}
        </Text>
        <Text className="mt-1 text-[9px] font-medium leading-tight text-white/55">
          hors fonct.
        </Text>
      </View>
    </View>
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

function SavingsBlock({
  value,
  align = "right",
}: {
  value: number;
  align?: "left" | "right";
}) {
  return (
    <View className={align === "right" ? "items-end" : "items-start"}>
      <Text className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
        Économie / mois
      </Text>
      <Text
        className="mt-0.5 font-display text-[22px] font-bold leading-none text-coral"
        style={TABULAR}
      >
        {formatDt(value)}
        <Text className="text-[13px] font-semibold"> DT</Text>
      </Text>
    </View>
  );
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

  return (
    <View className="overflow-hidden rounded-[22px] border border-line bg-white shadow-joya-sm">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        className="flex-row items-start gap-3 px-4 py-4"
      >
        <View className="h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-coral-wash">
          <Text
            numberOfLines={1}
            className="font-display text-[16px] font-bold leading-none text-coral"
            style={TABULAR}
          >
            {badge.top}
          </Text>
          <Text className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-coral/75">
            {badge.bottom}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[16px] font-bold leading-snug tracking-tight text-navy">
            {alert.title}
          </Text>
          <Text className="mt-0.5 text-[13px] text-ink-muted">{alert.hook}</Text>
          {alert.measuredLabel || alert.thresholdLabel ? (
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {alert.measuredLabel ? (
                <View className="rounded-full bg-coral-wash px-2.5 py-0.5">
                  <Text
                    className="text-[12px] font-semibold text-coral"
                    style={TABULAR}
                  >
                    {alert.measuredLabel}
                  </Text>
                </View>
              ) : null}
              {alert.thresholdLabel ? (
                <View className="rounded-full bg-slate-100 px-2.5 py-0.5">
                  <Text className="text-[12px] font-medium text-navy/65">
                    {alert.thresholdLabel}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          {alert.savingsDtMonth != null ? (
            <View className="mt-2.5 xs:hidden">
              <SavingsBlock value={alert.savingsDtMonth} align="left" />
            </View>
          ) : null}
        </View>
        <View className="shrink-0 flex-row items-start gap-3">
          {alert.savingsDtMonth != null ? (
            <View className="hidden xs:flex">
              <SavingsBlock value={alert.savingsDtMonth} />
            </View>
          ) : null}
          <View
            className="mt-1 h-8 w-8 items-center justify-center rounded-full"
            style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}
          >
            <ChevronDown size={20} color="rgba(23,59,94,0.66)" />
          </View>
        </View>
      </Pressable>

      {open ? (
        <View className="gap-3 px-4 pb-4">
          <View className="gap-2.5">
            <View className="rounded-[16px] bg-cream-2 px-4 py-3.5">
              <View className="mb-1.5 flex-row items-center gap-1.5">
                <Sparkles size={14} color={joyaColors.coral} />
                <Text className="text-[12.5px] font-semibold text-navy">
                  Quand l&apos;alerte se déclenche
                </Text>
              </View>
              <Text className="text-[13.5px] leading-relaxed text-ink-muted">
                {alert.whenTrigger}
              </Text>
            </View>
            <View className="rounded-[16px] bg-cream-2 px-4 py-3.5">
              <View className="mb-1.5 flex-row items-center gap-1.5">
                <Info size={14} color="rgba(23,59,94,0.66)" />
                <Text className="text-[12.5px] font-semibold text-navy">
                  Ce que cela signifie
                </Text>
              </View>
              <Text className="text-[13.5px] leading-relaxed text-ink-muted">
                {alert.meaning}
              </Text>
            </View>
          </View>

          {alert.actions.length > 0 ? (
            <View className="rounded-[16px] border border-coral/20 bg-coral-wash/60 px-4 py-3.5">
              <Text className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-coral">
                Nos recommandations
              </Text>
              <View className="gap-2">
                {alert.actions.map((item, index) => (
                  <View
                    key={item}
                    className="flex-row items-start gap-3 rounded-[12px] bg-white px-3 py-2.5"
                  >
                    <View className="h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral">
                      <Text className="text-[11px] font-bold text-white">
                        {index + 1}
                      </Text>
                    </View>
                    <Text className="min-w-0 flex-1 pt-0.5 text-[13.5px] text-navy">
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {alert.footer ? (
            <View className="flex-row items-start gap-2">
              <View className="mt-0.5">
                <Lightbulb size={14} color={joyaColors.coral} />
              </View>
              <Text className="min-w-0 flex-1 text-[12.5px] text-ink-muted">
                {alert.footer}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function normalizeTime(text: string): string | null {
  const m = TIME_RE.exec(text.trim());
  if (!m) return null;
  return `${m[1]!.padStart(2, "0")}:${m[2]}`;
}

/** `HH:MM` text field (native replacement for `<input type="time">`). */
function TimeField({
  value,
  disabled,
  onCommit,
  label,
}: {
  value: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
  label: string;
}) {
  // `null` = not editing → mirror the committed value from the parent.
  const [text, setText] = useState<string | null>(null);

  return (
    <Input
      accessibilityLabel={label}
      editable={!disabled}
      value={text ?? value}
      placeholder="08:00"
      maxLength={5}
      keyboardType="numbers-and-punctuation"
      onChangeText={(next) => {
        setText(next);
        const normalized = normalizeTime(next);
        if (normalized) onCommit(normalized);
      }}
      onBlur={() => setText(null)}
      className={cn("h-9 w-[76px] px-2 text-center text-sm", disabled && "opacity-40")}
    />
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-xs text-slate-600">{children}</Text>;
}

function InfoTile({
  icon,
  label,
  children,
  className,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "min-h-[52px] min-w-[140px] justify-center rounded-2xl bg-slate-50 px-4 py-2",
        className,
      )}
    >
      <View className="flex-row items-center gap-1.5">
        {icon}
        <Text className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
          {label}
        </Text>
      </View>
      {children}
    </View>
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
  const [kvaText, setKvaText] = useState("");
  const [openAlertId, setOpenAlertId] = useState<string | undefined>(undefined);

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

  const totalSavings = snapshot.alerts.reduce(
    (sum, alert) => sum + (alert.savingsDtMonth ?? 0),
    0,
  );

  return (
    <View className="gap-4">
      {/* Paramètres du site */}
      <View className="gap-3 rounded-[28px] bg-white px-3 py-3 shadow-joya-sm">
        <View className="flex-row items-center gap-2.5 px-2 pt-1">
          <View className="h-2 w-2 rounded-full bg-coral" />
          <Text className="text-sm font-semibold text-navy">
            Paramètres du site
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <InfoTile
            label="Secteur"
            icon={<Building2 size={12} color={joyaNeutralIcon} />}
            className="flex-1"
          >
            <Text
              numberOfLines={1}
              className="mt-0.5 text-[13px] font-semibold text-navy"
            >
              {display.sector || "—"}
            </Text>
          </InfoTile>

          <InfoTile
            label="Fonctionnement"
            icon={<Clock size={12} color={joyaNeutralIcon} />}
            className="flex-1"
          >
            <View className="mt-0.5 flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-0.5">
                {WEEKDAYS.map((wd) => {
                  const open = Boolean(display.week[wd.key]?.open);
                  return (
                    <View
                      key={wd.key}
                      className={cn(
                        "h-5 w-5 items-center justify-center",
                        open && "rounded-full bg-navy",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-[10px] font-bold",
                          open ? "text-white" : "font-semibold text-slate-300",
                        )}
                      >
                        {wd.short.charAt(0)}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text
                className="text-[13px] font-semibold text-navy"
                style={TABULAR}
              >
                {weekHoursLabel(display.week)}
              </Text>
            </View>
          </InfoTile>

          <InfoTile
            label="Puissance souscrite"
            icon={<Zap size={12} color={joyaNeutralIcon} />}
            className="flex-1"
          >
            <Text
              className="mt-0.5 text-[13px] font-semibold text-navy"
              style={TABULAR}
            >
              {display.subscribedKva != null
                ? `${display.subscribedKva.toLocaleString("fr-FR")} kVA`
                : "—"}
            </Text>
          </InfoTile>
        </View>

        {editing ? (
          <View className="flex-row justify-end gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-2xl"
              onPress={() => {
                setDraft(applied);
                setEditing(false);
                setScheduleOpen(false);
              }}
            >
              Annuler
            </Button>
            <Button className="h-11 rounded-2xl bg-navy px-5" onPress={apply}>
              Enregistrer
            </Button>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setKvaText(
                draft.subscribedKva != null ? String(draft.subscribedKva) : "",
              );
              setEditing(true);
              setScheduleOpen(true);
            }}
            className="h-11 flex-row items-center justify-center gap-1.5 self-end rounded-2xl bg-navy px-5 active:bg-navy-dark"
          >
            <Pencil size={14} color="#fff" />
            <Text className="text-sm font-semibold text-white">Modifier</Text>
          </Pressable>
        )}
      </View>

      {editing ? (
        <Card className="gap-4 rounded-xl border-line bg-white p-4 shadow-joya-sm">
          <View className="gap-1.5">
            <FieldLabel>Secteur d&apos;activité</FieldLabel>
            <PillSelect
              label="Sélectionnez"
              className="h-10 rounded-xl"
              value={draft.sector}
              options={EFFICIENCY_SECTORS.map((s) => ({ value: s, label: s }))}
              onChange={(sector) => setDraft((p) => ({ ...p, sector }))}
            />
          </View>

          <View className="gap-1.5">
            <FieldLabel>Jours et horaires de fonctionnement</FieldLabel>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: scheduleOpen }}
              onPress={() => setScheduleOpen((open) => !open)}
              className="h-10 flex-row items-center justify-between gap-2 rounded-xl border border-line bg-white px-3"
            >
              <Text numberOfLines={1} className="min-w-0 flex-1 text-sm text-slate-800">
                {weekSummary(draft.week)}
              </Text>
              <View
                style={{ transform: [{ rotate: scheduleOpen ? "180deg" : "0deg" }] }}
              >
                <ChevronDown size={16} color="#64748b" />
              </View>
            </Pressable>

            {scheduleOpen ? (
              <View className="mt-1 rounded-xl border border-slate-200 bg-white p-2">
                <Text className="mb-2 px-1 text-[11px] text-slate-400">
                  Cochez les jours ouvrés et l&apos;horaire de chaque jour.
                </Text>
                <View className="flex-row items-center gap-2 px-1 pb-1">
                  <View className="w-[22px]" />
                  <Text className="flex-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Jour
                  </Text>
                  <Text className="w-[76px] text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Début
                  </Text>
                  <Text className="w-[76px] text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    Fin
                  </Text>
                </View>
                {WEEKDAYS.map((wd) => {
                  const day = draft.week[wd.key] ?? {
                    open: false,
                    openTime: "08:00",
                    closeTime: "17:00",
                  };
                  return (
                    <View
                      key={wd.key}
                      className="flex-row items-center gap-2 rounded-lg px-1 py-1.5"
                    >
                      <Pressable
                        accessibilityRole="checkbox"
                        accessibilityLabel={wd.label}
                        accessibilityState={{ checked: day.open }}
                        hitSlop={8}
                        onPress={() => updateDay(wd.key, { open: !day.open })}
                        className={cn(
                          "h-[22px] w-[22px] items-center justify-center rounded-md border",
                          day.open ? "border-navy bg-navy" : "border-line-strong bg-white",
                        )}
                      >
                        {day.open ? <Check size={14} color="#fff" /> : null}
                      </Pressable>
                      <Text
                        className={cn(
                          "flex-1 text-sm",
                          day.open ? "font-medium text-slate-800" : "text-slate-400",
                        )}
                      >
                        {wd.label}
                      </Text>
                      <TimeField
                        label={`${wd.label} — début`}
                        disabled={!day.open}
                        value={day.openTime}
                        onCommit={(openTime) => updateDay(wd.key, { openTime })}
                      />
                      <TimeField
                        label={`${wd.label} — fin`}
                        disabled={!day.open}
                        value={day.closeTime}
                        onCommit={(closeTime) => updateDay(wd.key, { closeTime })}
                      />
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View className="gap-1.5">
            <FieldLabel>Puissance souscrite (kVA)</FieldLabel>
            <Input
              keyboardType="decimal-pad"
              placeholder="ex : 12 kVA"
              className="h-10"
              value={kvaText}
              onChangeText={(text) => {
                setKvaText(text);
                const cleaned = text.replace(",", ".").trim();
                const n = cleaned === "" ? null : Number(cleaned);
                setDraft((p) => ({
                  ...p,
                  subscribedKva: n != null && Number.isFinite(n) ? n : null,
                }));
              }}
            />
          </View>
        </Card>
      ) : null}

      {/* KPI cards */}
      <View className="gap-4">
        <View className="relative min-h-[184px] flex-row overflow-hidden rounded-[24px] bg-navy-dark px-5 py-5 shadow-joya-sm">
          <View
            pointerEvents="none"
            className="absolute -bottom-10 -right-6 h-32 w-32"
          >
            <Svg width={128} height={128}>
              <Defs>
                <RadialGradient id="eff-glow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={JOYA_CHART.coral} stopOpacity={0.4} />
                  <Stop offset="100%" stopColor={JOYA_CHART.coral} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width={128} height={128} fill="url(#eff-glow)" />
            </Svg>
          </View>
          <View className="w-full flex-row items-center justify-between gap-3">
            <View className="min-w-0 shrink">
              <View className="flex-row items-center gap-2">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                  <Activity size={14} color="#fff" />
                </View>
                <Text className="text-[13px] font-medium text-white/75">
                  Total du jour
                </Text>
              </View>
              <Text
                className="mt-3 font-display text-[34px] font-bold leading-none tracking-tight text-white"
                style={TABULAR}
              >
                {kwhNum(snapshot.totalKwh)}
                <Text className="text-[15px] font-semibold text-white/50"> kWh</Text>
              </Text>
              <View className="mt-4 gap-1.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-white" />
                  <Text className="text-[12px] text-white/70">Fonctionnement</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: OFF_COLOR }}
                  />
                  <Text className="text-[12px] text-white/70">Hors fonct.</Text>
                </View>
              </View>
              <Text className="mt-4 max-w-[176px] text-[11px] leading-snug text-white/40">
                Production équivalente non déduite
              </Text>
            </View>
            <OffShareDonut percent={snapshot.offSharePct} />
          </View>
        </View>

        <View className="min-h-[184px] overflow-hidden rounded-[24px] bg-white px-5 py-5 shadow-joya-sm">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
              <Sun size={14} color="rgba(23,59,94,0.55)" />
            </View>
            <Text className="text-[13px] font-medium text-slate-500">
              Heures de fonctionnement
            </Text>
          </View>
          <Text
            className="mt-4 font-display text-[34px] font-bold leading-none tracking-tight text-navy"
            style={TABULAR}
          >
            {kwhNum(snapshot.operatingKwh)}
            <Text className="text-[15px] font-semibold text-slate-400"> kWh</Text>
          </Text>
          <View className="mt-auto flex-row items-end justify-between gap-2 pt-6">
            <Text className="text-xs text-slate-400">Journée affichée</Text>
            {snapshot.operatingDt != null ? (
              <View className="rounded-full bg-slate-100 px-2.5 py-1">
                <Text
                  className="text-[11px] font-semibold text-navy/70"
                  style={TABULAR}
                >
                  {tndBadge(snapshot.operatingDt)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="min-h-[184px] overflow-hidden rounded-[24px] bg-white px-5 py-5 shadow-joya-sm">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
              <Moon size={14} color={joyaColors.coral} />
            </View>
            <Text className="text-[13px] font-medium text-slate-500">
              Hors fonctionnement
            </Text>
          </View>
          <Text
            className="mt-4 font-display text-[34px] font-bold leading-none tracking-tight text-navy"
            style={TABULAR}
          >
            {kwhNum(snapshot.offKwh)}
            <Text className="text-[15px] font-semibold text-slate-400"> kWh</Text>
          </Text>
          <View className="mt-auto flex-row items-end justify-between gap-2 pt-6">
            <Text className="text-xs text-slate-400">Gaspillage potentiel</Text>
            {snapshot.offDt != null ? (
              <View className="rounded-full bg-coral-wash px-2.5 py-1">
                <Text
                  className="text-[11px] font-semibold text-coral-dark"
                  style={TABULAR}
                >
                  {tndBadge(snapshot.offDt)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="min-h-[184px] overflow-hidden rounded-[24px] bg-white px-5 py-5 shadow-joya-sm">
          <View className="flex-row items-center gap-2">
            <View className="h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
              <Clock size={14} color="#f59e0b" />
            </View>
            <Text className="text-[13px] font-medium text-slate-500">
              Part hors fonct.
            </Text>
          </View>
          <Text
            className="mt-4 font-display text-[34px] font-bold leading-none tracking-tight text-navy"
            style={TABULAR}
          >
            {snapshot.offSharePct != null ? snapshot.offSharePct : "—"}
            <Text className="text-[15px] font-semibold text-slate-400"> %</Text>
          </Text>
          <View className="mt-auto pt-6">
            <View className="h-2 overflow-hidden rounded-full bg-slate-100">
              <LinearGradient
                colors={["#fcd34d", JOYA_CHART.coral]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  height: "100%",
                  borderRadius: 999,
                  width: `${Math.min(100, Math.max(0, snapshot.offSharePct ?? 0))}%`,
                }}
              />
            </View>
            <Text className="mt-2.5 text-xs text-slate-400">De la conso. totale</Text>
          </View>
        </View>
      </View>

      {/* Hourly chart */}
      <View className="min-w-0 rounded-2xl border border-line bg-white p-5 shadow-joya-sm">
        <View className="min-w-0">
          <Text className="font-display text-[21px] font-bold tracking-[-0.5px] text-navy-dark">
            Consommation horaire · 24h
          </Text>
          <View className="mt-2.5 flex-row flex-wrap items-center gap-x-5 gap-y-1.5">
            <View className="flex-row items-center gap-2">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: OP_COLOR }}
              />
              <Text className="text-[13.5px] text-ink-muted">
                Heures de fonctionnement (kWh)
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: OFF_COLOR }}
              />
              <Text className="text-[13.5px] text-ink-muted">
                Heures hors fonctionnement (kWh)
              </Text>
            </View>
          </View>
        </View>

        <View className="relative mt-4 h-64">
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
              if (!b) return null;
              return (
                <View className="min-w-[200px]">
                  <TooltipTitle>Heure {b.label}</TooltipTitle>
                  <View className="mt-2 gap-1.5">
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: OP_COLOR }}
                      />
                      <Text className="flex-1 text-sm text-ink-muted">
                        Fonctionnement
                      </Text>
                      <Text
                        className="font-display text-sm font-bold text-navy"
                        style={TABULAR}
                      >
                        {formatValue(b.operating, "kWh", 2)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: OFF_COLOR }}
                      />
                      <Text className="flex-1 text-sm text-ink-muted">
                        Hors fonctionnement
                      </Text>
                      <Text
                        className="font-display text-sm font-bold text-navy"
                        style={TABULAR}
                      >
                        {formatValue(b.off, "kWh", 2)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </View>

        <Text className="mt-3 border-t border-line pt-3 text-[13px] text-ink-muted">
          Répartition calculée à partir des kWh horaires du compteur et des
          horaires déclarés du site (même source que l&apos;onglet Consommation).
        </Text>
      </View>

      {/* Alerts */}
      <View>
        <View className="mb-3 gap-3">
          <View className="flex-row items-start gap-3">
            <LinearGradient
              colors={["#f4a07e", JOYA_CHART.coral, "#d85a38"]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={{
                marginTop: 2,
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search size={18} color="#fff" strokeWidth={2.4} />
            </LinearGradient>
            <View className="min-w-0 flex-1">
              <Text className="font-display text-[19px] font-bold tracking-tight text-navy">
                Ce que nous détectons pour vous
              </Text>
              <Text className="mt-0.5 text-[13px] text-ink-muted">
                Pour chaque alerte : pourquoi elle se déclenche, ce que cela
                implique et ce que nous vous conseillons.
              </Text>
            </View>
          </View>
          <View className="flex-row items-stretch gap-2">
            <View className="items-center rounded-[14px] border border-line bg-white px-3.5 py-2 shadow-joya-xs">
              <Text className="text-[11px] font-medium text-ink-muted">Alertes</Text>
              <Text
                className="font-display text-lg font-bold leading-none text-navy"
                style={TABULAR}
              >
                {snapshot.alerts.length}
              </Text>
            </View>
            <View className="items-end rounded-[14px] border border-line bg-white px-3.5 py-2 shadow-joya-xs">
              <Text className="text-[11px] font-medium text-ink-muted">
                Économie potentielle
              </Text>
              <Text
                className="font-display text-[17px] font-bold leading-none text-coral"
                style={TABULAR}
              >
                {formatDt(totalSavings)}
                <Text className="text-[12px] font-semibold"> DT</Text>
                <Text className="text-[11px] font-medium text-ink-muted"> /mois</Text>
              </Text>
            </View>
          </View>
        </View>

        {snapshot.alerts.length === 0 ? (
          <View className="rounded-xl border border-slate-200 bg-white px-4 py-8">
            <Text className="text-center text-sm text-slate-500">
              Aucune alerte pour cette journée.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
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
          </View>
        )}
      </View>
    </View>
  );
}
