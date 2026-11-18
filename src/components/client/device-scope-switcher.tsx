"use client";

import { useMemo, type ReactNode } from "react";
import { Building2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { cn } from "@/lib/utils";
import type { DashboardInverterStatus } from "@/types/dashboard";

const STATUS_DOT: Record<DashboardInverterStatus, string> = {
  connected: "bg-success",
  degraded: "bg-warning",
  offline: "bg-slate-400",
  unknown: "bg-slate-300",
};

type DeviceScopeSwitcherProps = {
  className?: string;
  compact?: boolean;
  /** When false, hides inverter scope even on multi-inverter sites (e.g. main dashboard). */
  inverterSelectorVisible?: boolean;
};

function ScopeLabel({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "px-0.5 font-data font-medium uppercase tracking-[0.08em] text-slate-400",
        compact ? "text-[9.5px]" : "text-[10px]",
      )}
    >
      {children}
    </span>
  );
}

function ScopeDivider() {
  return <div className="my-1 w-px self-stretch bg-line" aria-hidden />;
}

function OnlineStatusBadge({
  online,
  compact,
}: {
  online: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center px-2 py-0.5",
        compact && "px-1.5",
      )}
    >
      <ScopeLabel compact={compact}>Statut</ScopeLabel>
      <span
        className={cn(
          "mt-0.5 inline-flex items-center gap-1.5 font-semibold",
          compact ? "text-[11px]" : "text-xs",
          online ? "text-success-strong" : "text-slate-600",
        )}
        title={online ? "Site en ligne" : "Site hors ligne"}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 shrink-0 rounded-full",
            online ? "bg-success shadow-[0_0_0_3px_rgb(var(--joya-success-rgb)/0.18)]" : "bg-slate-400",
          )}
          aria-hidden
        />
        {online ? "En ligne" : "Hors ligne"}
      </span>
    </div>
  );
}

