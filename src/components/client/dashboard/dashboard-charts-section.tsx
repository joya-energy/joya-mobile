import type {
  YearlyEnergySeries,
  YearlySavingsComparisonSeries,
} from "@/types/dashboard";
import { TotalPowerChartCard } from "./total-power-chart-card";
import { IrradiationChartCard } from "./irradiation-chart-card";
import { EnergyMonthlyChartCard } from "./savings-monthly-chart-card";
import { MonthlyDailyProductionChartCard } from "./monthly-daily-production-chart-card";
import { SavingsComparisonChartCard } from "./savings-comparison-chart-card";

type DashboardChartsSectionProps = {
  energyByYear: YearlyEnergySeries[];
  savingsComparisonByYear: YearlySavingsComparisonSeries[];
  companyId?: string;
  intradayEnabled?: boolean;
  onEnergyYearChange?: (year: number) => void;
  onSavingsYearChange?: (year: number) => void;
};

export function DashboardChartsSection({
  energyByYear,
  savingsComparisonByYear,
  companyId,
  intradayEnabled = true,
  onEnergyYearChange,
  onSavingsYearChange,
}: DashboardChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
      <TotalPowerChartCard companyId={companyId} enabled={intradayEnabled} />

      <IrradiationChartCard companyId={companyId} enabled={intradayEnabled} />

      <MonthlyDailyProductionChartCard
        companyId={companyId}
        enabled={intradayEnabled}
      />

      <EnergyMonthlyChartCard
        energyByYear={energyByYear}
        onYearChange={onEnergyYearChange}
      />

      <SavingsComparisonChartCard
        savingsComparisonByYear={savingsComparisonByYear}
        onYearChange={onSavingsYearChange}
      />
    </div>
  );
}
