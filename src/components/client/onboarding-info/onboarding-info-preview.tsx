"use client";

import type { ReactNode } from "react";
import {
  Building2,
  Check,
  ExternalLink,
  FileText,
  Home,
  UserCircle,
  Wallet,
  Zap,
} from "lucide-react";
import type { UploadFileRef } from "@/lib/files/api";
import { onboardingLabels } from "@/lib/onboarding/display-labels";
import type { OnboardingSummary } from "@/lib/onboarding/fetch-onboarding-summary";
import { cn } from "@/lib/utils";
import { JoyaPageHeader } from "@/components/joya";

const SECTION_STEPS = [1, 2, 3, 4, 5] as const;

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

function Field({ label, value }: { label: string; value: ReactNode }) {
  const empty = value == null || value === "" || value === "—";
  return (
    <div className="min-w-0 rounded-[16px] bg-cream-2/90 px-3.5 py-3">
      <dt className="font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-[13.5px] leading-snug",
          empty ? "font-medium text-ink-faint" : "font-semibold text-navy",
        )}
        title={typeof value === "string" ? value : undefined}
      >
        {empty ? "Non renseigné" : value}
      </dd>
    </div>
  );
}

function DocGroupLabel({
  children,
  count,
}: {
  children: ReactNode;
  count?: number;
}) {
  return (
    <p className="mb-2 inline-flex items-center gap-1.5 font-data text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
      {children}
      {count != null && count > 0 ? (
        <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold tabular-nums text-white">
          {count}
        </span>
      ) : null}
    </p>
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
    return <p className="text-[12.5px] text-ink-faint">{emptyLabel}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {files.map((f) => (
        <li key={f.fileId} className="max-w-full">
          {f.viewUrl ? (
            <a
              href={f.viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group/doc inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-coral-wash py-1.5 pl-2 pr-2.5 text-[12px] font-medium text-navy transition-colors hover:bg-coral-soft hover:text-coral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
              <span className="truncate">{f.fileName}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-coral/70 opacity-70 group-hover/doc:opacity-100" aria-hidden />
              <span className="sr-only">(ouvre un nouvel onglet)</span>
            </a>
          ) : (
            <span className="inline-flex max-w-[220px] items-center gap-1.5 rounded-full bg-coral-wash py-1.5 pl-2 pr-2.5 text-[12px] text-ink-muted">
              <FileText className="h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
              <span className="truncate">{f.fileName}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function CompletionBadge({ completed }: { completed?: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[11.5px] font-semibold text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
        Complet
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2.5 py-1 text-[11.5px] font-semibold text-warning">
      En cours
    </span>
  );
}

function SectionCard({
  title,
  icon: Icon,
  completed,
  children,
  className,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  completed?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex h-full flex-col rounded-[24px] border border-line bg-white p-5 shadow-joya-sm sm:p-6",
        className,
      )}
    >
      <div className="mb-4 flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-coral-soft text-coral">
            <Icon className="h-5 w-5" />
          </span>
          <h2 className="truncate font-display text-base font-semibold text-navy">
            {title}
          </h2>
        </div>
        <CompletionBadge completed={completed} />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

type OnboardingInfoPreviewProps = {
  summary: OnboardingSummary;
  variant?: "default" | "verification";
  /** Hide the page title when embedded inside OnboardingFormCard. */
  embedded?: boolean;
};

export function OnboardingInfoPreview({ summary }: OnboardingInfoPreviewProps) {
  const { company, manager, files, energy, site, finance } = summary;
  const displayCompletion = inferDisplayCompletion(summary);
  const completedCount = SECTION_STEPS.filter((step) => displayCompletion[step]).length;

  return (
    <div className="flex flex-col gap-6">
      <JoyaPageHeader
        eyebrow="Mon dossier"
        title="Mes informations"
        description="Récapitulatif de votre dossier d'intégration : entreprise, installation, données énergétiques et documents (lecture seule)."
        meta={
          <>
            <span className="inline-flex h-8 items-center rounded-full bg-coral-soft px-3 font-data text-[12.5px] font-medium text-coral-dark">
              {completedCount}/{SECTION_STEPS.length} sections complètes
            </span>
            <span className="inline-flex h-8 items-center gap-2 rounded-full border border-line bg-white px-3 text-[12.5px] font-medium text-navy">
              Documents
              {SECTION_STEPS.map((step) => (
                <span
                  key={step}
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full",
                    displayCompletion[step]
                      ? "bg-coral text-white"
                      : "bg-slate-100 text-slate-400",
                  )}
                  title={
                    displayCompletion[step] ? "Section complète" : "Section en cours"
                  }
                >
                  <Check className="h-3 w-3" strokeWidth={2.75} aria-hidden />
                </span>
              ))}
            </span>
          </>
        }
      />

      <div className="joya-stagger grid items-stretch gap-4 lg:grid-cols-2 lg:gap-5">
        <SectionCard
          title="Entreprise"
          icon={Building2}
          completed={displayCompletion[1]}
        >
          <dl className="grid grid-cols-1 gap-2 xs:grid-cols-2">
            <Field label="Raison sociale" value={company.legal_name} />
            <Field label="Matricule fiscal" value={company.tax_id} />
            <Field label="Gouvernorat" value={company.gouvernorat} />
            <Field label="Secteur" value={company.sector} />
            <div className="xs:col-span-2">
              <Field
                label="Adresse d'installation"
                value={company.installation_address}
              />
            </div>
          </dl>
          <div className="mt-4">
            <DocGroupLabel>Documents</DocGroupLabel>
            <DocumentLinks
              files={[...files.tradeRegister, ...files.rne]}
              emptyLabel="Aucun document entreprise"
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Gérant"
          icon={UserCircle}
          completed={displayCompletion[2]}
        >
          <dl className="grid grid-cols-1 gap-2 xs:grid-cols-2">
            <Field label="Nom complet" value={manager.full_name} />
            <Field label="CIN" value={manager.cin_number} />
            <Field label="E-mail" value={manager.email} />
            <Field label="Téléphone" value={manager.phone_number} />
            <Field label="Adresse" value={manager.address} />
            <Field label="Part (%)" value={manager.ownership_pct} />
          </dl>
          <div className="mt-4">
            <DocGroupLabel>CIN</DocGroupLabel>
            <DocumentLinks files={files.cin} />
          </div>
        </SectionCard>

        <SectionCard
          title="Données énergétiques"
          icon={Zap}
          completed={displayCompletion[3]}
        >
          <dl className="grid grid-cols-1 gap-2 xs:grid-cols-2">
            <Field
              label="Puissance souscrite"
              value={
                energy.power != null && energy.power !== ""
                  ? `${energy.power} kVA`
                  : "—"
              }
            />
          </dl>
          <div className="mt-4">
            <DocGroupLabel count={files.bills.length}>Factures STEG</DocGroupLabel>
            <DocumentLinks files={files.bills} emptyLabel="Aucune facture" />
          </div>
        </SectionCard>

        <SectionCard
          title="Site & toiture"
          icon={Home}
          completed={displayCompletion[4]}
        >
          <dl className="grid grid-cols-1 gap-2 xs:grid-cols-2">
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
          </dl>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <DocGroupLabel count={files.roofImages.length}>Photos toiture</DocGroupLabel>
              <DocumentLinks files={files.roofImages} />
            </div>
            <div>
              <DocGroupLabel>Technique & propriété</DocGroupLabel>
              <DocumentLinks
                files={[
                  ...files.roofOwnership,
                  ...files.electricalPanel,
                  ...files.meter,
                ]}
                emptyLabel="Aucun document site"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Situation financière"
          icon={Wallet}
          completed={displayCompletion[5]}
          className="lg:col-span-2"
        >
          <dl className="grid grid-cols-1 gap-2 xs:grid-cols-2 md:grid-cols-4">
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
            {finance.current_credit && (
              <Field
                label="Mensualité crédit"
                value={
                  finance.total_monthly_payment != null
                    ? `${finance.total_monthly_payment} TND`
                    : "—"
                }
              />
            )}
          </dl>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "RIB", files: files.rib },
              { label: "Déclaration fiscale", files: files.taxDeclaration },
              { label: "Bilan", files: files.balanceSheets },
              { label: "Relevés bancaires", files: files.bankStatements },
            ].map((group) => (
              <div key={group.label}>
                <DocGroupLabel>{group.label}</DocGroupLabel>
                <DocumentLinks files={group.files} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
