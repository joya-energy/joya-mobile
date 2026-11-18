"use client";

import {
  Building2,
  Home,
  IdCard,
  Wallet,
  Zap,
} from "lucide-react";
import { FileUploadCard } from "@/components/onboarding/file-upload-card";
import { ONBOARDING_DOCUMENT_TIPS } from "@/lib/onboarding/document-upload-tips";
import { ob } from "@/lib/onboarding/theme";
import type { UploadFileRef } from "@/lib/files/api";
import type { InstallateurOnboardingFiles } from "@/lib/installateurs/onboarding-docs";

const ACCEPT_DOCS = ".pdf,.png,.jpg,.jpeg,application/pdf,image/*";
const ACCEPT_PHOTOS = ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*";

type Props = {
  companyId: string;
  value: InstallateurOnboardingFiles;
  onChange: (next: InstallateurOnboardingFiles) => void;
  description?: string;
};

function setField(
  value: InstallateurOnboardingFiles,
  key: keyof InstallateurOnboardingFiles,
  next: string | string[] | UploadFileRef[],
): InstallateurOnboardingFiles {
  return {
    ...value,
    [key]: Array.isArray(next) ? (next as UploadFileRef[]) : [],
  };
}

function SectionHeading({
  icon: Icon,
  title,
}: {
  icon: typeof Building2;
  title: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${ob.sectionBorder}`}>
      <Icon size={18} className={ob.sectionIcon} />
      <h3 className="text-sm font-bold text-navy">{title}</h3>
    </div>
  );
}

export function OnboardingDocsFields({
  companyId,
  value,
  onChange,
  description = "Mêmes pièces que l’espace client — tout est optionnel de votre côté.",
}: Props) {
  return (
    <div className="space-y-5 border-t border-slate-200 pt-4">
      <div>
        <p className="text-xs font-medium text-slate-600">Dossier onboarding</p>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <section className="space-y-3">
        <SectionHeading icon={Building2} title="Documents entreprise" />
        <FileUploadCard
          label="Registre de commerce"
          tip={ONBOARDING_DOCUMENT_TIPS.tradeRegister}
          theme="light"
          accept={ACCEPT_DOCS}
          multiple={false}
          value={value.tradeRegister}
          onValueChange={(next) =>
            onChange(setField(value, "tradeRegister", next))
          }
          uploadConfig={{
            companyId,
            linkTarget: "company_trade_register",
          }}
          uploadMode
        />
        <FileUploadCard
          label="RNE"
          tip={ONBOARDING_DOCUMENT_TIPS.rne}
          theme="light"
          accept={ACCEPT_DOCS}
          multiple={false}
          value={value.rne}
          onValueChange={(next) => onChange(setField(value, "rne", next))}
          uploadConfig={{
            companyId,
            linkTarget: "company_rne",
          }}
          uploadMode
        />
      </section>

      <section className="space-y-3">
        <SectionHeading icon={IdCard} title="Identité gérant" />
        <FileUploadCard
          label="Copie CIN recto/verso"
          tip={ONBOARDING_DOCUMENT_TIPS.cin}
          theme="light"
          accept={ACCEPT_DOCS}
          multiple
          maxFiles={2}
          value={value.cin}
          onValueChange={(next) => onChange(setField(value, "cin", next))}
          uploadConfig={{
            companyId,
            linkTarget: "company_manager_cin_document",
          }}
          uploadMode
        />
      </section>

      <section className="space-y-3">
        <SectionHeading icon={Zap} title="Factures STEG" />
        <FileUploadCard
          label="Factures STEG"
          tip={ONBOARDING_DOCUMENT_TIPS.stegBills}
          theme="light"
          accept={ACCEPT_DOCS}
          multiple
          maxFiles={20}
          value={value.stegBills}
          onValueChange={(next) => onChange(setField(value, "stegBills", next))}
          uploadConfig={{
            companyId,
            linkTarget: "company_bill",
          }}
          uploadMode
        />
      </section>

      <section className="space-y-3">
        <SectionHeading icon={Home} title="Site & toiture" />
        <FileUploadCard
          label="Photos de site / toiture (optionnel)"
          tip={ONBOARDING_DOCUMENT_TIPS.roofImages}
          theme="light"
          accept={ACCEPT_PHOTOS}
          multiple
          value={value.roofImages}
          onValueChange={(next) => onChange(setField(value, "roofImages", next))}
          uploadConfig={{
            companyId,
            linkTarget: "company_roof_image",
          }}
          uploadMode
        />
      </section>

      <section className="space-y-3">
        <SectionHeading icon={Wallet} title="Documents financiers" />
        <FileUploadCard
          label="Extraits bancaires"
          tip={ONBOARDING_DOCUMENT_TIPS.bankStatements}
          theme="light"
          accept={ACCEPT_DOCS}
          multiple
          maxFiles={20}
          value={value.bankStatements}
          onValueChange={(next) =>
            onChange(setField(value, "bankStatements", next))
          }
          uploadConfig={{
            companyId,
            linkTarget: "company_bank_statement",
          }}
          uploadMode
        />
      </section>
    </div>
  );
}
