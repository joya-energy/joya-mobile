"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clientDashboardApi } from "@/lib/dashboard/api";
import type { DashboardInverter, DashboardScopeSite } from "@/types/dashboard";
import {
  pickDefaultDeviceScope,
  readStoredDeviceScope,
  readStoredSiteScope,
  scopeToAssetId,
  writeStoredDeviceScope,
  writeStoredSiteScope,
  type DeviceScope,
} from "@/lib/device-scope/storage";
import { resolveScopeSites } from "@/lib/device-scope/resolve-scope-sites";

type DeviceScopeContextValue = {
  scope: DeviceScope;
  setScope: (scope: DeviceScope) => void;
  assetId: string | undefined;
  siteId: string | undefined;
  setSiteId: (siteId: string) => void;
  sites: DashboardScopeSite[];
  activeSite: DashboardScopeSite | null;
  hasSiteContext: boolean;
  showSiteSelector: boolean;
  /** @deprecated Use showSiteSelector */
  showSiteSwitcher: boolean;
  inverters: DashboardInverter[];
  showInverterSelector: boolean;
  /** @deprecated Use showInverterSelector */
  showSwitcher: boolean;
  isReady: boolean;
  isScopeLoading: boolean;
  beginScopeLoad: () => void;
  endScopeLoad: () => void;
  refreshScope: () => void;
};

const DeviceScopeContext = createContext<DeviceScopeContextValue | undefined>(
  undefined,
);

export type DeviceScopeProviderProps = {
  children: ReactNode;
  companyId?: string;
};

export function DeviceScopeProvider({
  children,
  companyId,
}: DeviceScopeProviderProps) {
  const [scope, setScopeState] = useState<DeviceScope>("all");
  const [siteId, setSiteIdState] = useState<string | undefined>(undefined);
  const [sites, setSites] = useState<DashboardScopeSite[]>([]);
  const [inverters, setInverters] = useState<DashboardInverter[]>([]);
  const [registeredCompanyId, setRegisteredCompanyId] = useState<
    string | undefined
  >(companyId);
  const [isReady, setIsReady] = useState(false);
  const [scopeLoadCount, setScopeLoadCount] = useState(0);
  const [scopeRefreshToken, setScopeRefreshToken] = useState(0);

  const refreshScope = useCallback(() => {
    setScopeRefreshToken((token) => token + 1);
  }, []);

  const beginScopeLoad = useCallback(() => {
    setScopeLoadCount((count) => count + 1);
  }, []);

  const endScopeLoad = useCallback(() => {
    setScopeLoadCount((count) => Math.max(0, count - 1));
  }, []);

  const registerInverters = useCallback(
    (
      nextInverters: DashboardInverter[],
      nextSites: DashboardScopeSite[],
      resolvedSiteId: string | null,
      nextCompanyId?: string,
      fallbackSiteName?: string | null,
    ) => {
      const resolvedCompanyId = nextCompanyId ?? companyId;
      const resolvedSites = resolveScopeSites(
        nextSites,
        resolvedSiteId,
        nextInverters.length,
        fallbackSiteName,
      );
      setRegisteredCompanyId(resolvedCompanyId);
      setInverters(nextInverters);
      setSites((prev) => {
        const merged = new Map<string, DashboardScopeSite>();
        for (const site of [...prev, ...resolvedSites]) {
          merged.set(site.id, site);
        }
        return [...merged.values()].sort((a, b) =>
          a.name.localeCompare(b.name, "fr"),
        );
      });

      const storedSiteId = readStoredSiteScope(resolvedCompanyId);
      const storedSite = storedSiteId
        ? resolvedSites.find((site) => site.id === storedSiteId)
        : undefined;
      const siteWithInverters = [...resolvedSites]
        .filter((site) => site.inverterCount > 0)
        .sort((a, b) => b.inverterCount - a.inverterCount)[0];

      let activeSiteId = resolvedSiteId ?? undefined;
      if (storedSite && storedSite.inverterCount > 0) {
        activeSiteId = storedSite.id;
      } else if (siteWithInverters) {
        activeSiteId = siteWithInverters.id;
      } else if (resolvedSites.length === 1) {
        activeSiteId = resolvedSites[0].id;
      } else if (!activeSiteId) {
        activeSiteId = resolvedSites[0]?.id;
      }
      setSiteIdState(activeSiteId);

      if (nextInverters.length <= 1) {
        const onlyId = nextInverters[0]?.id ?? "all";
        setScopeState(onlyId);
        setIsReady(true);
        return;
      }

      const stored = readStoredDeviceScope(resolvedCompanyId);
      const storedValid =
        stored === "all" ||
        (stored != null && nextInverters.some((inverter) => inverter.id === stored));

      setScopeState(
        storedValid && stored != null
          ? stored
          : pickDefaultDeviceScope(nextInverters),
      );
      setIsReady(true);
    },
    [companyId],
  );

  const setScope = useCallback(
    (nextScope: DeviceScope) => {
      setScopeState(nextScope);
      writeStoredDeviceScope(nextScope, registeredCompanyId ?? companyId);
    },
    [companyId, registeredCompanyId],
  );

  const setSiteId = useCallback(
    (nextSiteId: string) => {
      setSiteIdState(nextSiteId);
      writeStoredSiteScope(nextSiteId, registeredCompanyId ?? companyId);
      setScopeState("all");
      writeStoredDeviceScope("all", registeredCompanyId ?? companyId);
    },
    [companyId, registeredCompanyId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInverters() {
      try {
        const data = await clientDashboardApi.fetch({
          companyId,
          siteId,
        });
        if (!cancelled) {
          registerInverters(
            data.inverters,
            data.scopeSites,
            data.scopeSiteId,
            companyId,
            data.site.siteName,
          );
        }
      } catch {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void loadInverters();
    return () => {
      cancelled = true;
    };
  }, [companyId, registerInverters, siteId, scopeRefreshToken]);

  const activeSite = useMemo(() => {
    if (siteId) {
      return sites.find((site) => site.id === siteId) ?? sites[0] ?? null;
    }
    return sites[0] ?? null;
  }, [siteId, sites]);

  const value = useMemo<DeviceScopeContextValue>(
    () => ({
      scope,
      setScope,
      assetId: scopeToAssetId(scope),
      siteId,
      setSiteId,
      sites,
      activeSite,
      hasSiteContext: sites.length > 0,
      showSiteSelector: sites.length > 1,
      showSiteSwitcher: sites.length > 1,
      inverters,
      showInverterSelector: inverters.length > 1,
      showSwitcher: inverters.length > 1,
      isReady,
      isScopeLoading: scopeLoadCount > 0,
      beginScopeLoad,
      endScopeLoad,
      refreshScope,
    }),
    [
      scope,
      setScope,
      siteId,
      setSiteId,
      sites,
      activeSite,
      inverters,
      isReady,
      scopeLoadCount,
      beginScopeLoad,
      endScopeLoad,
      refreshScope,
    ],
  );

  return (
    <DeviceScopeContext.Provider value={value}>
      {children}
    </DeviceScopeContext.Provider>
  );
}

export function useDeviceScope(): DeviceScopeContextValue {
  const ctx = useContext(DeviceScopeContext);
  if (!ctx) {
    throw new Error("useDeviceScope must be used within DeviceScopeProvider");
  }
  return ctx;
}

export function useOptionalDeviceScope(): DeviceScopeContextValue | null {
  return useContext(DeviceScopeContext) ?? null;
}
