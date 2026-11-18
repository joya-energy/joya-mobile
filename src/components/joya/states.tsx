import type { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type JoyaEmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
};

/** Empty state: soft icon tile, short message, optional action. */
export function JoyaEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}: JoyaEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-2xl bg-coral-soft text-coral",
          compact ? "h-10 w-10" : "h-14 w-14",
        )}
        aria-hidden
      >
        <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <p className={cn("font-display font-semibold text-navy", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

type JoyaErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  className?: string;
};

/** Error state with retry. Message must be human readable (no stack/codes). */
export function JoyaErrorState({
  title = "Impossible de charger ces données",
  description = "Vérifiez votre connexion ou réessayez dans un instant.",
  onRetry,
  retryLabel = "Réessayer",
  compact = false,
  className,
}: JoyaErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-2xl bg-danger-soft text-danger",
          compact ? "h-10 w-10" : "h-14 w-14",
        )}
        aria-hidden
      >
        <AlertTriangle className={compact ? "h-5 w-5" : "h-6 w-6"} />
      </span>
      <p className={cn("font-display font-semibold text-navy", compact ? "text-sm" : "text-base")}>
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

/** Full-area spinner with brand mark colour — for route-level loading. */
export function JoyaLoadingState({
  label = "Chargement…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-h-[40vh] flex-col items-center justify-center gap-3", className)}
    >
      <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-joya-sm">
        <Loader2 className="h-5 w-5 animate-spin text-coral" aria-hidden />
      </span>
      <span className="text-[13px] font-medium text-ink-muted">{label}</span>
    </div>
  );
}
