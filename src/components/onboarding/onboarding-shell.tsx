"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import { brand } from "@/lib/onboarding/theme";
import { OnboardingProgressHeader } from "@/components/onboarding/onboarding-progress-header";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useOnboardingContext } from "@/contexts/onboarding-context";
import { JoyaLogo } from "@/components/joya";
import { cn } from "@/lib/utils";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  const { progressHidden } = useOnboardingContext();
  const isCompact = progressHidden;

  return (
    <div className={cn(brand.pageBg, isCompact && "flex min-h-dvh flex-col")}>
      <div className={brand.orbPrimary} aria-hidden />
      <div className={brand.orbSecondary} aria-hidden />
      <div className={brand.orbTertiary} aria-hidden />

      <div
        className={cn(
          "relative mx-auto w-full max-w-5xl flex-1 flex-col px-4 sm:px-6 lg:px-8",
          isCompact ? "flex min-h-0 py-3 md:py-4" : "py-6 md:py-8",
        )}
      >
        <div
          className={cn(
            "joya-glass flex shrink-0 items-center justify-between gap-3 rounded-pill border border-white/70 py-2 pl-5 pr-2 shadow-joya-sm animate-in fade-in duration-500",
            isCompact ? "mb-3" : "mb-8",
          )}
        >
          <Link
            href="/client/welcome"
            className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            aria-label="Joya Energy — accueil"
          >
            <JoyaLogo height={isCompact ? 26 : 30} priority />
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden font-data text-[11px] uppercase tracking-[0.08em] text-slate-500 sm:block">
              Dossier d&apos;intégration
            </p>
            <NotificationBell inboxHref="/client/alerts" />
          </div>
        </div>

        <OnboardingProgressHeader />

        <main
          className={cn(
            isCompact ? "flex min-h-0 flex-1 flex-col justify-center" : "",
          )}
        >
          {children}
        </main>

        <p
          className={cn(
            "flex shrink-0 items-center justify-center gap-1.5 text-center text-ink-faint",
            isCompact ? "mt-3 pt-2 text-[11px] leading-snug" : "mt-10 text-[13px]",
          )}
        >
          <LifeBuoy className="h-3.5 w-3.5 text-coral" aria-hidden />
          Besoin d&apos;aide ?{" "}
          <a
            href="mailto:hello@joya-energy.com"
            className="font-semibold text-coral-dark underline-offset-4 hover:underline"
          >
            hello@joya-energy.com
          </a>
        </p>
      </div>
    </div>
  );
}