export function DeviceScopeSwitcher({
  className,
  compact = false,
  inverterSelectorVisible = true,
}: DeviceScopeSwitcherProps) {
  const {
    scope,
    setScope,
    siteId,
    setSiteId,
    sites,
    activeSite,
    hasSiteContext,
    showSiteSelector,
    inverters,
    showInverterSelector,
    isReady,
    isScopeLoading,
  } = useDeviceScope();

  const showInverterScope =
    inverterSelectorVisible && showInverterSelector;
  const showSingleInverter =
    inverterSelectorVisible && !showInverterSelector && inverters.length === 1;
  const singleInverter = showSingleInverter ? inverters[0] : null;

  const siteOnline = useMemo(() => {
    if (!activeSite) return null;
    const status = (activeSite.status || "").toLowerCase();
    if (!status) {
      if (!inverters.length) return null;
      return inverters.some(
        (inv) => inv.status === "connected" || inv.status === "degraded",
      );
    }
    if (
      status === "online" ||
      status === "active" ||
      status === "connected" ||
      status === "en_ligne"
    ) {
      return true;
    }
    if (
      status === "offline" ||
      status === "inactive" ||
      status === "hors_ligne"
    ) {
      return false;
    }
    if (inverters.length) {
      return inverters.some(
        (inv) => inv.status === "connected" || inv.status === "degraded",
      );
    }
    return null;
  }, [activeSite, inverters]);

  if (!isReady) {
    return null;
  }

  if (!hasSiteContext && !showInverterScope && !showSingleInverter) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex min-w-0 max-w-full items-stretch gap-0.5 overflow-hidden rounded-2xl border border-line bg-white px-1.5 py-1 shadow-joya-xs",
        className,
      )}
    >
      {hasSiteContext ? (
        <div
          className={cn(
            "flex min-w-0 flex-col justify-center px-2 py-0.5",
            compact ? "max-w-[10rem] sm:max-w-[13rem]" : "max-w-[14rem]",
          )}
        >
          <ScopeLabel compact={compact}>Site</ScopeLabel>
          {showSiteSelector ? (
            <Select
              value={siteId ?? sites[0]?.id}
              onValueChange={setSiteId}
              disabled={isScopeLoading}
            >
              <SelectTrigger
                aria-label="Sélectionner un site"
                className={cn(
                  "mt-0.5 h-7 min-w-0 gap-1 rounded-md border-0 bg-transparent p-0 text-sm font-semibold text-navy shadow-none hover:border-0 focus-visible:ring-2 focus-visible:ring-coral/30 data-[state=open]:ring-0 [&>span]:min-w-0 [&>span]:truncate",
                  compact && "h-7 text-xs",
                )}
              >
                <SelectValue placeholder="Choisir un site" />
              </SelectTrigger>
              <SelectContent align="start">
                {sites.map((site) => (
                  <SelectItem
                    key={site.id}
                    value={site.id}
                    textValue={site.name}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Building2
                        className="h-3.5 w-3.5 shrink-0 text-slate-500"
                        aria-hidden
                      />
                      <span>{site.name}</span>
                      <span className="text-xs text-slate-400">
                        ({site.inverterCount} onduleur
                        {site.inverterCount > 1 ? "s" : ""})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p
              className={cn(
                "mt-0.5 inline-flex min-w-0 items-center gap-1.5 font-semibold text-navy",
                compact ? "text-xs" : "text-sm",
              )}
              title={activeSite?.name}
            >
              <Building2
                className="h-3.5 w-3.5 shrink-0 text-coral"
                aria-hidden
              />
              <span className="truncate">
                {activeSite?.name ?? "Installation"}
              </span>
            </p>
          )}
        </div>
      ) : null}

      {hasSiteContext && siteOnline != null ? (
        <>
          <ScopeDivider />
          <OnlineStatusBadge online={siteOnline} compact={compact} />
        </>
      ) : null}

      {hasSiteContext && (showInverterScope || singleInverter) ? (
        <ScopeDivider />
      ) : null}

      {showInverterScope ? (
        <div
          className={cn(
            "flex min-w-0 flex-col justify-center px-2 py-0.5",
            compact ? "max-w-[9rem] sm:max-w-[12rem]" : "max-w-[14rem]",
          )}
        >
          <ScopeLabel compact={compact}>Onduleur</ScopeLabel>
          <Select
            value={
              scope === "all" || inverters.some((inverter) => inverter.id === scope)
                ? scope
                : "all"
            }
            onValueChange={setScope}
            disabled={isScopeLoading}
          >
            <SelectTrigger
              aria-label="Sélectionner un onduleur du site"
              aria-busy={isScopeLoading}
              className={cn(
                "mt-0.5 h-7 min-w-0 gap-1 rounded-md border-0 bg-transparent p-0 text-sm font-medium text-navy shadow-none hover:border-0 focus-visible:ring-2 focus-visible:ring-coral/30 data-[state=open]:ring-0 [&>span]:min-w-0 [&>span]:truncate",
                compact && "h-7 text-xs",
                isScopeLoading && "opacity-80",
              )}
            >
              <SelectValue placeholder="Vue onduleur" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="all" textValue="Tous les onduleurs du site">
                Tous les onduleurs du site
              </SelectItem>
              {inverters.map((inverter) => (
                <SelectItem
                  key={inverter.id}
                  value={inverter.id}
                  textValue={inverter.name}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        STATUS_DOT[inverter.status] ?? STATUS_DOT.unknown,
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{inverter.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : singleInverter ? (
        <div
          className={cn(
            "flex min-w-0 flex-col justify-center px-2 py-0.5",
            compact ? "max-w-[9rem] sm:max-w-[12rem]" : "max-w-[14rem]",
          )}
        >
          <ScopeLabel compact={compact}>Onduleur</ScopeLabel>
          <p
            className={cn(
              "mt-0.5 inline-flex min-w-0 items-center gap-1.5 font-medium text-navy",
              compact ? "text-xs" : "text-sm",
            )}
            title={singleInverter.name}
          >
            <span
              className={cn(
                "h-2 w-2 shrink-0 rounded-full",
                STATUS_DOT[singleInverter.status] ?? STATUS_DOT.unknown,
              )}
              aria-hidden
            />
            <span className="truncate">{singleInverter.name}</span>
          </p>
        </div>
      ) : null}

      {isScopeLoading ? (
        <Loader2
          className="my-auto ml-1 h-4 w-4 shrink-0 animate-spin self-center text-coral"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
