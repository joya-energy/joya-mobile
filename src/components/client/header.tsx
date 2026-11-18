"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import ProfileHeader from "./ProfileHeader";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { DeviceScopeSwitcher } from "@/components/client/device-scope-switcher";
import { useClientSidebar } from "@/hooks/use-client-sidebar";
import { JoyaLogo } from "@/components/joya";

type ClientHeaderProps = {
  onMenuOpen?: () => void;
};

/** Secondary pages that are not in the main nav but deserve a context label. */
const EXTRA_CONTEXT: Array<[prefix: string, label: string]> = [
  ["/client/alerts", "Notifications"],
  ["/client/profile", "Mon profil"],
  ["/client/bills", "Factures"],
  ["/client/contracts", "Mes contrats"],
  ["/client/welcome", "Bienvenue"],
];

export default function ClientHeader({ onMenuOpen }: ClientHeaderProps) {
  const pathname = usePathname() ?? "";
  const { mainNav, homeHref } = useClientSidebar();
  const inverterSelectorVisible = pathname.startsWith("/client/monitoring");
  const contextLabel =
    mainNav.find((item) => item.active)?.label ??
    EXTRA_CONTEXT.find(([prefix]) => pathname.startsWith(prefix))?.[1];

  return (
    <header className="joya-glass sticky top-0 z-sticky flex h-header w-full items-center gap-3 border-b border-line px-4 sm:px-6 md:px-8">
      {onMenuOpen ? (
        <button
          type="button"
          onClick={onMenuOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-navy shadow-joya-xs transition-colors hover:border-line-strong md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      ) : null}

      <Link href={homeHref} className="shrink-0 md:hidden" aria-label="Joya Energy — accueil">
        <JoyaLogo variant="mark" height={32} />
      </Link>

      {contextLabel ? (
        <div className="hidden min-w-0 shrink-0 lg:block">
          <p className="font-data text-[10.5px] uppercase tracking-[0.1em] text-slate-400">
            Espace client
          </p>
          <p className="truncate font-display text-[15px] font-semibold leading-tight text-navy">
            {contextLabel}
          </p>
        </div>
      ) : null}

      {contextLabel ? (
        <span className="hidden h-8 w-px shrink-0 bg-line lg:block" aria-hidden />
      ) : null}

      <div className="flex min-w-0 flex-1 items-center">
        <DeviceScopeSwitcher compact inverterSelectorVisible={inverterSelectorVisible} />
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <NotificationBell inboxHref="/client/alerts" />
        <ProfileHeader />
      </div>
    </header>
  );
}
