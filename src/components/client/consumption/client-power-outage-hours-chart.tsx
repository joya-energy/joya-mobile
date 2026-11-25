import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { consumptionApi } from "@/lib/consumption/api";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import {
  JoyaBarChart,
  TooltipTitle,
  TooltipValue,
} from "@/components/client/dashboard/chart-kit";
import { PillSelect } from "@/components/client/onboarding-info/pill-select";
import {
  AccentTitle,
  StatBox,
} from "@/components/client/consumption/edge-consumption-charts";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const MONTH_SHORT = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const CHART_COLOR = JOYA_CHART.navy;

const PERIODS = [
  { id: "day", label: "Jour" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
] as const;

type Period = (typeof PERIODS)[number]["id"];

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function formatHours(value: number): string {
  return `${value.toLocaleString("fr-FR")} h`;
}

function tunisYmd(input?: Date | string | null): string {
  const date =
    typeof input === "string" ? new Date(input) : (input ?? new Date());
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Tunis" });
  }
  return date.toLocaleDateString("en-CA", { timeZone: "Africa/Tunis" });
}

function parseYmd(ymd: string): { year: number; month: number; day: number } {
  const [year, month, day] = ymd.split("-").map(Number);
  return { year, month: month - 1, day };
}

function ymdOf(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function clampYmd(ymd: string, min: string, max: string): string {
  if (ymd < min) return min;
  if (ymd > max) return max;
  return ymd;
}

type YearMonth = { year: number; month: number };

function ymKey(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month + 1).padStart(2, "0")}`;
}

function enumerateMonths(fromYmd: string, toYmd: string): YearMonth[] {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmd);
  const out: YearMonth[] = [];
  let year = from.year;
  let month = from.month;
  while (year < to.year || (year === to.year && month <= to.month)) {
    out.push({ year, month });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return out;
}

type OutageWindow = { start: string | null; end: string | null };

const EMPTY_OUTAGE_WINDOWS: OutageWindow[] = Array.from({ length: 12 }, () => ({
  start: null,
  end: null,
}));

function configuredHours(window: OutageWindow | undefined): number {
  if (!window?.start || !window?.end) return 0;
  const start = Number(window.start.slice(0, 2));
  const end = Number(window.end.slice(0, 2));
  return Math.max(0, end - start);
}

function dailyTotal(
  year: number,
  monthIndex: number,
  dayIndex: number,
  fromYmd: string,
  toYmd: string,
  windows: OutageWindow[],
): number {
  const ymd = ymdOf(year, monthIndex, dayIndex + 1);
  if (ymd < fromYmd || ymd > toYmd) return 0;
  return configuredHours(windows[monthIndex]);
}

function daysOfMonth(
  ym: YearMonth,
  fromYmd: string,
  toYmd: string,
  windows: OutageWindow[],
): { label: string; hours: number }[] {
  const last = daysInMonth(ym.year, ym.month);
  return Array.from({ length: last }, (_, i) => ({
    label: String(i + 1),
    hours: dailyTotal(ym.year, ym.month, i, fromYmd, toYmd, windows),
  }));
}

function hoursInMonth(
  ym: YearMonth,
  fromYmd: string,
  toYmd: string,
  windows: OutageWindow[],
): number {
  return daysOfMonth(ym, fromYmd, toYmd, windows).reduce(
    (sum, row) => sum + row.hours,
    0,
  );
}

type Props = {
  trackingSince?: string | null;
};

export function ClientPowerOutageHoursChart({ trackingSince }: Props) {
  const todayYmd = tunisYmd();
  const fromYmd = useMemo(() => {
    const tracked = trackingSince ? tunisYmd(trackingSince) : null;
    const yearStart = `${todayYmd.slice(0, 4)}-01-01`;
    if (tracked && tracked <= todayYmd) return tracked;
    return yearStart < todayYmd ? yearStart : todayYmd;
  }, [trackingSince, todayYmd]);

  const [period, setPeriod] = useState<Period>("day");
  const [cursor, setCursor] = useState(todayYmd);
  const [windows, setWindows] = useState<OutageWindow[]>(EMPTY_OUTAGE_WINDOWS);

  useEffect(() => {
    let cancelled = false;
    void consumptionApi
      .getPowerOutageHours()
      .then((data) => {
        const loaded = data.months ?? [];
        if (!cancelled) {
          setWindows(loaded.length === 12 ? loaded : EMPTY_OUTAGE_WINDOWS);
        }
      })
      .catch(() => {
        if (!cancelled) setWindows(EMPTY_OUTAGE_WINDOWS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const months = useMemo(
    () => enumerateMonths(fromYmd, todayYmd),
    [fromYmd, todayYmd],
  );
  const years = useMemo(
    () => [...new Set(months.map((m) => m.year))],
    [months],
  );

  const activeCursor = clampYmd(cursor, fromYmd, todayYmd);
  const { year: activeYear, month: activeMonth } = parseYmd(activeCursor);
  const activeYm: YearMonth = { year: activeYear, month: activeMonth };
  // Cheap derivations — left to the React Compiler to memoize.
  const dayRows = daysOfMonth(
    { year: activeYear, month: activeMonth },
    fromYmd,
    todayYmd,
    windows,
  );
  const monthRows = MONTH_SHORT.map((label, month) => ({
    label,
    hours: hoursInMonth(
      { year: activeYear, month },
      fromYmd,
      todayYmd,
      windows,
    ),
  }));
  const yearRows = years.map((year) => ({
    label: String(year),
    hours: MONTH_SHORT.reduce(
      (sum, _label, month) =>
        sum + hoursInMonth({ year, month }, fromYmd, todayYmd, windows),
      0,
    ),
  }));

  const chartRows =
    period === "day" ? dayRows : period === "month" ? monthRows : yearRows;

  const monthTotal = dayRows.reduce((sum, row) => sum + row.hours, 0);
  const daysWithData = dayRows.filter((row) => row.hours > 0).length || 1;
  const yearTotal = monthRows.reduce((sum, row) => sum + row.hours, 0);
  const monthsWithData = monthRows.filter((row) => row.hours > 0).length || 1;
  const rangeTotal = yearRows.reduce((sum, row) => sum + row.hours, 0);
  const yearCount = yearRows.length || 1;

  const stats =
    period === "day"
      ? [
          {
            label: "Heures / jour (moy.)",
            value: formatHours(Math.round(monthTotal / daysWithData)),
          },
          { label: "Total du mois", value: formatHours(monthTotal) },
        ]
      : period === "month"
        ? [
            { label: `Total ${activeYear}`, value: formatHours(yearTotal) },
            {
              label: "Moyenne / mois",
              value: formatHours(Math.round(yearTotal / monthsWithData)),
            },
          ]
        : [
            { label: "Total sur la période", value: formatHours(rangeTotal) },
            {
              label: "Moyenne / an",
              value: formatHours(Math.round(rangeTotal / yearCount)),
            },
          ];

  const tooltipCaption =
    period === "day"
      ? "Coupure / jour"
      : period === "month"
        ? "Coupure / mois"
        : "Coupure / an";

  return (
    <Card className="rounded-[22px] border-line bg-white p-4 shadow-joya-sm">
      <View>
        <AccentTitle size="lg">
          Historique des coupures d&apos;électricité
        </AccentTitle>
        <Text className="mt-0.5 text-[13px] text-ink-muted">
          h · moyenne par intervalle
        </Text>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityState={{ selected: period === p.id }}
            onPress={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5",
              period === p.id ? "bg-navy shadow-joya-xs" : "bg-transparent",
            )}
          >
            <Text
              className={cn(
                "text-xs font-semibold",
                period === p.id ? "text-white" : "text-slate-500",
              )}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-4 gap-3">
        {period === "day" ? (
          <View className="gap-1.5">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Mois
            </Text>
            <PillSelect
              label="Mois"
              className="h-10 self-start border-slate-200 px-4"
              value={ymKey(activeYm)}
              options={months.map((ym) => ({
                value: ymKey(ym),
                label: `${MONTH_LABELS[ym.month]} ${ym.year}`,
              }))}
              onChange={(value) => {
                const [year, month] = value.split("-").map(Number);
                setCursor(clampYmd(ymdOf(year, month - 1, 1), fromYmd, todayYmd));
              }}
            />
          </View>
        ) : null}

        {period === "month" ? (
          <View className="gap-1.5">
            <Text className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Année
            </Text>
            <PillSelect
              label="Année"
              className="h-10 self-start border-slate-200 px-4"
              value={String(activeYear)}
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
              onChange={(value) => {
                const year = Number(value);
                setCursor(clampYmd(`${year}-12-01`, fromYmd, todayYmd));
              }}
            />
          </View>
        ) : null}

        <View className="flex-row flex-wrap gap-2">
          {stats.map((stat, index) => (
            <StatBox
              key={stat.label}
              tone={index === 0 ? "accent" : "muted"}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </View>
      </View>

      <View className="relative mt-4 h-60 w-full">
        <JoyaBarChart
          key={`${period}-${chartRows.length}`}
          bars={chartRows.map((row) => ({
            label: row.label,
            value: row.hours,
          }))}
          color={CHART_COLOR}
          unit="h"
          ariaLabel="Historique des coupures d'électricité"
          showAverage={false}
          bestLabel=""
          barWidthRatio={period === "day" ? 0.6 : 0.5}
          renderTooltip={(i) => (
            <>
              <TooltipTitle>
                {period === "day"
                  ? `${chartRows[i]?.label} ${MONTH_LABELS[activeMonth]} ${activeYear}`
                  : chartRows[i]?.label}
              </TooltipTitle>
              <TooltipValue color={CHART_COLOR}>
                {`${formatHours(chartRows[i]?.hours ?? 0)} · ${tooltipCaption}`}
              </TooltipValue>
            </>
          )}
        />
      </View>
    </Card>
  );
}
