import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useOptionalDeviceScope } from "@/contexts/device-scope-context";
import { clientDashboardApi } from "@/lib/dashboard/api";
import { consumptionApi } from "@/lib/consumption/api";
import type { YearlyEnergySeries } from "@/types/dashboard";
import { JOYA_CHART } from "@/components/joya/chart-theme";
import { JoyaGroupedBarChart, TooltipTitle, formatValue } from "./chart-kit";

type Period = "week" | "month" | "year";

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
  { value: "year", label: "Cette année" },
];

const CONSUMED = JOYA_CHART.coral;
const PRODUCED = JOYA_CHART.navy;
const TZ = "Africa/Tunis";

function ymd(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

type Bucket = { key: string; label: string; title: string; consumed: number; produced: number };

function weekBuckets(): Bucket[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() - (6 - i) * 86_400_000);
    const day = d.toLocaleDateString("fr-FR", { weekday: "short", timeZone: TZ }).replace(".", "");
    return {
      key: ymd(d),
      label: day.charAt(0).toUpperCase() + day.slice(1),
      title: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }),
      consumed: 0,
      produced: 0,
    };
  });
}

function monthBuckets(): Bucket[] {
  const today = new Date();
  const days = today.getDate();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
    return {
      key: ymd(d),
      label: String(i + 1),
      title: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
      consumed: 0,
      produced: 0,
    };
  });
}

function yearBuckets(): Bucket[] {
  const today = new Date();
  return Array.from({ length: today.getMonth() + 1 }, (_, m) => {
    const d = new Date(today.getFullYear(), m, 1);
    const short = d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
    return {
      key: `${today.getFullYear()}-${String(m + 1).padStart(2, "0")}`,
      label: short.charAt(0).toUpperCase() + short.slice(1),
      title: d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      consumed: 0,
      produced: 0,
    };
  });
}

type EnergyOverviewCardProps = {
  energyByYear: YearlyEnergySeries[];
  companyId?: string;
};

/**
 * "Aperçu énergétique" — consumed vs produced energy, grouped pill bars
 * (reference design). Uses existing endpoints only:
 * monthly-daily production + JOYA Edge consumption history.
 */
