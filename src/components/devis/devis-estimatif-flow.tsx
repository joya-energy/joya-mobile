"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SolarEstimateView } from "@/components/landing/solar-estimate-view";
import { computeSolarEstimate } from "@/lib/landing/solar-estimate";
import {
  readPasswordSetupToken,
  storePasswordSetupToken,
} from "@/lib/auth/signup-flow";

export function DevisEstimatifFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const factureParam = Number(searchParams.get("facture"));
  const facture =
    Number.isFinite(factureParam) && factureParam > 0 ? factureParam : 900;
  const email = searchParams.get("email")?.trim() || null;
  const tokenFromQuery = searchParams.get("token")?.trim() || null;
  const result = computeSolarEstimate(facture);

  const handleContinue = () => {
    const token = tokenFromQuery || readPasswordSetupToken();
    if (tokenFromQuery) {
      storePasswordSetupToken(tokenFromQuery);
    }

    const params = new URLSearchParams({ next: "approval" });
    if (email) {
      params.set("email", email);
    }
    if (token) {
      params.set("token", token);
    }
    router.push(`/auth/create-password?${params.toString()}`);
  };

  return (
    <SolarEstimateView
      result={result}
      onObtainDevis={handleContinue}
      primaryActionLabel="Obtenir mon devis détaillé"
    />
  );
}
