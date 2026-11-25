import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  type LucideIcon,
} from "lucide-react-native";
import { JoyaEmptyState, JoyaEyebrow } from "@/components/joya";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";
import {
  ALL_VALUE,
  MONTH_LABELS_FR,
  usePeriodFilters,
} from "./use-period-filters";
import { PillSelect } from "./pill-select";

/** White rounded card shared by contracts / invoices / STEG / reports. */
export function InfoCardShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={cn(
        "overflow-hidden rounded-[24px] border border-line bg-white shadow-joya-sm",
        className,
      )}
    >
      {children}
    </View>
  );
}

export function InfoCardHeader({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  /** Filters row rendered under the title block. */
  children?: ReactNode;
}) {
  return (
    <View className="gap-4 border-b border-line px-5 py-5">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-cream-2">
          <Icon size={20} color={joyaColors.coral} />
        </View>
        <View className="min-w-0 flex-1">
          <JoyaEyebrow className="mb-0">{eyebrow}</JoyaEyebrow>
          <Text
            accessibilityRole="header"
            className="mt-1 font-display text-lg font-semibold tracking-tight text-navy"
          >
            {title}
          </Text>
          <Text className="mt-0.5 text-[13px] leading-snug text-ink-muted">
            {description}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export function CardLoading({ label }: { label: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      className="flex-row items-center justify-center gap-2 py-12"
    >
      <ActivityIndicator size="small" color={joyaColors.coral} />
      <Text className="text-sm text-ink-muted">{label}</Text>
    </View>
  );
}

/** Outlined "Télécharger" pill-button with spinner while busy. */
export function DownloadButton({
  onPress,
  busy,
  disabled,
  label = "Télécharger",
  compact = false,
}: {
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
  label?: string;
  /** Icon-only variant for rows that also host other actions. */
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
      onPress={onPress}
      className={cn(
        "h-9 shrink-0 flex-row items-center justify-center gap-1.5 rounded-2xl border border-line bg-white active:bg-cream",
        compact ? "w-9" : "px-3",
        (disabled || busy) && "opacity-50",
      )}
    >
      {busy ? (
        <ActivityIndicator size="small" color={joyaColors.navy} />
      ) : (
        <Download size={14} color={joyaColors.navy} />
      )}
      {compact ? null : (
        <Text className="text-[13px] font-semibold text-navy">{label}</Text>
      )}
    </Pressable>
  );
}

/** One row of the period lists (replaces the web `<tr>`). */
export function PeriodRow({
  title,
  subtitle,
  actions,
  last,
}: {
  title: string;
  subtitle?: string | null;
  actions: ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-3 px-5 py-3.5",
        !last && "border-b border-line",
      )}
    >
      <View className="h-8 w-8 items-center justify-center rounded-[10px] bg-coral-soft">
        <FileText size={16} color={joyaColors.coral} />
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-sm font-semibold text-navy">
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            className="mt-0.5 font-data text-[12px] text-ink-muted"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View className="shrink-0 flex-row items-center gap-1.5">{actions}</View>
    </View>
  );
}

/** "Voir plus (n)" / "Voir moins" footer. */
export function ShowMoreFooter({
  expanded,
  hiddenCount,
  onToggle,
}: {
  expanded: boolean;
  hiddenCount: number;
  onToggle: () => void;
}) {
  return (
    <View className="items-center border-t border-line py-3">
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        className="h-9 flex-row items-center gap-1.5 rounded-2xl px-3 active:bg-coral-soft"
      >
        <Text className="text-[13px] font-semibold text-coral-dark">
          {expanded ? "Voir moins" : `Voir plus (${hiddenCount})`}
        </Text>
        {expanded ? (
          <ChevronUp size={14} color={joyaColors.coralDark} />
        ) : (
          <ChevronDown size={14} color={joyaColors.coralDark} />
        )}
      </Pressable>
    </View>
  );
}

type PeriodFiltersState = Pick<
  ReturnType<typeof usePeriodFilters>,
  | "yearFilter"
  | "monthFilter"
  | "setYearFilter"
  | "setMonthFilter"
  | "availableYears"
  | "availableMonths"
>;

/** Année / Mois pill selects shown in card headers once rows exist. */
export function PeriodFilters({
  yearFilter,
  monthFilter,
  setYearFilter,
  setMonthFilter,
  availableYears,
  availableMonths,
}: PeriodFiltersState) {
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <PillSelect
        label="Filtrer par année"
        value={yearFilter}
        onChange={setYearFilter}
        className="min-w-[8.5rem]"
        options={[
          { value: ALL_VALUE, label: "Toutes années" },
          ...availableYears.map((year) => ({
            value: String(year),
            label: String(year),
          })),
        ]}
      />
      <PillSelect
        label="Filtrer par mois"
        value={monthFilter}
        onChange={setMonthFilter}
        className="min-w-[9rem]"
        options={[
          { value: ALL_VALUE, label: "Tous les mois" },
          ...availableMonths.map((month) => ({
            value: String(month),
            label: MONTH_LABELS_FR[month - 1] ?? String(month),
          })),
        ]}
      />
    </View>
  );
}

/** Empty state shown when filters hide every row. */
export function NoRowsForPeriod({
  title = "Aucune facture pour cette période",
}: {
  title?: string;
}) {
  return (
    <JoyaEmptyState
      compact
      icon={FileText}
      title={title}
      description="Modifiez le filtre année / mois."
    />
  );
}
