"use client";

import Image from "next/image";
import {
  Bell,
  ClipboardCheck,
  LineChart,
} from "lucide-react";
import logoSmall from "@/assets/logo_small.webp";
import { ob } from "@/lib/onboarding/theme";
import { cn } from "@/lib/utils";

const NEXT_STEPS = [
  {
    icon: ClipboardCheck,
    title: "Analyse du dossier",
    description: "Vérification de vos documents et préparation de l'étude.",
    status: "current" as const,
  },
  {
    icon: Bell,
    title: "Notification",
    description: "Alerte dès qu'une nouvelle étape est disponible.",
    status: "upcoming" as const,
  },
  {
    icon: LineChart,
    title: "Suivi du projet",
    description: "Suivez l'avancement depuis votre espace client.",
    status: "upcoming" as const,
  },
];

export function OnboardingSubmittedScreen() {
  return (
    <div
      className="animate-in fade-in slide-in-from-bottom-4 mx-auto flex w-full max-w-lg flex-col items-center gap-3 text-center duration-700 sm:gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="relative shrink-0">
        <div
          className="absolute inset-0 scale-150 rounded-full bg-coral/15 blur-2xl"
          aria-hidden
        />
        <Image
          src={logoSmall}
          alt="Joya Energy"
          width={80}
          height={80}
          priority
          className="relative h-16 w-16 sm:h-20 sm:w-20"
        />
      </div>

      <p className="inline-flex shrink-0 items-center gap-2 rounded-full border border-navy/25 bg-navy/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy sm:px-4 sm:py-1.5 sm:text-xs">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-navy" />
        Dossier en cours d&apos;analyse
      </p>

      <div className="shrink-0 space-y-1">
        <h1 className={cn(ob.pageTitle, "text-xl sm:text-2xl")}>
          Merci, votre dossier est transmis
        </h1>
        <p className="mx-auto max-w-sm text-sm leading-snug text-navy/70 sm:text-base">
          Notre équipe analyse votre demande. Vous serez notifié dès la
          prochaine étape.
        </p>
      </div>

      <div className="w-full shrink-0 rounded-xl border border-navy/10 bg-navy/[0.02] p-3.5 text-left sm:rounded-2xl sm:p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-navy/45 sm:mb-3 sm:text-xs">
          Prochaines étapes
        </p>
        <ol className="space-y-0">
          {NEXT_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === NEXT_STEPS.length - 1;
            const isCurrent = step.status === "current";

            return (
              <li
                key={step.title}
                className="relative flex gap-3 pb-3 last:pb-0 sm:gap-3.5 sm:pb-3.5"
              >
                {!isLast ? (
                  <span
                    className="absolute left-4 top-8 h-[calc(100%-1.25rem)] w-px bg-navy/12 sm:left-[1.125rem]"
                    aria-hidden
                  />
                ) : null}
                <div
                  className={cn(
                    "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 sm:h-9 sm:w-9",
                    isCurrent
                      ? "border-coral bg-coral/12 text-coral"
                      : "border-navy/12 bg-white text-navy/40",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p
                    className={cn(
                      "text-xs font-semibold sm:text-sm",
                      isCurrent ? "text-navy" : "text-navy/65",
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-navy/55 sm:text-xs">
                    {step.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
