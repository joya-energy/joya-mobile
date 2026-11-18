"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { JOYA_CHART, JOYA_RECHARTS } from "@/components/joya/chart-theme";
import { StatBox } from "@/components/client/consumption/edge-consumption-charts";

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

function dailyTotal(
  year: number,
  monthIndex: number,
  dayIndex: number,
  fromYmd: string,
  toYmd: string,
): number {
  const ymd = ymdOf(year, monthIndex, dayIndex + 1);
  if (ymd < fromYmd || ymd > toYmd) return 0;
  return 0;
}

function daysOfMonth(
  ym: YearMonth,
  fromYmd: string,
  toYmd: string,
): { label: string; hours: number }[] {
  const last = daysInMonth(ym.year, ym.month);
  return Array.from({ length: last }, (_, i) => ({
    label: String(i + 1),
    hours: dailyTotal(ym.year, ym.month, i, fromYmd, toYmd),
  }));
}

function hoursInMonth(
  ym: YearMonth,
  fromYmd: string,
  toYmd: string,
): number {
  return daysOfMonth(ym, fromYmd, toYmd).reduce((sum, row) => sum + row.hours, 0);
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

  const months = useMemo(
    () => enumerateMonths(fromYmd, todayYmd),
    [fromYmd, todayYmd],
  );
  const years = useMemo(
    () => [...new Set(months.map((m) => m.year))],
    [months],
  );

  const activeCursor = clampYmd(cursor, fromYmd, todayYmd);
  const active = parseYmd(activeCursor);
  const activeYm: YearMonth = { year: active.year, month: active.month };
  const dayRows = useMemo(
    () =>
      daysOfMonth(
        { year: active.year, month: active.month },
        fromYmd,
        todayYmd,
      ),
    [active.month, active.year, fromYmd, todayYmd],
  );
  const monthRows = useMemo(
    () =>
      MONTH_SHORT.map((label, month) => ({
        label,
        hours: hoursInMonth({ year: active.year, month }, fromYmd, todayYmd),
      })),
    [active.year, fromYmd, todayYmd],
  );
  const yearRows = useMemo(
    () =>
      years.map((year) => ({
        label: String(year),
        hours: MONTH_SHORT.reduce(
          (sum, _label, month) =>
            sum + hoursInMonth({ year, month }, fromYmd, todayYmd),
          0,
        ),
      })),
    [fromYmd, todayYmd, years],
  );

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
            { label: `Total ${active.year}`, value: formatHours(yearTotal) },
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

  const yDomain: [number, number | "auto"] =
    period === "day" ? [0, 24] : [0, "auto"];

  return (
    <section className="rounded-[22px] border border-line bg-white p-4 shadow-joya-sm sm:p-5">
      <div>
        <h2 className="flex items-center gap-2 font-display text-[1.15rem] font-bold tracking-tight text-navy">
          <span className="h-4 w-[3px] rounded-full bg-coral" aria-hidden />
          Historique des coupures d&apos;électricité
        </h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">
          h · moyenne par intervalle
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
              period === p.id
                ? "bg-navy text-white shadow-joya-xs"
                : "bg-transparent text-slate-500 hover:bg-cream hover:text-navy",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        {period === "day" ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Mois
            </span>
            <Select
              value={ymKey(activeYm)}
              onValueChange={(value) => {
                const [year, month] = value.split("-").map(Number);
                setCursor(clampYmd(ymdOf(year, month - 1, 1), fromYmd, todayYmd));
              }}
            >
              <SelectTrigger className="h-10 w-[200px] rounded-full border-slate-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((ym) => (
                  <SelectItem key={ymKey(ym)} value={ymKey(ym)}>
                    {MONTH_LABELS[ym.month]} {ym.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {period === "month" ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Année
            </span>
            <Select
              value={String(active.year)}
              onValueChange={(value) => {
                const year = Number(value);
                setCursor(clampYmd(`${year}-12-01`, fromYmd, todayYmd));
              }}
            >
              <SelectTrigger className="h-10 w-[140px] rounded-full border-slate-200 px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {stats.map((stat, index) => (
          <StatBox
            key={stat.label}
            tone={index === 0 ? "accent" : "muted"}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </div>

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartRows}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap={period === "day" ? "28%" : "32%"}
          >
            <CartesianGrid {...JOYA_RECHARTS.grid} />
            <XAxis
              dataKey="label"
              tick={JOYA_RECHARTS.tick}
              axisLine={JOYA_RECHARTS.axisLine}
              tickLine={false}
              interval={period === "day" ? 1 : 0}
            />
            <YAxis
              tick={JOYA_RECHARTS.tick}
              width={40}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              domain={yDomain}
            />
            <Tooltip
              contentStyle={JOYA_RECHARTS.tooltip}
              formatter={(value: number) => [
                formatHours(value),
                period === "day"
                  ? "Coupure / jour"
                  : period === "month"
                    ? "Coupure / mois"
                    : "Coupure / an",
              ]}
            />
            <Bar
              dataKey="hours"
              name="Heures"
              fill={CHART_COLOR}
              radius={[8, 8, 8, 8]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
