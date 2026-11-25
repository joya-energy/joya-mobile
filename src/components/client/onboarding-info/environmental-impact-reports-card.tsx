import { useState } from "react";
import { View } from "react-native";
import { FileText, Leaf } from "lucide-react-native";
import { JoyaEmptyState } from "@/components/joya";
import {
  environmentalImpactReportsApi,
  type EnvironmentalImpactReportItem,
} from "@/lib/company/environmental-impact-reports-api";
import { shareDownloadedFile } from "@/lib/files/download-api-file";
import { toast } from "@/lib/toast";
import {
  CardLoading,
  DownloadButton,
  InfoCardHeader,
  InfoCardShell,
  NoRowsForPeriod,
  PeriodFilters,
  PeriodRow,
  ShowMoreFooter,
} from "./info-card-kit";
import { useCardData } from "./use-card-data";
import {
  capitalizePeriodLabel,
  formatLongDate,
  usePeriodFilters,
} from "./use-period-filters";

const getPeriod = (report: EnvironmentalImpactReportItem) => ({
  year: report.year,
  month: report.month,
});

const fetchReports = () => environmentalImpactReportsApi.list();
const NO_REPORTS: EnvironmentalImpactReportItem[] = [];

export function EnvironmentalImpactReportsCard() {
  const { data: reports, loading } = useCardData(
    fetchReports,
    NO_REPORTS,
    "Impossible de charger les rapports d'impact.",
  );
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const filters = usePeriodFilters(reports, getPeriod);

  const handleDownload = async (report: EnvironmentalImpactReportItem) => {
    setDownloadingKey(report.periodKey);
    try {
      const file = await environmentalImpactReportsApi.download(
        report.periodKey,
      );
      await shareDownloadedFile(file);
    } catch {
      toast.error("Impossible de télécharger ce rapport.");
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <InfoCardShell>
      <InfoCardHeader
        icon={Leaf}
        eyebrow="Rapports"
        title="Rapport d'impact environnemental"
        description="Rapports mensuels précédents — PDF téléchargeable"
      >
        {!loading && reports.length > 0 ? (
          <PeriodFilters {...filters} />
        ) : null}
      </InfoCardHeader>

      {loading ? (
        <CardLoading label="Chargement des rapports…" />
      ) : reports.length === 0 ? (
        <JoyaEmptyState
          icon={FileText}
          title="Aucun rapport disponible pour le moment"
          description="Un rapport est publié pour chaque mois clos depuis la mise en service de l'installation."
        />
      ) : filters.filtered.length === 0 ? (
        <NoRowsForPeriod title="Aucun rapport pour cette période" />
      ) : (
        <>
          <View>
            {filters.visible.map((report, index) => (
              <PeriodRow
                key={report.id}
                last={index === filters.visible.length - 1}
                title={capitalizePeriodLabel(report.periodLabel)}
                subtitle={formatLongDate(report.generatedAt) ?? "—"}
                actions={
                  <DownloadButton
                    busy={downloadingKey === report.periodKey}
                    onPress={() => void handleDownload(report)}
                  />
                }
              />
            ))}
          </View>
          {filters.hasMore ? (
            <ShowMoreFooter
              expanded={filters.expanded}
              hiddenCount={filters.hiddenCount}
              onToggle={filters.toggleExpanded}
            />
          ) : null}
        </>
      )}
    </InfoCardShell>
  );
}
