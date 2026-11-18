"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FileUploadCard } from "@/components/onboarding/file-upload-card";
import { OnboardingDocsFields } from "@/components/installateurs/onboarding-docs-fields";
import { StepProjectFields } from "@/components/landing/form-steps/StepProjectFields";
import { StepContactFields } from "@/components/landing/form-steps/StepContactFields";
import {
  ENERGY_PROFILES,
  SECTORS,
  TUNISIAN_GOVERNORATES,
} from "@/types/const";
import {
  installateurApi,
  type CreateInstallateurClientResponse,
} from "@/lib/installateurs/api";
import type { UploadFileRef } from "@/lib/files/api";
import {
  emptyOnboardingFiles,
  hasOnboardingFilesToSave,
  toOnboardingDocsPatch,
} from "@/lib/installateurs/onboarding-docs";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { translateUserMessage } from "@/lib/user-messages";
import { ArrowRight, Loader2 } from "lucide-react";

const energyProfileSet = new Set(ENERGY_PROFILES.map((t) => t.type));
const sectorSet = new Set(SECTORS);
const governorateSet = new Set(TUNISIAN_GOVERNORATES);

const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[^\d]/g, ""))
  .refine(
    (digits) =>
      digits.length === 0 ||
      digits.length === 8 ||
      (digits.length === 11 && digits.startsWith("216")),
    "Numéro de téléphone invalide (8 chiffres, ou +216 en option)",
  )
  .transform((digits) =>
    digits.length === 0
      ? ""
      : digits.length === 11
        ? digits.slice(3)
        : digits,
  )
  .refine(
    (digits) => digits.length === 0 || /^\d{8}$/.test(digits),
    "Numéro de téléphone invalide",
  );

const amountSchema = z
  .union([z.string(), z.number()])
  .transform((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "string" ? Number(v) : v;
    return Number.isFinite(n) ? n : undefined;
  })
  .refine(
    (n): n is number => n != null && n >= 1,
    "Consommation annuelle requise (kWh/an)",
  );

