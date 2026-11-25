import { Text, View } from "react-native";

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
    <View className="rounded-[18px] bg-coral-wash px-4 py-3.5">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="flex-1 text-[13px] font-medium text-navy">
          Performance du mois dernier
        </Text>
        <Text
          className={
            hasValue
              ? "font-display text-[1.35rem] font-bold tabular-nums leading-none text-coral"
              : "font-display text-[1.35rem] font-bold tabular-nums leading-none text-ink-faint"
          }
        >
          {display}
        </Text>
      </View>
      <View className="relative mt-3 h-2 justify-center rounded-full bg-coral/15">
        <View
          className="h-full rounded-full bg-coral"
          style={{ width: `${barPercent}%` }}
        />
        {hasValue ? (
          <View
            pointerEvents="none"
            className="absolute h-3.5 w-0.5 rounded-full bg-navy-dark"
            style={{ left: `${tickPercent}%`, top: -3, marginLeft: -1 }}
          />
        ) : null}
      </View>
      <View className="mt-2 flex-row items-center justify-between gap-2">
        <Text className="text-[12px] text-ink-muted">Objectif : 100 %</Text>
        {deltaLabel ? (
          <Text
            className={
              above
                ? "text-[12px] font-semibold text-coral"
                : "text-[12px] font-semibold text-ink-muted"
            }
          >
            {deltaLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
