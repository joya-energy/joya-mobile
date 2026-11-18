"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronsLeft, ChevronsRight, LogOut, X } from "lucide-react";
import { useClientSidebar } from "@/hooks/use-client-sidebar";
import type { SidebarNavItem } from "@/hooks/use-client-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { getRoleLabel } from "@/lib/auth/roles";
import { useResolvedAvatarUrl } from "@/hooks/use-resolved-avatar-url";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { JoyaLogo } from "@/components/joya";
import { cn } from "@/lib/utils";

const COLLAPSED_STORAGE_KEY = "joya.sidebar.collapsed";

type ClientSidebarProps = {
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
};

export default function ClientSidebar({
  mobileOpen = false,
  onMobileOpenChange,
}: ClientSidebarProps) {
  const { mainNav, homeHref } = useClientSidebar();
  const [collapsed, setCollapsed] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Restore the user's preference after mount (avoids hydration mismatch).
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => onMobileOpenChange?.(false), [onMobileOpenChange]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", onKey);
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, closeMobile]);

  return (
    <>
      {/* ── Mobile drawer ───────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-overlay bg-navy-deep/40 backdrop-blur-[2px] transition-opacity duration-base md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobile}
        aria-hidden
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        aria-hidden={!mobileOpen}
        /* React 18 typings lack `inert`; keeps hidden drawer links out of the tab order. */
        {...({ inert: mobileOpen ? undefined : true } as Record<string, unknown>)}
        className={cn(
          "fixed inset-y-0 left-0 z-overlay flex w-[min(86vw,320px)] flex-col border-r border-line bg-cream shadow-joya-lg transition-transform duration-slow ease-joya md:hidden",
          mobileOpen ? "translate-x-0" : "pointer-events-none -translate-x-full",
        )}
      >
        <div className="flex h-header shrink-0 items-center justify-between gap-3 border-b border-line px-5">
          <Link href={homeHref} onClick={closeMobile} aria-label="Joya Energy — accueil">
            <JoyaLogo height={30} priority />
          </Link>
          <button
            type="button"
            onClick={closeMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-navy/[0.05] hover:text-navy"
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <SidebarBody items={mainNav} collapsed={false} onNavigate={closeMobile} />
      </div>

      {/* ── Desktop rail ────────────────────────────── */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-white/75 backdrop-blur-sm transition-[width] duration-slow ease-joya md:flex",
          collapsed ? "w-sidebar-collapsed" : "w-sidebar",
        )}
        aria-label="Navigation latérale"
      >
        <div
          className={cn(
            "flex h-header shrink-0 items-center border-b border-line",
            collapsed ? "justify-center px-3" : "justify-between px-5",
          )}
        >
          <Link
            href={homeHref}
            aria-label="Joya Energy — accueil"
            className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
          >
            {collapsed ? (
              <JoyaLogo variant="mark" height={38} priority />
            ) : (
              <JoyaLogo height={32} priority />
            )}
          </Link>
          {!collapsed ? (
            <CollapseButton collapsed={collapsed} onClick={toggleCollapsed} />
          ) : null}
        </div>

        <SidebarBody items={mainNav} collapsed={collapsed} />

        {collapsed ? (
          <div className="flex justify-center pb-3">
            <CollapseButton collapsed={collapsed} onClick={toggleCollapsed} />
          </div>
        ) : null}
      </aside>
    </>
  );
}

function CollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  const Icon = collapsed ? ChevronsRight : ChevronsLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Déplier le menu" : "Réduire le menu"}
      aria-expanded={!collapsed}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-navy/[0.05] hover:text-navy"
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

function SidebarBody({
  items,
  collapsed,
  onNavigate,
}: {
  items: SidebarNavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Navigation principale">
        {!collapsed ? (
          <p className="mb-2 px-3 font-data text-[10.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
            Mon espace
          </p>
        ) : null}
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.href}>
              <SidebarLink item={item} collapsed={collapsed} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </nav>
      <SidebarFooter collapsed={collapsed} onNavigate={onNavigate} />
    </div>
  );
}

function SidebarLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: SidebarNavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const inactive = item.disabled && !item.active;
  const base = cn(
    "group/nav relative flex h-11 items-center gap-3 rounded-[12px] text-sm font-medium transition-[background-color,color] duration-base ease-joya",
    collapsed ? "justify-center px-0" : "px-3",
  );

  if (inactive) {
    return (
      <span
        title={item.label}
        aria-disabled="true"
        className={cn(base, "cursor-not-allowed text-slate-400 opacity-60")}
      >
        <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
        {!collapsed ? <span className="truncate">{item.label}</span> : null}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      aria-current={item.active ? "page" : undefined}
      className={cn(
        base,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
        item.active
          ? "bg-coral-soft font-semibold text-navy-dark"
          : "text-slate-600 hover:bg-navy/[0.045] hover:text-navy",
      )}
    >
      {item.active ? (
        <span
          className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-coral"
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-colors",
          item.active ? "text-coral" : "text-slate-400 group-hover/nav:text-navy",
        )}
        strokeWidth={item.active ? 2 : 1.75}
        aria-hidden
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
      {item.badge != null ? (
        <span
          className={cn(
            "grid h-5 min-w-5 place-items-center rounded-pill bg-coral px-1.5 font-data text-[10.5px] font-medium text-white",
            collapsed ? "absolute right-2 top-1.5 h-4 min-w-4 px-1 text-[9px]" : "ml-auto",
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarFooter({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { src, failed, setFailed } = useResolvedAvatarUrl(user?.avatar);
  const initials =
    (user?.full_name ?? "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "J";

  return (
    <div className={cn("shrink-0 border-t border-line p-3", collapsed && "px-2")}>
      <Link
        href="/client/profile"
        onClick={onNavigate}
        title={collapsed ? "Mon profil" : undefined}
        aria-label={collapsed ? "Mon profil" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-[12px] p-2 transition-colors hover:bg-navy/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
          collapsed && "justify-center",
        )}
      >
        <Avatar className="h-9 w-9 ring-2 ring-white">
          {src && !failed ? (
            <AvatarImage key={src} src={src} alt="" onError={() => setFailed(true)} />
          ) : (
            <AvatarFallback>{initials}</AvatarFallback>
          )}
        </Avatar>
        {!collapsed ? (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-navy">
              {user?.full_name ?? "Mon compte"}
            </span>
            <span className="block truncate text-[12px] text-ink-faint">
              {getRoleLabel(user?.role)}
            </span>
          </span>
        ) : null}
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          logout();
        }}
        title={collapsed ? "Déconnexion" : undefined}
        aria-label="Déconnexion"
        className={cn(
          "mt-1 flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-sm font-medium text-slate-500 transition-colors hover:bg-danger-soft hover:text-danger-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
          collapsed && "justify-center px-0",
        )}
      >
        <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} aria-hidden />
        {!collapsed ? <span>Déconnexion</span> : null}
      </button>
    </div>
  );
}
