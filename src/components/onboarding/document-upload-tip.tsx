"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentUploadTipProps = {
  children: string;
  className?: string;
};

/** Conseil dépliable au tap — fonctionne sur mobile (pas de survol requis). */
export function DocumentUploadTip({ children, className }: DocumentUploadTipProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-navy/10 bg-navy/[0.03]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left touch-manipulation"
        aria-expanded={open}
      >
        <Info className="h-3.5 w-3.5 shrink-0 text-coral" aria-hidden />
        <span className="text-xs font-semibold text-navy/80">
          Quel document déposer ?
        </span>
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 text-navy/45 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <p className="border-t border-navy/8 px-3 py-2.5 text-xs leading-relaxed text-navy/70">
          {children}
        </p>
      ) : null}
    </div>
  );
}
