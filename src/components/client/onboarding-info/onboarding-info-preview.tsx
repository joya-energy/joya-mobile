import { createContext, useContext, type ReactNode } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import {
  Building2,
  Check,
  ExternalLink,
  FileText,
  Home,
  UserCircle,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { JoyaPageHeader } from "@/components/joya";
import type { UploadFileRef } from "@/lib/files/api";
import { openExternalUrl } from "@/lib/files/open-external-url";
import { onboardingLabels } from "@/lib/onboarding/display-labels";
import type { OnboardingSummary } from "@/lib/onboarding/fetch-onboarding-summary";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

const SECTION_STEPS = [1, 2, 3, 4, 5] as const;

/** Same breakpoint as the web `xs:` grid (2 columns from 420px). */
const TWO_COLUMN_MIN_WIDTH = 420;

const FieldColumnsContext = createContext<1 | 2>(1);

/** Affichage : API + documents déposés (flux onboarding documents). */
function inferDisplayCompletion(
  summary: OnboardingSummary,
): Record<number, boolean> {
  const { completion, company, manager, files, site, finance } = summary;
  return {
    1:
      !!completion[1] ||
      (files.tradeRegister.length > 0 && files.rne.length > 0) ||
      (!!company.legal_name?.trim() &&
        !!company.gouvernorat?.trim() &&
        !!company.sector?.trim()),
    2:
      !!completion[2] ||
      files.cin.length > 0 ||
      (!!manager.full_name?.trim() &&
        (!!manager.email?.trim() || !!manager.phone_number?.trim())),
    3: !!completion[3] || files.bills.length > 0,
    4:
      !!completion[4] ||
      files.roofImages.length > 0 ||
      !!site.site_status?.trim(),
    5:
      !!completion[5] ||
      files.bankStatements.length > 0 ||
      files.rib.length > 0 ||
      files.taxDeclaration.length > 0 ||
      files.balanceSheets.length > 0 ||
      !!finance.annual_revenue?.trim(),
  };
}

function FieldGrid({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const columns: 1 | 2 = width >= TWO_COLUMN_MIN_WIDTH ? 2 : 1;
  return (
    <FieldColumnsContext.Provider value={columns}>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </FieldColumnsContext.Provider>
  );
}

function Field({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string | number | null | undefined;
  /** Span every column (web `xs:col-span-2`). */
  full?: boolean;
}) {
  const columns = useContext(FieldColumnsContext);
  const empty = value == null || value === "" || value === "—";
  return (
    <View
      className="min-w-0 rounded-[16px] bg-cream-2/90 px-3.5 py-3"
      style={{ width: full || columns === 1 ? "100%" : "48.5%" }}
    >
      <Text className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </Text>
      <Text
        numberOfLines={2}
        className={cn(
          "mt-1 text-[13.5px] leading-snug",
          empty ? "font-medium text-ink-faint" : "font-semibold text-navy",
        )}
      >
        {empty ? "Non renseigné" : String(value)}
      </Text>
    </View>
  );
}

function DocGroupLabel({
  children,
  count,
}: {
  children: string;
  count?: number;
}) {
  return (
    <View className="mb-2 flex-row items-center gap-1.5">
      <Text className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
        {children}
      </Text>
      {count != null && count > 0 ? (
        <View className="h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1">
          <Text className="text-[10px] font-bold tabular-nums text-white">
            {count}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function DocumentChip({ file }: { file: UploadFileRef }) {
  const label = (
    <Text
      numberOfLines={1}
      className={cn(
        "shrink text-[12px]",
        file.viewUrl ? "font-medium text-navy" : "text-ink-muted",
      )}
    >
      {file.fileName}
    </Text>
  );

  if (!file.viewUrl) {
    return (
      <View className="max-w-[220px] flex-row items-center gap-1.5 rounded-full bg-coral-wash py-1.5 pl-2 pr-2.5">
        <FileText size={14} color={joyaColors.coral} />
        {label}
      </View>
    );
  }

  const url = file.viewUrl;
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${file.fileName} (ouvre le document)`}
      onPress={() => {
        void openExternalUrl(url).catch(() =>
          toast.error("Impossible d'ouvrir ce document."),
        );
      }}
      className="max-w-[220px] flex-row items-center gap-1.5 rounded-full bg-coral-wash py-1.5 pl-2 pr-2.5 active:bg-coral-soft"
    >
      <FileText size={14} color={joyaColors.coral} />
      {label}
      <ExternalLink size={12} color={joyaColors.coral} style={{ opacity: 0.7 }} />
    </Pressable>
  );
}

function DocumentLinks({
  files,
  emptyLabel = "Aucun fichier",
}: {
  files: UploadFileRef[];
  emptyLabel?: string;
}) {
  if (!files.length) {
    return <Text className="text-[12.5px] text-ink-faint">{emptyLabel}</Text>;
  }
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {files.map((f) => (
        <DocumentChip key={f.fileId} file={f} />
      ))}
    </View>
  );
}

function CompletionBadge({ completed }: { completed?: boolean }) {
  if (completed) {
    return (
      <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-navy px-2.5 py-1">
        <Check size={14} color="#fff" strokeWidth={2.5} />
        <Text className="text-[11.5px] font-semibold text-white">Complet</Text>
      </View>
    );
  }
  return (
    <View className="shrink-0 flex-row items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1">
      <Text className="text-[11.5px] font-semibold text-warning">En cours</Text>
    </View>
  );
}

function SectionCard({
  title,
  icon: Icon,
  completed,
  children,
}: {
  title: string;
  icon: LucideIcon;
  completed?: boolean;
  children: ReactNode;
}) {
  return (
    <View className="rounded-[24px] border border-line bg-white p-5 shadow-joya-sm">
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-[14px] bg-coral-soft">
            <Icon size={20} color={joyaColors.coral} />
          </View>
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-display text-base font-semibold text-navy"
          >
            {title}
          </Text>
        </View>
        <CompletionBadge completed={completed} />
      </View>
      <View>{children}</View>
    </View>
  );
}

type OnboardingInfoPreviewProps = {
  summary: OnboardingSummary;
};

export function OnboardingInfoPreview({ summary }: OnboardingInfoPreviewProps) {
  const { company, manager, files, energy, site, finance } = summary;
  const displayCompletion = inferDisplayCompletion(summary);
  const completedCount = SECTION_STEPS.filter(
    (step) => displayCompletion[step],
  ).length;

  const financeDocGroups = [
    { label: "RIB", files: files.rib },
    { label: "Déclaration fiscale", files: files.taxDeclaration },
    { label: "Bilan", files: files.balanceSheets },
    { label: "Relevés bancaires", files: files.bankStatements },
  ];

  return (
    <View className="gap-6">
      <JoyaPageHeader
        className="px-1"
        eyebrow="Mon dossier"
        title="Mes informations"
        description="Récapitulatif de votre dossier d'intégration : entreprise, installation, données énergétiques et documents (lecture seule)."
        meta={
          <View className="mt-1 flex-row flex-wrap items-center gap-2">
            <View className="h-8 justify-center rounded-full bg-coral-soft px-3">
              <Text className="font-data text-[12.5px] font-medium text-coral-dark">
                {completedCount}/{SECTION_STEPS.length} sections complètes
              </Text>
            </View>
            <View className="h-8 flex-row items-center gap-2 rounded-full border border-line bg-white px-3">
              <Text className="text-[12.5px] font-medium text-navy">
                Documents
              </Text>
              {SECTION_STEPS.map((step) => (
                <View
                  key={step}
                  accessibilityLabel={
                    displayCompletion[step]
                      ? "Section complète"
                      : "Section en cours"
                  }
                  className={cn(
                    "h-5 w-5 items-center justify-center rounded-full",
                    displayCompletion[step] ? "bg-coral" : "bg-slate-100",
                  )}
                >
                  <Check
                    size={12}
                    strokeWidth={2.75}
                    color={
                      displayCompletion[step] ? "#fff" : joyaColors.blueLight
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        }
      />

      <View className="gap-4">
        <SectionCard
          title="Entreprise"
          icon={Building2}
          completed={displayCompletion[1]}
        >
          <FieldGrid>
            <Field label="Raison sociale" value={company.legal_name} />
            <Field label="Matricule fiscal" value={company.tax_id} />
            <Field label="Gouvernorat" value={company.gouvernorat} />
            <Field label="Secteur" value={company.sector} />
            <Field
              full
              label="Adresse d'installation"
              value={company.installation_address}
            />
          </FieldGrid>
          <View className="mt-4">
            <DocGroupLabel>Documents</DocGroupLabel>
            <DocumentLinks
              files={[...files.tradeRegister, ...files.rne]}
              emptyLabel="Aucun document entreprise"
            />
          </View>
        </SectionCard>

        <SectionCard
          title="Gérant"
          icon={UserCircle}
          completed={displayCompletion[2]}
        >
          <FieldGrid>
            <Field label="Nom complet" value={manager.full_name} />
            <Field label="CIN" value={manager.cin_number} />
            <Field label="E-mail" value={manager.email} />
            <Field label="Téléphone" value={manager.phone_number} />
            <Field label="Adresse" value={manager.address} />
            <Field label="Part (%)" value={manager.ownership_pct} />
          </FieldGrid>
          <View className="mt-4">
            <DocGroupLabel>CIN</DocGroupLabel>
            <DocumentLinks files={files.cin} />
          </View>
        </SectionCard>

        <SectionCard
          title="Données énergétiques"
          icon={Zap}
          completed={displayCompletion[3]}
        >
          <FieldGrid>
            <Field
              label="Puissance souscrite"
              value={
                energy.power != null && energy.power !== ""
                  ? `${energy.power} kVA`
                  : "—"
              }
            />
          </FieldGrid>
          <View className="mt-4">
            <DocGroupLabel count={files.bills.length}>
              Factures STEG
            </DocGroupLabel>
            <DocumentLinks files={files.bills} emptyLabel="Aucune facture" />
          </View>
        </SectionCard>

        <SectionCard
          title="Site & toiture"
          icon={Home}
          completed={displayCompletion[4]}
        >
          <FieldGrid>
            <Field
              label="Statut du site"
              value={onboardingLabels.siteStatus(site.site_status)}
            />
            <Field
              label="Type de site"
              value={onboardingLabels.siteType(site.site_type)}
            />
            <Field
              label="Toiture exploitable"
              value={onboardingLabels.yesNo(site.roof_exploitable)}
            />
            <Field
              label="Surface toiture"
              value={onboardingLabels.roofSurface(site.roof_surface)}
            />
          </FieldGrid>
          <View className="mt-4 gap-3">
            <View>
              <DocGroupLabel count={files.roofImages.length}>
                Photos toiture
              </DocGroupLabel>
              <DocumentLinks files={files.roofImages} />
            </View>
            <View>
              <DocGroupLabel>Technique & propriété</DocGroupLabel>
              <DocumentLinks
                files={[
                  ...files.roofOwnership,
                  ...files.electricalPanel,
                  ...files.meter,
                ]}
                emptyLabel="Aucun document site"
              />
            </View>
          </View>
        </SectionCard>

        <SectionCard
          title="Situation financière"
          icon={Wallet}
          completed={displayCompletion[5]}
        >
          <FieldGrid>
            <Field
              label="Chiffre d'affaires"
              value={onboardingLabels.annualRevenue(finance.annual_revenue)}
            />
            <Field
              label="Paiements STEG"
              value={onboardingLabels.stegPayment(finance.steg_payment_history)}
            />
            <Field
              label="Ancienneté"
              value={onboardingLabels.companySeniority(
                finance.company_seniority,
              )}
            />
            <Field
              label="Crédit en cours"
              value={onboardingLabels.bool(finance.current_credit)}
            />
            {finance.current_credit ? (
              <Field
                label="Mensualité crédit"
                value={
                  finance.total_monthly_payment != null
                    ? `${finance.total_monthly_payment} TND`
                    : "—"
                }
              />
            ) : null}
          </FieldGrid>
          <View className="mt-4 gap-3">
            {financeDocGroups.map((group) => (
              <View key={group.label}>
                <DocGroupLabel>{group.label}</DocGroupLabel>
                <DocumentLinks files={group.files} />
              </View>
            ))}
          </View>
        </SectionCard>
      </View>
    </View>
  );
}
