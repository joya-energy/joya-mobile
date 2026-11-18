"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  Sun,
  Zap,
} from "lucide-react";
import solarImage from "@/assets/solar-commercial.jpg";
import logoBig from "@/assets/logo_big.webp";
import {
  formatDtPerMonthRange,
  formatKwhAmount,
  formatKwcValue,
  formatSavingsPercentRange,
  formatTonnesValue,
  SOLAR_ESTIMATE_CONSTANTS,
  type SolarEstimateResult,
} from "@/lib/landing/solar-estimate";
import { JOYA_MARKETING_LANDING_URL } from "@/lib/landing/urls";
import { cn } from "@/lib/utils";

const APP_FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    description: "Économies financières et indicateurs en temps réel.",
  },
  {
    icon: Zap,
    title: "Énergie & économies",
    description: "Comparatif facture STEG vs redevance Joya, mois par mois.",
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

type RevealStyle = {
  animationDelay?: string;
};

function revealStyle(delayMs: number): RevealStyle {
  return { animationDelay: `${delayMs}ms` };
}

function AnimatedNumber({
  value,
  format,
  delayMs = 0,
}: {
  value: number;
  format: (n: number) => string;
  delayMs?: number;
}) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!started) return;

    const duration = 900;
    let startTime = 0;
    let frame = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(value * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value]);

  return <>{format(display)}</>;
}

type SolarEstimateViewProps = {
  result: SolarEstimateResult;
  onObtainDevis?: () => void | Promise<void>;
  onBack?: () => void;
  isSubmitting?: boolean;
  primaryActionLabel?: string;
};

function MetricCard({
  label,
  value,
  unit,
  animatedValue,
  formatAnimated,
  delayMs = 0,
}: {
  label: string;
  value: string;
  unit: string;
  animatedValue?: number;
  formatAnimated?: (n: number) => string;
  delayMs?: number;
}) {
  return (
    <div
      className="dv-reveal animate-dv-scale-in rounded-xl bg-navy/[0.04] px-3 py-2.5 opacity-0 transition-transform duration-300 hover:-translate-y-0.5"
      style={revealStyle(delayMs)}
    >
      <p className="text-[10px] leading-snug text-navy/55">{label}</p>
      <p className="mt-1 text-base font-medium tabular-nums text-navy">
        {animatedValue !== undefined && formatAnimated ? (
          <AnimatedNumber
            value={animatedValue}
            format={formatAnimated}
            delayMs={delayMs + 120}
          />
        ) : (
          value
        )}{" "}
        <span className="text-xs font-normal text-navy/55">{unit}</span>
      </p>
    </div>
  );
}

function GainCard({
  label,
  value,
  unit,
  highlight = false,
  delayMs = 0,
}: {
  label: string;
  value: string;
  unit: string;
  highlight?: boolean;
  delayMs?: number;
}) {
  return (
    <div
      className={cn(
        "dv-reveal animate-dv-scale-in opacity-0 transition-transform duration-300 hover:-translate-y-0.5",
        highlight
          ? "relative overflow-hidden rounded-xl border border-coral/60 bg-coral-wash px-3 py-2.5"
          : "rounded-xl bg-navy/[0.04] px-3 py-2.5",
      )}
      style={revealStyle(delayMs)}
    >
      {highlight ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent bg-[length:200%_100%] animate-dv-shine opacity-60"
        />
      ) : null}
      <p
        className={cn(
          "relative text-[11px] leading-snug",
          highlight ? "text-coral-dark" : "text-navy/55",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "relative mt-1 font-medium tabular-nums",
          highlight
            ? "text-sm text-coral sm:text-base"
            : "text-base text-navy",
        )}
      >
        {value}{" "}
        <span
          className={cn(
            "text-xs font-normal",
            highlight ? "text-coral/80" : "text-navy/55",
          )}
        >
          {unit}
        </span>
      </p>
    </div>
  );
}

