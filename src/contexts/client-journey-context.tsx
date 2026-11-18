"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { journeyApi } from "@/lib/journey/api";
import { getRoleAwareHomePath, isInstaller, isTechnicalReferent } from "@/lib/auth/roles";
import { subscribeAppRefresh } from "@/lib/realtime/app-refresh";
import {
  isPathAllowedForPhase,
  showAppShell,
} from "@/lib/journey/routing";
import type { ClientJourneyPhase, ClientJourneyResponse } from "@/lib/journey/types";

type ClientJourneyContextType = {
  journey: ClientJourneyResponse | null;
  isLoading: boolean;
  refetchJourney: () => Promise<ClientJourneyResponse | null>;
  phase: ClientJourneyPhase | null;
  showShell: boolean;
};

const ClientJourneyContext = createContext<ClientJourneyContextType | undefined>(
  undefined,
);

export function ClientJourneyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;
  const [journey, setJourney] = useState<ClientJourneyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchJourney = useCallback(async () => {
    try {
      const data = await journeyApi.getJourney();
      setJourney(data);
      return data;
    } catch {
      setJourney(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      await refetchJourney();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refetchJourney]);

  useEffect(() => {
    return subscribeAppRefresh("journey", () => {
      void refetchJourney();
    });
  }, [refetchJourney]);

  const phase = journey?.phase ?? null;
  const showShell =
    isTechnicalReferent(role) || (phase ? showAppShell(phase) : false);

  useEffect(() => {
    if (isLoading || !journey || !pathname?.startsWith("/client")) return;

    if (isInstaller(role)) {
      router.replace("/installateur");
      return;
    }

    if (!isPathAllowedForPhase(pathname, journey.phase, role)) {
      router.replace(getRoleAwareHomePath(role, journey.phase));
    }
  }, [isLoading, journey, pathname, role, router]);

  const value = useMemo(
    () => ({
      journey,
      isLoading,
      refetchJourney,
      phase,
      showShell,
    }),
    [journey, isLoading, refetchJourney, phase, showShell],
  );

  return (
    <ClientJourneyContext.Provider value={value}>
      {children}
    </ClientJourneyContext.Provider>
  );
}

export function useClientJourney() {
  const ctx = useContext(ClientJourneyContext);
  if (!ctx) {
    throw new Error("useClientJourney must be used within ClientJourneyProvider");
  }
  return ctx;
}