export function EnergyOverviewCard({ energyByYear, companyId }: EnergyOverviewCardProps) {
  const scope = useOptionalDeviceScope();
  const siteId = scope?.siteId ?? undefined;
  const assetId = scope?.assetId ?? undefined;
  const ready = scope ? scope.isReady : true;
  const [period, setPeriod] = useState<Period>("week");
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const base = period === "week" ? weekBuckets() : period === "month" ? monthBuckets() : yearBuckets();
      const byKey = new Map(base.map((b) => [b.key, b]));
      const now = new Date();

      // Production
      try {
        if (period === "year") {
          const series = energyByYear.find((s) => s.year === now.getFullYear());
          series?.months.forEach((m, i) => {
            const b = base[i];
            if (b) b.produced = Math.max(0, m.valueKw);
          });
        } else {
          const months = new Set(base.map((b) => b.key.slice(0, 7)));
          for (const ym of months) {
            const [year, month] = ym.split("-").map(Number);
            const data = await clientDashboardApi.fetchMonthlyDailyProduction({ companyId, year, month, siteId, assetId });
            data.series.forEach((p) => {
              const b = byKey.get(p.date);
              if (b) b.produced = Math.max(0, p.productionKwh);
            });
          }
        }
      } catch {
        /* production unavailable: bars stay at 0 */
      }

      // Consumption (JOYA Edge meter)
      try {
        const devices = await consumptionApi.listDevices({ siteId });
        const deviceId = devices[0]?.device_id;
        if (deviceId) {
          const history = await consumptionApi.getHistory(deviceId, {
            from: period === "year" ? `${now.getFullYear()}-01-01` : base[0].key,
            to: ymd(now),
            grain: period === "year" ? "month" : "day",
          });
          history.points.forEach((p) => {
            const key = period === "year" ? (p.t ?? p.key).slice(0, 7) : (p.t ?? p.key).slice(0, 10);
            const b = byKey.get(key);
            if (b && p.kwh != null) b.consumed = Math.max(0, p.kwh);
          });
        }
      } catch {
        /* no meter: consumption bars stay at 0 */
      }

      if (!cancelled) {
        setBuckets(base);
        setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [assetId, companyId, energyByYear, period, ready, siteId]);

  const totals = useMemo(() => {
    const consumed = buckets.reduce((s, b) => s + b.consumed, 0);
    const produced = buckets.reduce((s, b) => s + b.produced, 0);
    return { consumed, produced, coverage: consumed > 0 ? Math.min(100, (produced / consumed) * 100) : null };
  }, [buckets]);

  return (
    <View className="min-w-0 flex-col rounded-2xl border border-line bg-white p-5">
      <View className="gap-3">
        <View className="min-w-0">
          <Text className="font-display text-[22px] font-bold tracking-[-0.5px] text-navy-dark">
            Aperçu énergétique
          </Text>
          <View className="mt-2.5 flex-row flex-wrap items-center gap-x-5 gap-y-1.5">
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CONSUMED }} />
              <Text className="text-[13.5px] text-ink-muted">Énergie consommée (kWh)</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRODUCED }} />
              <Text className="text-[13.5px] text-ink-muted">Énergie solaire produite (kWh)</Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2" accessibilityRole="tablist" accessibilityLabel="Période">
          {PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <Pressable
                key={p.value}
                onPress={() => setPeriod(p.value)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                hitSlop={4}
                className={
                  active
                    ? "h-9 items-center justify-center rounded-full border border-navy bg-navy px-4"
                    : "h-9 items-center justify-center rounded-full border border-line bg-white px-4 active:bg-slate-100"
                }
              >
                <Text className={active ? "text-[13.5px] font-semibold text-white" : "text-[13.5px] font-medium text-navy"}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="relative mt-4 h-64">
        {loading ? (
          <View className="absolute inset-0 flex-row items-center justify-center gap-2">
            <ActivityIndicator size="small" color={JOYA_CHART.coral} />
            <Text className="text-sm text-ink-muted">Chargement…</Text>
          </View>
        ) : (
          <JoyaGroupedBarChart
            key={period}
            labels={buckets.map((b) => b.label)}
            unit="kWh"
            ariaLabel="Énergie consommée et énergie solaire produite par période"
            series={[
              { key: "consumed", label: "Énergie consommée", color: CONSUMED, values: buckets.map((b) => b.consumed) },
              { key: "produced", label: "Énergie solaire produite", color: PRODUCED, values: buckets.map((b) => b.produced) },
            ]}
            renderTooltip={(i) => {
              const b = buckets[i];
              if (!b) return null;
              const cover = b.consumed > 0 ? Math.min(100, (b.produced / b.consumed) * 100) : null;
              return (
                <View className="min-w-[208px]">
                  <TooltipTitle>{b.title}</TooltipTitle>
                  <View className="mt-2 gap-1.5">
                    <View className="flex-row items-center gap-2">
                      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CONSUMED }} />
                      <Text className="flex-1 text-sm text-ink-muted">Consommée</Text>
                      <Text className="font-display text-sm font-bold text-navy" style={{ fontVariant: ["tabular-nums"] }}>
                        {formatValue(b.consumed, "kWh", 0)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRODUCED }} />
                      <Text className="flex-1 text-sm text-ink-muted">Produite</Text>
                      <Text className="font-display text-sm font-bold text-navy" style={{ fontVariant: ["tabular-nums"] }}>
                        {formatValue(b.produced, "kWh", 0)}
                      </Text>
                    </View>
                  </View>
                  {cover != null ? (
                    <View className="mt-2 border-t border-line pt-2">
                      <Text className="text-[12.5px] font-semibold text-success-strong">
                        {cover.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} % couvert par le solaire
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </View>

      {!loading && totals.coverage != null ? (
        <View className="mt-3 border-t border-line pt-3">
          <Text className="text-[13px] leading-5 text-ink-muted">
            Sur la période, le solaire a couvert{" "}
            <Text className="font-display font-bold text-navy">
              {totals.coverage.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %
            </Text>{" "}
            de votre consommation ({formatValue(totals.produced, "kWh", 0)} produits pour{" "}
            {formatValue(totals.consumed, "kWh", 0)} consommés).
          </Text>
        </View>
      ) : null}
    </View>
  );
}
