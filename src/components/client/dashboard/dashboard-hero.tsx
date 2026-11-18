"use client";

import { CalendarDays, Clock3, Gauge, MapPin } from "lucide-react";
import type { ReactNode } from "react";
import type { ClientDashboardSite } from "@/types/dashboard";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { useAuth } from "@/contexts/auth-context";
import { CountUp } from "@/components/joya/count-up";

const SITE_STATUS: Record<ClientDashboardSite["status"], { label: string; dot: string }> = {
  online: { label: "Installation en ligne", dot: "bg-[#4ade80]" },
  offline: { label: "Installation hors ligne", dot: "bg-danger" },
  maintenance: { label: "Maintenance en cours", dot: "bg-warning" },
};

function present(value: string | undefined | null): value is string {
  const trimmed = value?.trim();
  return Boolean(trimmed) && trimmed !== CLIENT_DASHBOARD_MISSING;
}

function GlassChip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-pill border border-white/20 bg-white/10 py-1 pl-2.5 pr-3 text-[12px] text-cream/85 backdrop-blur-md sm:gap-2 sm:py-1.5 sm:pl-3 sm:pr-3.5 sm:text-[12.5px]">
      <span className="text-coral-tint [&_svg]:h-3.5 [&_svg]:w-3.5" aria-hidden>
        {icon}
      </span>
      <span className="truncate">{children}</span>
    </span>
  );
}

type DashboardHeroProps = {
  site: ClientDashboardSite;
  dailySavingsValue: string;
  actions?: ReactNode;
};

/**
 * Dashboard opener in the landing hero language: solar photo, navy scrim,
 * big Archivo headline, live production figure, glass chips, ambient glow.
 */
export function DashboardHero({
  site,
  dailySavingsValue,
  actions,
}: DashboardHeroProps) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0];
  const status = SITE_STATUS[site.status] ?? SITE_STATUS.online;
  const location = present(site.siteLocation)
    ? site.siteLocation
    : present(site.addressLine)
      ? site.addressLine
      : null;

  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-navy-dark text-cream shadow-joya-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/images/installer-hand-on-solar-panel-sunset.jpg"
        alt=""
        className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-70 motion-safe:animate-dv-ken-burns"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(15_42_68/0.94)_0%,rgb(15_42_68/0.78)_42%,rgb(15_42_68/0.25)_100%)]"
      />
      <div aria-hidden className="joya-glow absolute -bottom-24 -left-16 -z-10 h-72 w-72 rounded-full bg-coral/30 blur-3xl" />
      <div aria-hidden className="joya-glow absolute -right-10 -top-24 -z-10 h-64 w-64 rounded-full bg-blue/30 blur-3xl [animation-delay:-3s]" />

      <div className="grid gap-4 p-5 sm:gap-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end lg:p-10">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 font-data text-[11.5px] uppercase tracking-[0.1em] text-coral-tint">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
              {firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-pill border border-white/20 bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold backdrop-blur-md">
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-70 ${status.dot}`} />
                <span className={`relative inline-flex h-2 w-2 rounded-full ${status.dot}`} />
              </span>
              {status.label}
            </span>
          </div>

          <h1 className="mt-3 font-display text-[clamp(1.75rem,1.3rem+2.4vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-cream text-balance sm:mt-4">
            {present(site.siteName) ? site.siteName : "Mon installation"}
          </h1>
          {location ? (
            <p className="mt-2 flex min-w-0 items-center gap-1.5 text-[14px] text-cream/75 sm:mt-3 sm:text-[15px]">
              <MapPin className="h-4 w-4 shrink-0 text-coral-tint" aria-hidden />
              <span className="truncate">{location}</span>
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
            {present(site.installedCapacityLabel) ? (
              <GlassChip icon={<Gauge />}>{site.installedCapacityLabel}</GlassChip>
            ) : null}
            {present(site.dayLabel) ? (
              <span className="hidden sm:contents">
                <GlassChip icon={<CalendarDays />}>{site.dayLabel}</GlassChip>
              </span>
            ) : null}
            {present(site.lastUpdatedAt) ? (
              <GlassChip icon={<Clock3 />}>Mis à jour {site.lastUpdatedAt}</GlassChip>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl sm:block sm:p-5 lg:min-w-[15rem]">
          <p className="min-w-0 font-data text-[10.5px] uppercase tracking-[0.1em] text-cream/70 sm:text-[11px]">
            Économie financière journalière
          </p>
          <p className="shrink-0 font-display text-[1.75rem] font-extrabold leading-none tracking-[-0.04em] text-coral sm:mt-2 sm:text-[2.6rem]">
            <CountUp text={dailySavingsValue} />
          </p>
          <p className="mt-2 hidden text-[12.5px] text-cream/70 sm:block">
            Basée sur la production d&apos;aujourd&apos;hui
          </p>
        </div>
      </div>

      {actions ? <div className="absolute right-4 top-4 flex items-center gap-2 sm:right-6 sm:top-6">{actions}</div> : null}
    </section>
  );
}
