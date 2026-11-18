"use client";

import Link from "next/link";
import { useClientSidebar } from "@/hooks/use-client-sidebar";
import { cn } from "@/lib/utils";

const MOBILE_NAV_LABELS: Record<string, string> = {
  "Tableau de bord": "Accueil",
  "Mes informations": "Infos",
  "Mes contrats": "Contrats",
  "Suivi du projet": "Suivi",
  Suivi: "Suivi",
  Intégration: "Intégration",
};

function mobileNavLabel(label: string): string {
  return MOBILE_NAV_LABELS[label] ?? label;
}

/** Floating glass tab bar (mobile only) — mirrors the landing pill navbar. */
export function ClientMobileNav() {
  const { mainNav } = useClientSidebar();

  if (mainNav.length === 0) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-nav md:hidden"
      aria-label="Navigation principale"
    >
      <div className="joya-glass flex h-16 items-stretch gap-1 rounded-3xl border border-white/70 p-1.5 shadow-joya-lg">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const inactive = item.disabled && !item.active;

          if (inactive) {
            return (
              <span
                key={item.href}
                aria-disabled="true"
                className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 text-slate-400 opacity-50"
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="max-w-full truncate text-[10.5px] font-medium">
                  {mobileNavLabel(item.label)}
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-1 transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
                item.active ? "bg-white text-navy shadow-joya-xs" : "text-slate-500 active:bg-white/60",
              )}
              aria-current={item.active ? "page" : undefined}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", item.active ? "text-coral" : "text-slate-400")}
                strokeWidth={item.active ? 2.1 : 1.75}
                aria-hidden
              />
              <span
                className={cn(
                  "max-w-full truncate text-[10.5px]",
                  item.active ? "font-semibold" : "font-medium",
                )}
              >
                {mobileNavLabel(item.label)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