export function SolarEstimateView({
  result,
  onObtainDevis,
  onBack,
  isSubmitting = false,
  primaryActionLabel = "Obtenir mon devis détaillé",
}: SolarEstimateViewProps) {
  return (
    <div className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-8 lg:overflow-hidden lg:px-10 lg:py-5 xl:px-12">
        <div className="mx-auto w-full max-w-2xl">
          <Link
            href={JOYA_MARKETING_LANDING_URL}
            className="dv-reveal animate-fade-in-up inline-block rounded-md opacity-0 transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-primary/40"
            style={revealStyle(0)}
            aria-label="Retour au site Joya Energy"
          >
            <Image src={logoBig} alt="Joya Energy" width={110} priority />
          </Link>

          <h1
            className="dv-reveal animate-fade-in-up mt-4 text-xl font-medium text-navy opacity-0"
            style={revealStyle(80)}
          >
            Votre estimation personnalisée
          </h1>
          <p
            className="dv-reveal animate-fade-in-up mt-1 max-w-lg text-xs leading-snug text-navy/60 opacity-0"
            style={revealStyle(140)}
          >
            Basée sur vos informations saisies — résultats indicatifs exprimés
            en TTC, affinés lors d&apos;une étude détaillée.
          </p>

          <p
            className="dv-reveal animate-fade-in-up mt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-coral opacity-0"
            style={revealStyle(220)}
          >
            Votre installation estimée
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <MetricCard
              label="Puissance recommandée"
              value={formatKwcValue(result.kwc)}
              unit="kWc"
              animatedValue={result.kwc}
              formatAnimated={formatKwcValue}
              delayMs={280}
            />
            <MetricCard
              label="Économies annuelles estimées"
              value={formatKwhAmount(result.ecoAnnuellesKwh)}
              unit="kWh/an"
              animatedValue={result.ecoAnnuellesKwh}
              formatAnimated={formatKwhAmount}
              delayMs={360}
            />
            <MetricCard
              label="CO₂ évité par an"
              value={formatTonnesValue(result.co2Tonnes)}
              unit="t/an"
              animatedValue={result.co2Tonnes}
              formatAnimated={formatTonnesValue}
              delayMs={440}
            />
          </div>

          <p
            className="dv-reveal animate-fade-in-up mt-4 text-[10px] font-medium uppercase tracking-[0.08em] text-coral opacity-0"
            style={revealStyle(520)}
          >
            Votre gain financier
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <GainCard
              highlight
              label="Votre redevance mensuelle Joya"
              value={formatDtPerMonthRange(
                result.redevanceBasse,
                result.redevanceHaute,
              )}
              unit="DT/mois"
              delayMs={580}
            />
            <GainCard
              highlight
              label="Votre économie nette dès le 1er mois"
              value={formatDtPerMonthRange(
                result.ecoNetteMin,
                result.ecoNetteMax,
              )}
              unit="DT/mois"
              delayMs={660}
            />
            <GainCard
              label="Durée du contrat de service"
              value="5"
              unit="ans"
              delayMs={740}
            />
            <GainCard
              label="Investissement initial"
              value="0"
              unit="DT"
              delayMs={820}
            />
          </div>

          <p
            className="dv-reveal animate-fade-in-up mt-3 border-l-2 border-navy/15 pl-2.5 text-[10px] leading-snug text-navy/45 opacity-0"
            style={revealStyle(900)}
          >
            Ces chiffres sont calculés sur la base de votre consommation
            déclarée et des données d&apos;irradiation de votre région. Cette
            estimation ne vous engage en rien — le devis définitif sera établi
            après audit technique gratuit sur site.
          </p>

          <div
            className="dv-reveal animate-fade-in-up mt-3 space-y-2 opacity-0"
            style={revealStyle(980)}
          >
            {onObtainDevis ? (
              <button
                type="button"
                onClick={() => void onObtainDevis()}
                disabled={isSubmitting}
                className="animate-dv-cta-glow inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-coral text-sm font-medium text-white transition-all hover:scale-[1.01] hover:bg-coral-dark active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    Envoi en cours…
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  </>
                ) : (
                  <>
                    {primaryActionLabel}
                    <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            ) : (
              <Link
                href="/"
                className="animate-dv-cta-glow inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-coral text-sm font-medium text-white transition-all hover:scale-[1.01] hover:bg-coral-dark active:scale-[0.99]"
              >
                Obtenir mon devis détaillé
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            )}
            <Link
              href="mailto:support@joya-energy.com"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-navy/20 bg-white text-sm text-navy/65 transition-all hover:-translate-y-0.5 hover:bg-navy/[0.03] hover:shadow-sm"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              Parler à un conseiller
            </Link>
          </div>
        </div>
      </div>

      <aside className="relative hidden min-h-0 w-[46%] shrink-0 flex-col justify-center overflow-hidden px-8 py-6 lg:flex xl:px-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <Image
            src={solarImage}
            alt=""
            fill
            className="animate-dv-ken-burns object-cover"
            sizes="46vw"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(15, 42, 68, 0.6) 0%, rgba(15, 42, 68, 0.9) 45%, #0F2A44 100%)",
            }}
          />
          <div className="animate-dv-glow-pulse absolute -right-12 top-1/4 h-64 w-64 rounded-full bg-coral/30 blur-3xl" />
          <div className="animate-bg-float-slow absolute -left-16 bottom-1/4 h-48 w-48 rounded-full bg-coral/15 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-md">
          <p
            className="dv-reveal animate-dv-slide-in-right text-[11px] font-medium uppercase tracking-[0.08em] text-coral opacity-0"
            style={revealStyle(200)}
          >
            Votre espace client
          </p>
          <h2
            className="dv-reveal animate-dv-slide-in-right mt-5 text-[26px] font-medium leading-snug text-white opacity-0"
            style={revealStyle(280)}
          >
            Tout votre projet solaire,
            <br />
            au même endroit.
          </h2>

          <ul className="mt-7 divide-y divide-white/[0.08]">
            {APP_FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className="dv-reveal animate-dv-slide-in-right flex gap-3 py-3.5 opacity-0 first:pt-0"
                  style={revealStyle(380 + index * 90)}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-coral/15 text-coral transition-transform duration-300 hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-white/50">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div
            className="dv-reveal animate-dv-scale-in mt-7 flex items-center gap-4 rounded-2xl bg-white/5 px-5 py-4 opacity-0 backdrop-blur-sm transition-colors duration-300 hover:bg-white/[0.08]"
            style={revealStyle(760)}
          >
            <BarChart3 className="h-8 w-8 shrink-0 text-coral" />
            <div>
              <p className="text-[32px] font-medium leading-none text-coral">
                {formatSavingsPercentRange(
                  SOLAR_ESTIMATE_CONSTANTS.DISPLAY_ECO_FACTURE_PERCENT_MIN,
                  SOLAR_ESTIMATE_CONSTANTS.DISPLAY_ECO_FACTURE_PERCENT_MAX,
                )}
              </p>
              <p className="mt-1 text-xs leading-snug text-white/60">
                d&apos;économies sur votre facture énergétique dès le premier
                mois de service.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
