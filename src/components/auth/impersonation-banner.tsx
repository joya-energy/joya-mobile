"use client";

import { useAuth } from "@/contexts/auth-context";

function formatExpiresAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("fr-TN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ImpersonationBanner() {
  const { user, logout } = useAuth();
  const impersonation = user?.impersonation;
  if (!impersonation?.active) return null;

  const expiresLabel = formatExpiresAt(impersonation.expiresAt);
  const ownerLabel =
    user?.full_name?.trim() || user?.email?.trim() || "ce client";

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-100 px-4 py-2.5 text-sm text-amber-950"
    >
      <p className="min-w-0 flex-1">
        Session admin — vous agissez en tant que{" "}
        <span className="font-semibold">{ownerLabel}</span>
        {expiresLabel ? (
          <>
            . Expire à <span className="font-semibold">{expiresLabel}</span>
          </>
        ) : null}
        .
      </p>
      <button
        type="button"
        onClick={logout}
        className="shrink-0 rounded-md border border-amber-400 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-950 transition hover:bg-white"
      >
        Quitter
      </button>
    </div>
  );
}
