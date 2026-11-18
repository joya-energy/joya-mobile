import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardKpi } from "@/types/dashboard";

type DashboardKpiCardProps = {
  kpi: DashboardKpi;
};

export function DashboardKpiCard({ kpi }: DashboardKpiCardProps) {
  const showFooter = Boolean(kpi.footnote?.trim());

  return (
    <Card className="flex h-full min-h-[8.5rem] flex-col border-line bg-white shadow-joya-sm sm:min-h-[9rem]">
      <CardHeader className="space-y-0 p-4 pb-0 sm:p-5 sm:pb-0">
        <CardDescription className="text-sm font-medium leading-snug text-slate-600 sm:text-base">
          {kpi.label}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-4 pt-4 sm:p-5 sm:pt-5">
        <CardTitle className="text-xl font-semibold leading-tight tabular-nums text-slate-900 sm:text-2xl lg:text-[1.75rem]">
          {kpi.displayValue}
        </CardTitle>
        {showFooter ? (
          <p className="mt-auto min-h-[2.25rem] pt-4 text-sm leading-snug text-slate-500 sm:pt-6 sm:text-base">
            {kpi.footnote}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
