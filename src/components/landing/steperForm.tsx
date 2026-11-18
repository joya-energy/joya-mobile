"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form } from "../ui/form";
import { Button } from "../ui/button";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { StepIndicator } from "./StepIndicator";
import { StepProjectFields } from "./form-steps/StepProjectFields";
import { StepContactFields } from "./form-steps/StepContactFields";
import { notifyFromError } from "@/lib/notifications";
import {
  ENERGY_PROFILES,
  TUNISIAN_GOVERNORATES,
} from "@/types/const";
import { JOYA_MARKETING_LANDING_URL } from "@/lib/landing/urls";

const energyProfileSet = new Set(ENERGY_PROFILES.map((t) => t.type));
const governorateSet = new Set(TUNISIAN_GOVERNORATES);

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Numéro de téléphone requis")
  .transform((s) => s.replace(/[^\d]/g, ""))
  .refine(
    (digits) =>
      digits.length === 8 || (digits.length === 11 && digits.startsWith("216")),
    "Numéro de téléphone invalide (8 chiffres, ou +216 en option)",
  )
  .transform((digits) => (digits.length === 11 ? digits.slice(3) : digits))
  .refine((digits) => /^\d{8}$/.test(digits), "Numéro de téléphone invalide");

const solarRequestSchema = z.object({
  electricityBillValue: z
    .union([z.string().min(1, "Requis"), z.number().min(0)])
    .transform((v) => (typeof v === "string" ? (v ? Number(v) : NaN) : v))
    .pipe(z.number().finite().min(1, "Montant requis (min. 1 TND)")),
  energyProfile: z
    .string()
    .trim()
    .min(1, "Sélectionnez un profil énergétique")
    .refine(
      (v) => energyProfileSet.has(v),
      "Sélectionnez un profil énergétique",
    ),
  taxId: z
    .string()
    .trim()
    .min(1, "Matricule fiscal requis")
    .refine(
      (v) => /^\d{7}[A-Za-z]$/.test(v.replace(/\s+/g, "")),
      "Le matricule fiscal doit contenir 7 chiffres et 1 lettre",
    ),
  governorate: z
    .string()
    .trim()
    .min(1, "Sélectionnez un gouvernorat")
    .refine((v) => governorateSet.has(v), "Sélectionnez un gouvernorat"),
  firstName: z
    .string()
    .trim()
    .min(2, "Nom requis")
    .max(50, "Nom invalide")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Nom invalide"),
  lastName: z
    .string()
    .trim()
    .min(2, "Prénom requis")
    .max(50, "Prénom invalide")
    .regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/, "Prénom invalide"),
  phone: phoneSchema,
  email: z
    .string()
    .trim()
    .email("Email invalide")
    .transform((v) => v.toLowerCase()),
});

export type SolarRequestFormValues = z.infer<typeof solarRequestSchema>;
export type SolarRequestFormInput = z.input<typeof solarRequestSchema>;

const STEP_1_FIELDS: (keyof SolarRequestFormInput)[] = [
  "electricityBillValue",
  "energyProfile",
  "taxId",
  "governorate",
];
const STEP_2_FIELDS: (keyof SolarRequestFormInput)[] = [
  "firstName",
  "lastName",
  "phone",
  "email",
];

const defaultValues: SolarRequestFormInput = {
  electricityBillValue: "",
  energyProfile: "",
  taxId: "",
  governorate: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
};

const STEPS = [
  { id: 1, label: "Votre projet" },
  { id: 2, label: "Contact" },
];

const FORM_DRAFT_KEY = "solar-request-form-draft";

function readFormDraft(): Partial<SolarRequestFormInput> | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(FORM_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<SolarRequestFormInput>;
  } catch {
    return null;
  }
}

function saveFormDraft(values: SolarRequestFormInput) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(values));
}

export function clearSolarRequestFormDraft() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(FORM_DRAFT_KEY);
}

type SteperFormProps = {
  onRequestSubmit?: (data: SolarRequestFormValues) => Promise<void>;
  registrationError?: string | null;
  onClearRegistrationError?: () => void;
  onSwitchToInstallateur?: () => void;
};