const clientFormSchema = z.object({
  annualConsumptionKwh: amountSchema,
  energyProfile: z
    .string()
    .trim()
    .min(1, "Sélectionnez un profil énergétique")
    .refine(
      (v) => energyProfileSet.has(v),
      "Sélectionnez un profil énergétique",
    ),
  governorate: z
    .string()
    .trim()
    .min(1, "Sélectionnez un gouvernorat")
    .refine((v) => governorateSet.has(v), "Sélectionnez un gouvernorat"),
  sector: z
    .string()
    .trim()
    .min(1, "Sélectionnez un secteur d'activité")
    .refine((v) => sectorSet.has(v), "Sélectionnez un secteur d'activité"),
  companyName: z
    .string()
    .trim()
    .min(2, "Nom de l'entreprise requis")
    .max(160, "Nom de l'entreprise trop long"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .transform((v) => v.toLowerCase())
    .refine(
      (v) => v === "" || z.string().email().safeParse(v).success,
      "Email invalide",
    ),
});

type ClientFormInput = z.input<typeof clientFormSchema>;

const INFO_FIELDS: (keyof ClientFormInput)[] = [
  "annualConsumptionKwh",
  "energyProfile",
  "governorate",
  "sector",
  "companyName",
  "phone",
  "email",
];

const defaultValues: ClientFormInput = {
  annualConsumptionKwh: "",
  energyProfile: "",
  governorate: "",
  sector: "",
  companyName: "",
  phone: "",
  email: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export function CreateClientModal({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] =
    useState<CreateInstallateurClientResponse | null>(null);
  const [devisFiles, setDevisFiles] = useState<UploadFileRef[]>([]);
  const [pvsysFiles, setPvsysFiles] = useState<UploadFileRef[]>([]);
  const [autresFiles, setAutresFiles] = useState<UploadFileRef[]>([]);
  const [onboardingFiles, setOnboardingFiles] = useState(
    emptyOnboardingFiles(),
  );

  const form = useForm<ClientFormInput>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setCreated(null);
      setDevisFiles([]);
      setPvsysFiles([]);
      setAutresFiles([]);
      setOnboardingFiles(emptyOnboardingFiles());
      form.reset(defaultValues);
    }
  }, [open, form]);

  const handleCreateClient = async () => {
    const ok = await form.trigger(INFO_FIELDS);
    if (!ok) return;

    setIsSubmitting(true);
    try {
      const values = clientFormSchema.parse(form.getValues());
      const result = await installateurApi.createClient({
        annualConsumptionKwh: values.annualConsumptionKwh,
        energyProfile: values.energyProfile,
        governorate: values.governorate,
        sector: values.sector,
        companyName: values.companyName,
        phone: values.phone || undefined,
        email: values.email || undefined,
      });
      setCreated(result);
      setStep(2);

      notifySuccess(
        result.created
          ? "Client créé. JOYA examinera le projet avant d'envoyer l'invitation de création de compte."
          : "Client déjà lié à votre compte.",
      );
    } catch (error) {
      const message = translateUserMessage(
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
          (error as { message?: string })?.message,
        "Impossible de créer le client.",
      );
      notifyError({ title: "Erreur", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDocs = async (skip: boolean) => {
    if (!created) return;

    if (skip) {
      onCreated();
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const devisReady =
        devisFiles[0]?.fileId &&
        devisFiles[0].status !== "uploading" &&
        devisFiles[0].status !== "failed"
          ? devisFiles[0].fileId
          : null;
      const pvsysReady =
        pvsysFiles[0]?.fileId &&
        pvsysFiles[0].status !== "uploading" &&
        pvsysFiles[0].status !== "failed"
          ? pvsysFiles[0].fileId
          : null;
      const autresReady = autresFiles
        .filter(
          (f) =>
            f.fileId && f.status !== "uploading" && f.status !== "failed",
        )
        .map((f) => f.fileId);

      if (devisReady || pvsysReady || autresReady.length > 0) {
        await installateurApi.updateClientSiteDocs(
          created.companyId,
          created.siteId,
          {
            ...(devisReady ? { devis_file_id: devisReady } : {}),
            ...(pvsysReady ? { pvsys_file_id: pvsysReady } : {}),
            ...(autresReady.length > 0 ? { autres_file_ids: autresReady } : {}),
          },
        );
      }

      if (hasOnboardingFilesToSave(onboardingFiles)) {
        await installateurApi.updateClientOnboardingDocs(
          created.companyId,
          toOnboardingDocsPatch(onboardingFiles, "partial"),
        );
      }

      notifySuccess("Documents enregistrés.");
      onCreated();
      onOpenChange(false);
    } catch (error) {
      const message = translateUserMessage(
        (error as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
          (error as { message?: string })?.message,
        "Impossible d'enregistrer les documents.",
      );
      notifyError({ title: "Erreur", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title =
    step === 1 ? "Nouveau client" : "Documents du site";

  const description =
    step === 1
      ? "Renseignez les informations de la demande de financement."
      : "Uploadez les documents du site et, si vous les avez déjà, les pièces du dossier (CIN, RNE, facture STEG, extrait bancaire, photos de toiture…). L'invitation sera envoyée par JOYA après revue.";

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full max-w-md sm:max-w-lg data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-lg">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
          <div className="mt-2 flex gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step === 1 ? "bg-coral" : "bg-slate-200"
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full ${
                step === 2 ? "bg-coral" : "bg-slate-200"
              }`}
            />
          </div>
        </DrawerHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          {step === 1 ? (
            <Form {...form}>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <StepProjectFields
                  control={form.control}
                  showAnnualConsumption
                  showElectricityBill={false}
                  showTaxId={false}
                  showSector
                />
                <StepContactFields
                  control={form.control}
                  showPersonNames={false}
                  showCompanyName
                  contactOptional
                  emailLabel="E-mail du client"
                  emailPlaceholder="E-mail du client"
                />
              </form>
            </Form>
          ) : created ? (
            <div className="space-y-4">
              <FileUploadCard
                label="Devis estimatif (PDF)"
                accept=".pdf,application/pdf"
                multiple={false}
                value={devisFiles}
                onValueChange={(next) =>
                  setDevisFiles(
                    Array.isArray(next) ? (next as UploadFileRef[]) : [],
                  )
                }
                uploadConfig={{ companyId: created.companyId }}
                uploadMode
              />
              <FileUploadCard
                label="Rapport PVSYS (PDF)"
                accept=".pdf,application/pdf"
                multiple={false}
                value={pvsysFiles}
                onValueChange={(next) =>
                  setPvsysFiles(
                    Array.isArray(next) ? (next as UploadFileRef[]) : [],
                  )
                }
                uploadConfig={{ companyId: created.companyId }}
                uploadMode
              />
              <FileUploadCard
                label="Autres fichiers (plans, 3D, SketchUp…)"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.csv,.skp,application/pdf,image/*,application/octet-stream,model/vnd.sketchup.skp"
                multiple
                maxFiles={10}
                value={autresFiles}
                onValueChange={(next) =>
                  setAutresFiles(
                    Array.isArray(next) ? (next as UploadFileRef[]) : [],
                  )
                }
                uploadConfig={{ companyId: created.companyId }}
                uploadMode
              />
              <p className="text-xs text-slate-500">
                Optionnel — jusqu&apos;à 10 fichiers pour enrichir le projet.
              </p>

              <OnboardingDocsFields
                companyId={created.companyId}
                value={onboardingFiles}
                onChange={setOnboardingFiles}
                description="Mêmes pièces que l’espace client — tout est optionnel de votre côté."
              />
            </div>
          ) : null}
        </div>

        <DrawerFooter>
          {step === 1 ? (
            <Button
              type="button"
              onClick={() => void handleCreateClient()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création…
                </>
              ) : (
                <>
                  Créer et continuer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={() => void handleSaveDocs(false)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  "Enregistrer les documents"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleSaveDocs(true)}
                disabled={isSubmitting}
              >
                Terminer sans documents
              </Button>
            </div>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
