import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full gap-3 rounded-lg border px-4 py-3.5 text-sm",
  {
    variants: {
      tone: {
        info: "border-blue/15 bg-blue-soft text-navy [&_[data-alert-icon]]:text-blue",
        success: "border-success/20 bg-success-soft/70 text-navy [&_[data-alert-icon]]:text-success",
        warning: "border-warning/25 bg-warning-soft/70 text-navy [&_[data-alert-icon]]:text-warning",
        danger: "border-danger/20 bg-danger-soft/70 text-navy [&_[data-alert-icon]]:text-danger",
        coral: "border-coral/20 bg-coral-wash text-navy [&_[data-alert-icon]]:text-coral",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const ICONS: Record<NonNullable<VariantProps<typeof alertVariants>["tone"]>, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  coral: Info,
};

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
  icon?: LucideIcon | null;
  action?: React.ReactNode;
}

function Alert({ className, tone, title, icon, action, children, ...props }: AlertProps) {
  const Icon = icon === null ? null : (icon ?? ICONS[tone ?? "info"]);
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      {Icon ? <Icon data-alert-icon className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden /> : null}
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold leading-snug text-navy">{title}</p> : null}
        {children ? (
          <div className={cn("leading-relaxed text-ink-muted", title && "mt-0.5")}>{children}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

export { Alert, alertVariants };
