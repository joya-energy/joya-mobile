"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  FileText,
  KeyRound,
  LayoutDashboard,
  LineChart,
  LogIn,
  Mail,
  Sun,
} from "lucide-react";
import type { LeadSignupDecision } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoBig from "@/assets/logo_big.webp";
import solarImage from "@/assets/solar-commercial.jpg";

const NEXT_STEPS = [
  {
    icon: Mail,
    title: "Ouvrez l'email Joya Energy",
    description: "Un lien sécurisé pour activer votre compte vient d'arriver.",
  },
  {
    icon: KeyRound,
    title: "Créez votre mot de passe",
    description: "Le lien reste valable 24 heures.",
  },
  {
    icon: LogIn,
    title: "Connectez-vous",
    description: "Accédez à votre espace client en un clic.",
  },
  {
    icon: FileText,
    title: "Complétez votre dossier",
    description: "Onboarding guidé : entreprise, site et financement.",
  },
] as const;

const SIGNUP_COMPLETE_NEXT_STEPS = [
  {
    icon: LogIn,
    title: "Connectez-vous",
    description: "Utilisez l'email et le mot de passe que vous venez de créer.",
  },
  {
    icon: FileText,
    title: "Complétez votre dossier",
    description:
      "Onboarding guidé : entreprise, documents et financement. L'acceptation se fait après étude du dossier.",
  },
] as const;

const APP_FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    description: "Économies énergétiques, financières et indicateurs en temps réel.",
  },
  {
    icon: LineChart,
    title: "Énergie & économies",
    description: "Graphiques détaillés et comparatifs mensuels.",
  },
  {
    icon: Sun,
    title: "Votre installation",
    description: "Contrat ESCO, puissance et performance du site.",
  },
  {
    icon: Bell,
    title: "Alertes & suivi",
    description: "Notifications et points de vigilance personnalisés.",
  },
] as const;

type ApprovalResultViewProps = {
  email?: string;
  decision: LeadSignupDecision;
  signupComplete?: boolean;
};

export function ApprovalResultView({
  email,
  decision,
  signupComplete = false,
}: ApprovalResultViewProps) {
  if (decision === "rejected") {
    return <RejectedView email={email} />;
  }
  return <ApprovedView email={email} signupComplete={signupComplete} />;
}

