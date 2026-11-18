"use client";

import { Loader2 } from "lucide-react";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { cn } from "@/lib/utils";

type DeviceScopeLoadingOverlayProps = {
  className?: string;
};

export function DeviceScopeLoadingOverlay({
  className,
}: DeviceScopeLoadingOverlayProps) {
  const { isScopeLoading, showSwitcher } = useDeviceScope();

  if (!isScopeLoading || !showSwitcher) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-20 flex items-start justify-center rounded-lg bg-white/50 pt-6 backdrop-blur-[1px]",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <Loader2 className="h-4 w-4 animate-spin text-navy" aria-hidden />
        <span className="text-sm font-medium text-slate-700">
          Mise à jour des données…
        </span>
      </div>
    </div>
  );
}
