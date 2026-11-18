"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import ProfileHeader from "@/components/client/ProfileHeader";
import { useAuth } from "@/contexts/auth-context";
import { JoyaLogo } from "@/components/joya";

/** Installer space top bar — floating glass pill, like the landing navbar. */
export function InstallateurTopbar() {
  const { logout } = useAuth();

  return (
    <div className="sticky top-0 z-sticky px-3 pt-3 sm:px-6 sm:pt-4">
      <header className="joya-glass mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 rounded-pill border border-white/70 pl-5 pr-2 shadow-joya-sm">
        <Link
          href="/installateur"
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
          aria-label="Espace installateur — accueil"
        >
          <JoyaLogo height={30} priority />
          <span className="hidden border-l border-line pl-3 font-data text-[11px] uppercase tracking-[0.1em] text-slate-500 sm:inline">
            Installateur
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ProfileHeader href="/installateur/profile" />
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-danger-soft hover:text-danger-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden />
          </button>
        </div>
      </header>
    </div>
  );
}
