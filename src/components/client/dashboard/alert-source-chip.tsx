import { cn } from "@/lib/utils";

type AlertSourceChipProps = {
  label?: string;
  variant?: "default" | "modal";
  className?: string;
};

export function AlertSourceChip({
  label,
  variant = "default",
  className,
}: AlertSourceChipProps) {
  if (!label?.trim()) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-[11px]",
        variant === "modal"
          ? "border border-white/20 bg-white/10 text-white/80"
          : "bg-slate-100 text-slate-600",
        className,
      )}
    >
      {label}
    </span>
  );
}
