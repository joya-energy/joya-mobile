"use client";

import { useState } from "react";
import ClientSidebar from "@/components/client/sidebar";
import ClientHeader from "@/components/client/header";
import { ClientMobileNav } from "@/components/client/client-mobile-nav";
import { useClientJourney } from "@/contexts/client-journey-context";
import { JoyaLoadingState } from "@/components/joya";
import { RevealObserver } from "@/components/joya/reveal-observer";
import { ImpersonationBanner } from "@/components/auth/impersonation-banner";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isLoading, showShell } = useClientJourney();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream">
        <JoyaLoadingState label="Préparation de votre espace Joya…" />
      </div>
    );
  }

  if (!showShell) {
    return (
      <div className="min-h-dvh w-full bg-cream">
        <ImpersonationBanner />
        {children}
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-cream">
      <ImpersonationBanner />
      <div className="flex min-h-0 flex-1">
        <a
          href="#joya-main"
          className="sr-only z-toast rounded-br-md bg-navy px-4 py-3 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-0 focus:top-0"
        >
          Aller au contenu
        </a>
        <ClientSidebar
          mobileOpen={mobileMenuOpen}
          onMobileOpenChange={setMobileMenuOpen}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <ClientHeader onMenuOpen={() => setMobileMenuOpen(true)} />
          <main
            id="joya-main"
            className="mx-auto w-full max-w-content flex-1 px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-7"
          >
            {children}
          </main>
          <ClientMobileNav />
          <RevealObserver />
        </div>
      </div>
    </div>
  );
}
