import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FileText, MessageCircle, Trash2, Zap } from "lucide-react-native";
import { JoyaEmptyState } from "@/components/joya";
import {
  stegBillsApi,
  type StegBillItem,
} from "@/lib/company/steg-bills-api";
import { shareDownloadedFile } from "@/lib/files/download-api-file";
import type { UploadFileRef } from "@/lib/files/api";
import { toast } from "@/lib/toast";
import { joyaColors } from "@/theme/colors";
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
import { PillSelect } from "./pill-select";
import { StegBillUploadZone } from "./steg-bill-upload-zone";
import { useCardData } from "./use-card-data";
import {
  MONTH_LABELS_FR,
  capitalizePeriodLabel,
  formatLongDate,
  usePeriodFilters,
} from "./use-period-filters";

function previousMonthParts(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

const fetchStegBills = () => stegBillsApi.list();
const NO_BILLS: StegBillItem[] = [];

const getPeriod = (bill: StegBillItem) => ({
  year: bill.year,
  month: bill.month,
});

export function ClientStegBillsCard({ companyId }: { companyId: string }) {
  const initialPeriod = previousMonthParts();
  const {
    data: bills,
    loading,
    reload,
  } = useCardData(
    fetchStegBills,
    NO_BILLS,
    "Impossible de charger les factures STEG.",
  );
  const [uploadYear, setUploadYear] = useState(String(initialPeriod.year));
  const [uploadMonth, setUploadMonth] = useState(String(initialPeriod.month));
  const [attaching, setAttaching] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const attachedFileIds = useRef(new Set<string>());
  const filters = usePeriodFilters(bills, getPeriod);

  const uploadYearOptions = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => {
      const year = String(current - i);
      return { value: year, label: year };
    });
  }, []);

  const uploadMonthOptions = useMemo(
    () =>
      MONTH_LABELS_FR.map((label, index) => ({
        value: String(index + 1),
        label,
      })),
    [],
  );

  const attachUploadedFiles = async (refs: UploadFileRef[]) => {
    const ready = refs.filter(
      (ref) =>
        ref.fileId &&
        ref.status === "uploaded" &&
        !attachedFileIds.current.has(ref.fileId),
    );
    if (ready.length === 0 || attaching) return;
    setAttaching(true);
    try {
      for (const ref of ready) {
        if (!ref.fileId) continue;
        attachedFileIds.current.add(ref.fileId);
        await stegBillsApi.attach({
          year: Number(uploadYear),
          month: Number(uploadMonth),
          fileId: ref.fileId,
        });
      }
      toast.success("Facture STEG enregistrée.");
      reload();
    } catch {
      for (const ref of ready) {
        if (ref.fileId) attachedFileIds.current.delete(ref.fileId);
      }
      toast.error("Impossible d'enregistrer cette facture STEG.");
    } finally {
      setAttaching(false);
    }
  };

  const handleDownload = async (bill: StegBillItem) => {
    setBusyId(`dl-${bill.id}`);
    try {
      const file = await stegBillsApi.download(bill.id);
      await shareDownloadedFile(file);
    } catch {
      toast.error("Impossible de télécharger cette facture.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (bill: StegBillItem) => {
    setBusyId(`rm-${bill.id}`);
    try {
      await stegBillsApi.delete(bill.id);
      toast.success("Facture STEG supprimée.");
      reload();
    } catch {
      toast.error("Impossible de supprimer cette facture.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <InfoCardShell>
      <InfoCardHeader
        icon={Zap}
        eyebrow="Électricité"
        title="Factures STEG"
        description="Vos factures d'électricité STEG (PDF, photo ou WhatsApp) — distinctes des factures JOYA"
      >
        {!loading && bills.length > 0 ? <PeriodFilters {...filters} /> : null}
      </InfoCardHeader>

      <View className="gap-4 px-5 py-5">
        {companyId ? (
          <>
            <View className="flex-row flex-wrap items-end gap-3">
              <View className="gap-1.5">
                <Text className="text-xs font-medium text-ink-muted">Année</Text>
                <PillSelect
                  label="Année"
                  value={uploadYear}
                  onChange={setUploadYear}
                  options={uploadYearOptions}
                  className="w-[8.5rem]"
                />
              </View>
              <View className="gap-1.5">
                <Text className="text-xs font-medium text-ink-muted">Mois</Text>
                <PillSelect
                  label="Mois"
                  value={uploadMonth}
                  onChange={setUploadMonth}
                  options={uploadMonthOptions}
                  className="w-[10rem]"
                />
              </View>
              {attaching ? (
                <View className="h-9 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={joyaColors.coral} />
                  <Text className="text-sm text-ink-muted">Enregistrement…</Text>
                </View>
              ) : null}
            </View>
            <StegBillUploadZone
              label="PDF ou photo de facture STEG"
              companyId={companyId}
              maxFiles={10}
              disabled={attaching}
              onUploaded={attachUploadedFiles}
            />
          </>
        ) : null}

        <View className="flex-row items-start gap-1.5">
          <View className="mt-0.5">
            <MessageCircle size={14} color={joyaColors.coral} />
          </View>
          <Text className="flex-1 text-[12px] leading-snug text-ink-muted">
            Vous pouvez aussi envoyer la facture sur WhatsApp JOYA (mois
            précédent par défaut).
          </Text>
        </View>
      </View>

      {loading ? (
        <CardLoading label="Chargement des factures STEG…" />
      ) : bills.length === 0 ? (
        <JoyaEmptyState
          icon={FileText}
          title="Aucune facture STEG pour le moment"
          description="Choisissez le mois, déposez un PDF ou une photo, ou envoyez-la par WhatsApp."
        />
      ) : filters.filtered.length === 0 ? (
        <NoRowsForPeriod />
      ) : (
        <>
          <View className="border-t border-line">
            {filters.visible.map((bill, index) => {
              const isDownloading = busyId === `dl-${bill.id}`;
              const isDeleting = busyId === `rm-${bill.id}`;
              const periodText =
                capitalizePeriodLabel(bill.periodLabel || "") ||
                (bill.month
                  ? `${MONTH_LABELS_FR[bill.month - 1] ?? bill.month} ${bill.year ?? ""}`.trim()
                  : "") ||
                bill.filename ||
                "Facture STEG";
              return (
                <PeriodRow
                  key={bill.id || `steg-${index}`}
                  last={index === filters.visible.length - 1}
                  title={periodText}
                  subtitle={formatLongDate(bill.uploadedAt) ?? "—"}
                  actions={
                    <>
                      <DownloadButton
                        compact
                        busy={isDownloading}
                        disabled={isDeleting}
                        onPress={() => void handleDownload(bill)}
                      />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Supprimer la facture"
                        disabled={isDownloading || isDeleting}
                        onPress={() => void handleDelete(bill)}
                        className={
                          isDownloading || isDeleting
                            ? "h-9 w-9 items-center justify-center rounded-2xl opacity-50"
                            : "h-9 w-9 items-center justify-center rounded-2xl active:bg-danger-soft"
                        }
                      >
                        {isDeleting ? (
                          <ActivityIndicator
                            size="small"
                            color={joyaColors.danger}
                          />
                        ) : (
                          <Trash2 size={16} color={joyaColors.danger} />
                        )}
                      </Pressable>
                    </>
                  }
                />
              );
            })}
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
