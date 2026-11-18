import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type JoyaInfoListProps = {
  children: ReactNode;
  /** Two columns from `sm` when true. */
  columns?: 1 | 2;
  className?: string;
};

/** Definition list for "label → value" data (company, installation…). */
export function JoyaInfoList({ children, columns = 1, className }: JoyaInfoListProps) {
  return (
    <dl
      className={cn(
        "grid gap-x-8",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {children}
    </dl>
  );
}

type JoyaInfoRowProps = {
  label: ReactNode;
  value: ReactNode;
  /** Use Plex Mono for technical values (IDs, kWc, references). */
  mono?: boolean;
  className?: string;
};

export function JoyaInfoRow({ label, value, mono = false, className }: JoyaInfoRowProps) {
  const empty = value == null || value === "" || value === "—";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 border-b border-line py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4",
        className,
      )}
    >
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "min-w-0 break-words text-sm font-medium text-navy sm:text-right",
          mono && "font-data text-[13px]",
          empty && "font-normal text-ink-faint",
        )}
      >
        {empty ? "Non renseigné" : value}
      </dd>
    </div>
  );
}
