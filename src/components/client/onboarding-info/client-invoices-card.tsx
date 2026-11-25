import { useState } from "react";
import { View } from "react-native";
import { FileText, Receipt } from "lucide-react-native";
import { JoyaEmptyState } from "@/components/joya";
import {
  invoicesApi,
  type ClientInvoiceItem,
} from "@/lib/company/invoices-api";
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

const getPeriod = (invoice: ClientInvoiceItem) => ({
  year: invoice.year,
  month: invoice.month,
});

const fetchInvoices = () => invoicesApi.list();
const NO_INVOICES: ClientInvoiceItem[] = [];

export function ClientInvoicesCard() {
  const { data: invoices, loading } = useCardData(
    fetchInvoices,
    NO_INVOICES,
    "Impossible de charger les factures.",
  );
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const filters = usePeriodFilters(invoices, getPeriod);

  const handleDownload = async (invoice: ClientInvoiceItem) => {
    setDownloadingKey(invoice.periodKey);
    try {
      const file = await invoicesApi.download(invoice.periodKey);
      await shareDownloadedFile(file);
    } catch {
      toast.error("Impossible de télécharger cette facture.");
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <InfoCardShell>
      <InfoCardHeader
        icon={Receipt}
        eyebrow="Rapports"
        title="Factures"
        description="Factures mensuelles — PDF téléchargeable"
      >
        {!loading && invoices.length > 0 ? (
          <PeriodFilters {...filters} />
        ) : null}
      </InfoCardHeader>

      {loading ? (
        <CardLoading label="Chargement des factures…" />
      ) : invoices.length === 0 ? (
        <JoyaEmptyState
          icon={FileText}
          title="Aucune facture disponible pour le moment"
          description="Vos factures apparaîtront ici dès que l'équipe JOYA les aura déposées."
        />
      ) : filters.filtered.length === 0 ? (
        <NoRowsForPeriod />
      ) : (
        <>
          <View>
            {filters.visible.map((invoice, index) => (
              <PeriodRow
                key={invoice.id}
                last={index === filters.visible.length - 1}
                title={capitalizePeriodLabel(invoice.periodLabel)}
                subtitle={formatLongDate(invoice.uploadedAt) ?? "—"}
                actions={
                  <DownloadButton
                    busy={downloadingKey === invoice.periodKey}
                    onPress={() => void handleDownload(invoice)}
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