function ApprovedView({
  email,
  signupComplete,
}: {
  email?: string;
  signupComplete: boolean;
}) {
  const steps = signupComplete ? SIGNUP_COMPLETE_NEXT_STEPS : NEXT_STEPS;
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-white lg:h-screen lg:grid-cols-2 lg:overflow-hidden">
      {/* Left — welcome + next steps */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-xl">
          <div className="animate-fade-in-up" style={{ opacity: 0 }}>
            <Image src={logoBig} alt="Joya Energy" width={132} priority />
          </div>

          <div
            className="mt-8 animate-fade-in-up"
            style={{ animationDelay: "0.06s", opacity: 0 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-coral/35 bg-coral/10 px-3.5 py-1.5 text-xs font-semibold text-navy">
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-coral">
                <span className="approval-ping absolute inline-flex h-full w-full rounded-full bg-coral opacity-60" />
                <Check className="relative h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
              Compte activé
            </span>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-navy sm:text-4xl">
              Bienvenue chez <span className="text-coral">Joya Energy</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-navy/70">
              Votre email est confirmé et votre compte est prêt
              {email ? (
                <>
                  {" "}
                  (
                  <span className="font-medium text-navy">{email}</span>)
                </>
              ) : null}
              . Complétez ensuite votre dossier onboarding — la décision
              d&apos;acceptation se fait après étude du dossier.
            </p>
          </div>

          {/* Next steps timeline */}
          <ol className="mt-8 space-y-1">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === steps.length - 1;
              return (
                <li
                  key={step.title}
                  className="relative flex gap-4 pb-4 animate-fade-in-up"
                  style={{
                    animationDelay: `${0.16 + index * 0.08}s`,
                    opacity: 0,
                  }}
                >
                  {!isLast ? (
                    <span
                      className="absolute left-[1.375rem] top-11 h-[calc(100%-1.75rem)] w-px bg-gradient-to-b from-coral/40 to-coral/5"
                      aria-hidden
                    />
                  ) : null}
                  <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-coral ring-1 ring-coral/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-coral/70">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="font-semibold text-navy">
                        {step.title}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm leading-snug text-navy/60">
                      {step.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div
            className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center animate-fade-in-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}
          >
            <Button
              asChild
              size="lg"
              className="h-12 rounded-2xl bg-coral px-7 text-base font-bold text-white shadow-lg shadow-coral/25 hover:bg-coral-dark"
            >
              <Link href="/auth/login">
                Se connecter
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-xs leading-tight text-navy/55 sm:max-w-[14rem]">
              {signupComplete
                ? "Votre compte est prêt — connectez-vous pour démarrer votre onboarding."
                : "Le lien de mot de passe arrive par email — pensez à vérifier vos spams."}
            </p>
          </div>
        </div>
      </div>

      {/* Right — navy hero with solar image + app preview */}
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src={solarImage}
          alt="Installation solaire commerciale"
          className="absolute inset-0 h-full w-full object-cover"
          priority
          sizes="50vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(165deg, rgba(15,42,68,0.78) 0%, rgba(15,42,68,0.9) 55%, #0F2A44 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute -right-16 top-1/4 h-72 w-72 rounded-full bg-coral/30 blur-3xl"
          aria-hidden
        />

        <div className="relative flex h-full flex-col justify-center px-12 py-12 xl:px-16">
          <p
            className="text-xs font-bold uppercase tracking-[0.22em] text-coral animate-fade-in-up"
            style={{ animationDelay: "0.2s", opacity: 0 }}
          >
            Votre espace client
          </p>
          <h2
            className="mt-3 max-w-md font-display text-3xl font-bold leading-tight text-white xl:text-4xl animate-fade-in-up"
            style={{ animationDelay: "0.26s", opacity: 0 }}
          >
            Tout votre projet solaire, au même endroit
          </h2>

          <div className="mt-9 grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {APP_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.11] animate-fade-in-up"
                  style={{
                    animationDelay: `${0.34 + index * 0.08}s`,
                    opacity: 0,
                  }}
                >
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-coral/20 text-coral">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-white/65">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            className="mt-8 flex max-w-lg items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm animate-fade-in-up"
            style={{ animationDelay: "0.7s", opacity: 0 }}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-coral/20 text-coral">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-white">72%</p>
              <p className="text-xs text-white/65">
                d&apos;économies potentielles sur 25 ans
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectedView({ email }: { email?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-12">
      <div
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-warning/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-navy/8 blur-3xl"
        aria-hidden
      />

      <div
        className="relative w-full max-w-lg rounded-3xl border border-navy/8 bg-white/90 p-8 shadow-[0_24px_70px_-30px_rgba(14,37,49,0.4)] backdrop-blur-sm animate-fade-in-up sm:p-10"
        style={{ opacity: 0 }}
      >
        <Image src={logoBig} alt="Joya Energy" width={120} priority />

        <div className="approval-icon-pop mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning-soft text-warning ring-1 ring-warning/20">
          <Mail className="h-7 w-7" />
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
          Demande non retenue
        </h1>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-navy/70">
          Votre email est confirmé. Après étude, votre demande ne correspond pas
          à nos critères d&apos;éligibilité actuels. Un email détaillé vient de
          vous être envoyé
          {email ? (
            <>
              {" "}
              à <span className="font-medium text-navy">{email}</span>
            </>
          ) : null}
          .
        </p>

        <div className="mt-6 rounded-2xl border border-warning/20 bg-warning-soft/70 px-5 py-4">
          <p className="text-sm leading-snug text-warning-strong/80">
            Notre équipe reste disponible si votre situation évolue ou pour
            toute question sur cette décision.
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            asChild
            className="h-12 rounded-xl bg-coral px-7 font-bold text-white hover:bg-coral-dark"
          >
            <Link href="https://joya-energy.com/">Retour au site Joya Energy</Link>
          </Button>
          <Link
            href="mailto:support@joya-energy.com"
            className="text-sm font-medium text-coral hover:underline"
          >
            support@joya-energy.com
          </Link>
        </div>
      </div>
    </div>
  );
}
