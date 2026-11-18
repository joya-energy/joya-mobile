"use client";

import { useCallback, useEffect, useState } from "react";
import { useClientJourney } from "@/contexts/client-journey-context";
import {
  fetchOnboardingSummary,
  type OnboardingSummary,
} from "@/lib/onboarding/fetch-onboarding-summary";

export function useOnboardingSummary() {
  const { journey } = useClientJourney();
  const companyId = journey?.companyId ?? null;
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setSummary(null);
      setLoading(false);
      setError("Aucune entreprise associée à ce compte.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSummary(await fetchOnboardingSummary(companyId));
    } catch {
      setSummary(null);
      setError("Impossible de charger vos informations.");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { summary, loading, error, reload: load, companyId };
}
