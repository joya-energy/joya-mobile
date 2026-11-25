import { useCallback, useMemo, useState } from "react";

export const ALL_VALUE = "all";
export const INITIAL_VISIBLE = 3;

export const MONTH_LABELS_FR = [
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
] as const;

export function formatLongDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function capitalizePeriodLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

type Period = { year: number | null; month: number | null };

/**
 * Year / month filter + "voir plus" state shared by the invoices, STEG bills
 * and environmental report cards (same behaviour as the web cards).
 * `getPeriod` must be a stable (module level) function.
 */
export function usePeriodFilters<T>(
  items: T[],
  getPeriod: (item: T) => Period,
) {
  const [yearFilter, setYearFilterState] = useState<string>(ALL_VALUE);
  const [monthFilterRaw, setMonthFilterState] = useState<string>(ALL_VALUE);
  const [expanded, setExpanded] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const item of items) {
      const { year } = getPeriod(item);
      if (year != null) years.add(year);
    }
    return [...years].sort((a, b) => b - a);
  }, [items, getPeriod]);

  const availableMonths = useMemo(() => {
    const months = new Set<number>();
    for (const item of items) {
      const { year, month } = getPeriod(item);
      if (month == null) continue;
      if (yearFilter === ALL_VALUE || year === Number(yearFilter)) {
        months.add(month);
      }
    }
    return [...months].sort((a, b) => a - b);
  }, [items, getPeriod, yearFilter]);

  // Selected month falls back to "all" when it is no longer available.
  const monthFilter =
    monthFilterRaw !== ALL_VALUE &&
    !availableMonths.includes(Number(monthFilterRaw))
      ? ALL_VALUE
      : monthFilterRaw;

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const { year, month } = getPeriod(item);
        if (yearFilter !== ALL_VALUE && year !== Number(yearFilter)) {
          return false;
        }
        if (monthFilter !== ALL_VALUE && month !== Number(monthFilter)) {
          return false;
        }
        return true;
      }),
    [items, getPeriod, yearFilter, monthFilter],
  );

  const visible = expanded ? filtered : filtered.slice(0, INITIAL_VISIBLE);
  const hasMore = filtered.length > INITIAL_VISIBLE;

  const setYearFilter = useCallback((value: string) => {
    setYearFilterState(value);
    setExpanded(false);
  }, []);
  const setMonthFilter = useCallback((value: string) => {
    setMonthFilterState(value);
    setExpanded(false);
  }, []);
  const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

  return {
    yearFilter,
    monthFilter,
    setYearFilter,
    setMonthFilter,
    availableYears,
    availableMonths,
    filtered,
    visible,
    hasMore,
    hiddenCount: Math.max(0, filtered.length - INITIAL_VISIBLE),
    expanded,
    toggleExpanded,
  };
}