export function SteperForm({
  onRequestSubmit,
  registrationError,
  onClearRegistrationError,
  onSwitchToInstallateur,
}: SteperFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SolarRequestFormInput>({
    resolver: zodResolver(solarRequestSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    const draft = readFormDraft();
    if (draft) {
      form.reset({ ...defaultValues, ...draft });
    }
  }, [form]);

  useEffect(() => {
    if (!registrationError) return;
    setCurrentStep(2);
  }, [registrationError]);

  const isFilled = (name: keyof SolarRequestFormInput, v: unknown): boolean => {
    if (name === "taxId") {
      const s = typeof v === "string" ? v.trim().replace(/\s+/g, "") : "";
      return /^\d{7}[A-Za-z]$/.test(s);
    }
    if (name === "electricityBillValue") {
      const n = typeof v === "number" ? v : Number(v);
      return !Number.isNaN(n) && n >= 1;
    }
    return typeof v === "string" && v.trim().length > 0;
  };

  const step1Valid = STEP_1_FIELDS.every((name) =>
    isFilled(name, form.getValues(name)),
  );
  const step2Valid = STEP_2_FIELDS.every((name) => {
    const v = form.getValues(name);
    return typeof v === "string" && v.trim().length > 0;
  });

  const canGoNext = currentStep === 1 ? step1Valid : step2Valid;

  const goNext = async () => {
    const ok = await form.trigger(STEP_1_FIELDS);
    if (!ok) return;
    setCurrentStep(2);
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const submitRequest = async (data: SolarRequestFormInput) => {
    if (!onRequestSubmit) return;

    setIsSubmitting(true);
    try {
      const payload = solarRequestSchema.parse(data);
      saveFormDraft(form.getValues());
      await onRequestSubmit(payload);
    } catch (error) {
      if (!(error as { response?: unknown })?.response) {
        notifyFromError(error, "Erreur lors de la soumission de la demande");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentStep < 2) {
      void goNext();
    } else {
      void form.handleSubmit(submitRequest)(e);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-tight mb-2 animate-fade-in-up">
        Demande de financement solaire
      </h1>
      <p className="text-muted-foreground text-sm mb-4 sm:mb-5 leading-relaxed max-w-md animate-fade-in-up [animation-delay:0.06s] opacity-0">
        Lancez votre projet solaire en quelques minutes. Envoyez votre demande
        et notre équipe évaluera le potentiel de votre installation.
      </p>
      {onSwitchToInstallateur ? (
        <p className="mb-6 text-sm text-muted-foreground sm:mb-8 animate-fade-in-up [animation-delay:0.08s] opacity-0">
          Vous êtes installateur partenaire ?{" "}
          <button
            type="button"
            onClick={onSwitchToInstallateur}
            className="font-medium text-landing-primary underline-offset-4 transition-colors hover:text-landing-primary-dark hover:underline"
          >
            Créer un compte installateur
          </button>
        </p>
      ) : null}

      <Form {...form}>
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-col min-h-[45vh] sm:min-h-[50vh]"
        >
          <div className="flex-1 min-h-0 relative">
            {currentStep === 1 && (
              <div
                key="step1"
                className="animate-step-enter"
                style={{ animationDelay: "0s" }}
              >
                <StepProjectFields control={form.control} />
              </div>
            )}
            {currentStep === 2 && (
              <div
                key="step2"
                className="animate-step-enter"
                style={{ animationDelay: "0s" }}
              >
                {registrationError ? (
                  <div
                    role="alert"
                    className="mb-4 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger-strong"
                  >
                    {registrationError}
                  </div>
                ) : null}
                <StepContactFields
                  control={form.control}
                  onEmailChange={onClearRegistrationError}
                />
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 sm:pt-6 animate-fade-in-up space-y-2.5">
            <div
              className={
                currentStep > 1 ? "grid grid-cols-2 gap-2.5 sm:gap-3" : ""
              }
            >
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="h-11 sm:h-12 rounded-xl border-border/60 text-sm sm:text-base font-medium"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
                  Retour
                </Button>
              ) : null}
              <Button
                type="submit"
                className={`h-11 sm:h-12 bg-landing-primary hover:bg-landing-primary-dark text-sm sm:text-base font-medium rounded-xl transition-all duration-200 active:scale-[0.98] ${
                  currentStep > 1 ? "" : "w-full"
                }`}
                disabled={
                  isSubmitting ||
                  (currentStep < 2 && !canGoNext) ||
                  (currentStep === 2 && !step2Valid)
                }
              >
                {isSubmitting
                  ? "Soumettant..."
                  : currentStep < 2
                    ? "Suivant"
                    : "Soumettre ma demande"}
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin ml-2 shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 ml-2 shrink-0" />
                )}
              </Button>
            </div>
            {currentStep === 1 ? (
              <Button
                type="button"
                variant="outline"
                asChild
                className="w-full h-11 sm:h-12 rounded-xl border-border/60 text-sm sm:text-base font-medium text-muted-foreground hover:text-foreground"
              >
                <Link href={JOYA_MARKETING_LANDING_URL}>
                  <ArrowLeft className="w-4 h-4 mr-2 shrink-0" />
                  Retour à l&apos;accueil
                </Link>
              </Button>
            ) : null}
          </div>
        </form>
      </Form>
    </div>
  );
}
