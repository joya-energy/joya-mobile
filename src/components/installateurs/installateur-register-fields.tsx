"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { installateurApi } from "@/lib/installateurs/api";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { translateUserMessage } from "@/lib/user-messages";

const FISCAL_ID_PATTERN = /^[0-9]{7}[A-Za-z]$/;
const PHONE_PATTERN = /^(\+|00)[0-9]{8,15}$|^[0-9]{8}$/;

const registerSchema = z.object({
  managerName: z.string().trim().min(2, "Nom et prénom requis"),
  companyName: z.string().trim().min(2, "Nom de l'entreprise requis"),
  fiscalId: z
    .string()
    .trim()
    .toUpperCase()
    .refine(
      (v) => v === "" || FISCAL_ID_PATTERN.test(v),
      "Matricule fiscal invalide (7 chiffres + 1 lettre)",
    ),
  phoneNumber: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Numéro de téléphone invalide"),
  email: z.string().trim().email("Adresse e-mail invalide"),
});

export type InstallateurRegisterValues = z.infer<typeof registerSchema>;

const inputClass =
  "h-10 sm:h-11 rounded-xl bg-muted/50 border-border/60 focus-visible:ring-primary/30 transition-colors";

type InstallateurRegisterFieldsProps = {
  onSwitchToFinancing?: () => void;
};

export function InstallateurRegisterFields({
  onSwitchToFinancing,
}: InstallateurRegisterFieldsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<InstallateurRegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      managerName: "",
      companyName: "",
      fiscalId: "",
      phoneNumber: "",
      email: "",
    },
  });

  const onSubmit = async (data: InstallateurRegisterValues) => {
    setIsLoading(true);
    try {
      const response = await installateurApi.register({
        ...data,
        fiscalId: (data.fiscalId || "").trim().toUpperCase(),
        email: data.email.toLowerCase(),
      });

      if (response.emailSent === false && response.setupUrl) {
        notifySuccess(
          response.message ||
            "Compte créé. Redirection pour définir votre mot de passe…",
        );
        form.reset();
        router.push(response.setupUrl);
        return;
      }

      notifySuccess(
        response.message ||
          "Un email vous a été envoyé pour créer votre mot de passe.",
      );
      form.reset();
    } catch (error) {
      const apiMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message;
      const message = translateUserMessage(
        apiMessage,
        "Une erreur est survenue. Veuillez réessayer plus tard.",
      );
      const isExisting =
        !!apiMessage &&
        (/existe déjà/i.test(apiMessage) || /connectez-vous/i.test(apiMessage));
      notifyError({
        title: isExisting ? "Compte existant" : "Inscription impossible",
        message,
        action: isExisting
          ? {
              label: "Se connecter",
              onClick: () => router.push("/auth/login"),
            }
          : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-step-enter">
      <h1 className="mb-2 font-display text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
        Compte installateur partenaire
      </h1>
      <p className="mb-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:mb-5">
        Rejoignez le réseau Joya Energy pour soumettre des dossiers clients et
        suivre vos projets solaires.
      </p>

      {onSwitchToFinancing ? (
        <p className="mb-6 text-sm text-muted-foreground sm:mb-8">
          Vous êtes une entreprise cliente ?{" "}
          <button
            type="button"
            onClick={onSwitchToFinancing}
            className="font-medium text-landing-primary underline-offset-4 transition-colors hover:text-landing-primary-dark hover:underline"
          >
            Demander un financement solaire
          </button>
        </p>
      ) : null}

      <Form {...form}>
        <form
          className="flex min-h-[45vh] flex-col sm:min-h-[50vh]"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <div className="grid flex-1 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="managerName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Nom et prénom</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="name"
                      placeholder="Ahmed Ben Salah"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Nom de l&apos;entreprise</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="organization"
                      placeholder="Solar Tech SARL"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fiscalId"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>
                    Matricule fiscal{" "}
                    <span className="font-normal text-muted-foreground">
                      (optionnel)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={8}
                      placeholder="1234567A"
                      className={`${inputClass} uppercase`}
                      onChange={(event) =>
                        field.onChange(event.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Numéro de téléphone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+216 20 123 456"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Adresse e-mail</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      autoComplete="email"
                      placeholder="contact@entreprise.tn"
                      className={inputClass}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-auto space-y-2.5 pt-4 sm:pt-6">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-xl bg-landing-primary text-sm font-medium text-white transition-all duration-200 hover:bg-landing-primary-dark active:scale-[0.98] sm:h-12 sm:text-base"
            >
              {isLoading ? (
                <>
                  Création en cours...
                  <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
