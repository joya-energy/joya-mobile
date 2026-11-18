import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Pill badges — tones map 1:1 to Joya semantic tokens. */
const badgeVariants = cva(
  "inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-pill border font-medium leading-none",
  {
    variants: {
      tone: {
        neutral: "border-line bg-slate-50 text-slate-700",
        coral: "border-coral/20 bg-coral-soft text-coral-dark",
        navy: "border-navy bg-navy text-white",
        info: "border-blue/15 bg-blue-tint text-blue",
        success: "border-success/20 bg-success-soft text-success-strong",
        warning: "border-warning/25 bg-warning-soft text-warning-strong",
        danger: "border-danger/20 bg-danger-soft text-danger-strong",
        outline: "border-line-strong bg-white text-navy",
      },
      size: {
        sm: "h-5 px-2 text-[11px]",
        md: "h-6 px-2.5 text-xs",
        lg: "h-7 px-3 text-[13px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Leading status dot in the current colour. */
  dot?: boolean;
}

function Badge({ className, tone, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
