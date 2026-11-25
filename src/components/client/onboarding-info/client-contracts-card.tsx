import { Text, View } from "react-native";
import { FileText, ScrollText, Shield, type LucideIcon } from "lucide-react-native";
import { JoyaEmptyState } from "@/components/joya";
import {
  contractsApi,
  type ClientContractFile,
  type ClientContractsResponse,
} from "@/lib/company/contracts-api";
import { openExternalUrl } from "@/lib/files/open-external-url";
import { toast } from "@/lib/toast";
import { joyaColors } from "@/theme/colors";
import {
  CardLoading,
  DownloadButton,
  InfoCardHeader,
  InfoCardShell,
} from "./info-card-kit";
import { useCardData } from "./use-card-data";
import { formatLongDate } from "./use-period-filters";

const GROUPS: {
  key: "insurance" | "warranty" | "contract";
  title: string;
  icon: LucideIcon;
}[] = [
  { key: "insurance", title: "Assurance", icon: Shield },
  { key: "warranty", title: "Garanties", icon: ScrollText },
  { key: "contract", title: "Contrat", icon: FileText },
];

function FileRow({ file }: { file: ClientContractFile }) {
  const added = formatLongDate(file.createdAt);
  return (
    <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
      <View className="min-w-0 flex-1">
        <Text numberOfLines={2} className="text-sm font-semibold text-navy">
          {file.fileName}
        </Text>
        {added ? (
          <Text className="mt-0.5 text-xs text-ink-faint">Ajouté le {added}</Text>
        ) : null}
      </View>
      {file.viewUrl ? (
        <DownloadButton
          onPress={() => {
            void openExternalUrl(file.viewUrl as string).catch(() =>
              toast.error("Impossible d'ouvrir ce document."),
            );
          }}
        />
      ) : (
        <Text className="shrink-0 text-xs text-ink-faint">Lien indisponible</Text>
      )}
    </View>
  );
}

const fetchContracts = () => contractsApi.list();
const NO_CONTRACTS = null as ClientContractsResponse | null;

export function ClientContractsCard() {
  const { data, loading } = useCardData(
    fetchContracts,
    NO_CONTRACTS,
    "Impossible de charger vos contrats.",
  );

  const total = data
    ? data.insurance.length + data.warranty.length + data.contract.length
    : 0;

  return (
    <InfoCardShell>
      <InfoCardHeader
        icon={FileText}
        eyebrow="Documents"
        title="Mes contrats"
        description="Assurance, garanties et contrat déposés par JOYA"
      />

      {loading ? (
        <CardLoading label="Chargement des contrats…" />
      ) : !data || total === 0 ? (
        <JoyaEmptyState
          icon={FileText}
          title="Aucun document pour le moment"
          description="Vos contrats, assurances et garanties apparaîtront ici dès que l'équipe JOYA les aura déposés."
        />
      ) : (
        <View className="gap-5 px-5 py-5">
          {GROUPS.map((group) => {
            const files = data[group.key];
            const Icon = group.icon;
            return (
              <View key={group.key}>
                <View className="mb-2.5 flex-row items-center gap-2">
                  <Icon size={16} color={joyaColors.coral} />
                  <Text className="text-sm font-semibold text-navy">
                    {group.title}
                  </Text>
                </View>
                {files.length === 0 ? (
                  <View className="rounded-xl border border-dashed border-line bg-cream px-4 py-4">
                    <Text className="text-center text-[13px] text-ink-muted">
                      Aucun fichier
                    </Text>
                  </View>
                ) : (
                  <View className="gap-2">
                    {files.map((file) => (
                      <FileRow
                        key={file.fileId || file.fileName}
                        file={file}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </InfoCardShell>
  );
}
