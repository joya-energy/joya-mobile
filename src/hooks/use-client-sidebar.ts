"use client";

import {
  ClipboardList,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useClientJourney } from "@/contexts/client-journey-context";
import {
  getRoleAwareHomePath,
  isManager,
  isTechnicalReferent,
} from "@/lib/auth/roles";
import type { ClientJourneyPhase } from "@/lib/journey/types";

export type SidebarNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  badge?: number;
  disabled?: boolean;
  hidden?: boolean;
};

function navItem(
  label: string,
  href: string,
  icon: LucideIcon,
  pathname: string,
): SidebarNavItem {
  const active =
    href === "/client"
      ? pathname === "/client"
      : pathname === href || pathname.startsWith(`${href}/`);
  return { label, href, icon, active };
}

function buildMainNav(
  pathname: string,
  phase: ClientJourneyPhase | null,
  role?: string | null,
): SidebarNavItem[] {
  if (isTechnicalReferent(role) || !isManager(role)) {
    return [
      navItem("Tableau de bord", "/client", LayoutDashboard, pathname),
      navItem("Suivi", "/client/monitoring", Zap, pathname),
      navItem("Consommation", "/client/consumption", Gauge, pathname),
    ];
  }

  if (phase === "follow_up") {
    return [
      navItem("Suivi du projet", "/client/follow-up", ListChecks, pathname),
      navItem("Mes informations", "/client/informations", FolderOpen, pathname),
    ];
  }

  if (phase === "dashboard") {
    return [
      navItem("Tableau de bord", "/client", LayoutDashboard, pathname),
      navItem("Suivi", "/client/monitoring", Zap, pathname),
      navItem("Consommation", "/client/consumption", Gauge, pathname),
      navItem("Mes informations", "/client/informations", FolderOpen, pathname),
    ];
  }

  if (phase === "onboarding" || phase === "pending_review") {
    return [
      navItem("Intégration", "/client/onboarding", ClipboardList, pathname),
    ];
  }

  // welcome and fallback
  return [navItem("Tableau de bord", "/client", LayoutDashboard, pathname)];
}

function buildFooterNav(phase: ClientJourneyPhase | null): SidebarNavItem[] {
  const logout: SidebarNavItem = {
    label: "Déconnexion",
    href: "/auth/login",
    icon: LogOut,
    active: false,
  };

  // Notifications hidden for follow_up and dashboard (for now)
  if (phase === "follow_up" || phase === "dashboard") {
    return [logout];
  }

  return [logout];
}

export function useClientSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { phase } = useClientJourney();
  const role = user?.role;

  const homeHref = getRoleAwareHomePath(role, phase);

  return {
    mainNav: buildMainNav(pathname, phase, role).filter((item) => !item.hidden),
    footerNav: buildFooterNav(phase),
    homeHref,
    phase,
  };
}
