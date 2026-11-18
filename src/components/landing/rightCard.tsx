"use client";

import Image from "next/image";
import { CheckCircle2, BarChart3, Wrench } from "lucide-react";
import solarImage from "@/assets/solar-commercial.jpg";

export type LandingHeroMode = "client" | "installateur";

const clientBullets = [
  "Jusqu'à 30 % de réduction sur votre facture d'électricité",
  "Aucun investissement initial",
  "Installation entièrement gérée",
  "Plateforme de suivi en temps réel",
];

const installateurBullets = [
  "Soumettez des dossiers clients en quelques minutes",
  "Suivi centralisé de vos projets solaires",
  "Invitation client par e-mail ou WhatsApp",
  "Partenaire du réseau Joya Energy",
];

type RightCardProps = {
  mode?: LandingHeroMode;
};

export function RightCard({ mode = "client" }: RightCardProps) {
  const isInstallateur = mode === "installateur";
  const bullets = isInstallateur ? installateurBullets : clientBullets;

  return (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div key={`hero-${mode}`} className="absolute inset-0 animate-step-enter">
          {isInstallateur ? (
            <Image
              src="/installateurs-hero.jpg"
              alt="Installateurs solaires partenaires Joya Energy"
              className="h-full w-full object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
            />
          ) : (
            <Image
              src={solarImage}
              alt="Panneaux solaires sur bâtiment commercial"
              className="h-full w-full object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 600px, 100vw"
            />
          )}
          <div
            className="absolute inset-0 z-[1] opacity-90"
            style={{
              background:
                "linear-gradient(180deg, rgba(15, 42, 68, 0.62) 0%, rgba(15, 42, 68, 0.78) 55%, #0F2A44 100%)",
            }}
          />
        </div>
      </div>

      <div
        key={`copy-${mode}`}
        className="relative z-10 flex h-full min-h-[400px] flex-col justify-between px-6 py-8 animate-step-enter sm:px-8 sm:py-10 lg:px-10 lg:py-12 xl:px-14"
      >
        <div />

        <div className="space-y-6 sm:space-y-8">
          <h2
            className="max-w-md font-display text-2xl font-bold leading-tight text-primary-foreground animate-fade-in-up sm:text-3xl xl:text-4xl"
            style={{ animationDelay: "0.1s", opacity: 0 }}
          >
            {isInstallateur
              ? "Développez votre activité solaire avec Joya"
              : "Passez au solaire sans investissement initial"}
          </h2>
          <p
            className="max-w-sm text-sm leading-relaxed text-primary-foreground/85 animate-fade-in-up sm:text-base"
            style={{ animationDelay: "0.15s", opacity: 0 }}
          >
            {isInstallateur
              ? "• Créez votre compte partenaire, déposez des dossiers et accompagnez vos clients jusqu'à la mise en service."
              : "• JOYA Energy finance, installe et gère votre installation solaire. Votre entreprise paie simplement l'économie énergétique réalisée, à un prix inférieur à celui du réseau."}
          </p>

          <ul className="space-y-2.5 sm:space-y-3">
            {bullets.map((item, i) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-primary-foreground/90 animate-fade-in-up"
                style={{
                  animationDelay: `${0.2 + i * 0.05}s`,
                  opacity: 0,
                }}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-coral sm:h-5 sm:w-5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div
            className="max-w-xs rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 backdrop-blur-sm animate-fade-in-up sm:p-5"
            style={{ animationDelay: "0.45s", opacity: 0 }}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral/20 sm:h-12 sm:w-12">
                {isInstallateur ? (
                  <Wrench className="h-5 w-5 text-coral sm:h-6 sm:w-6" />
                ) : (
                  <BarChart3 className="h-5 w-5 text-coral sm:h-6 sm:w-6" />
                )}
              </div>
              <div>
                {isInstallateur ? (
                  <>
                    <p className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
                      Partenaire
                    </p>
                    <p className="text-xs text-primary-foreground/70 sm:text-sm">
                      Accès dédié installateurs Joya Energy
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl font-bold text-primary-foreground sm:text-3xl">
                      72%
                    </p>
                    <p className="text-xs text-primary-foreground/70 sm:text-sm">
                      d&apos;économies potentielles sur 25 ans
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <p
          className="mt-6 border-t border-primary-foreground/10 pt-4 text-xs text-primary-foreground/50 animate-fade-in"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          © {new Date().getFullYear()} JOYA Energy. Tous droits réservés.
        </p>
      </div>
    </>
  );
}
