import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type JoyaEyebrowProps = {
  children: ReactNode;
  className?: string;
};

/** Plex Mono uppercase label with coral dot — landing `.eyebrow`. */
export function JoyaEyebrow({ children, className }: JoyaEyebrowProps) {
  return <span className={cn("joya-eyebrow", className)}>{children}</span>;
}

type JoyaPageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions (buttons, selectors). Wraps below on mobile. */
  actions?: ReactNode;
  /** Extra row under the description (chips, status…). */
  meta?: ReactNode;
  /** Landing-style photo hero (navy scrim, white type, ambient glow). */
  image?: string;
  className?: string;
};

/** Page-level title block. One per page, always first. */
export function JoyaPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  image,
  className,
}: JoyaPageHeaderProps) {
  if (image) {
    return (
      <header
        className={cn(
          "relative isolate overflow-hidden rounded-3xl bg-navy-dark px-6 py-8 text-cream shadow-joya-lg sm:px-8 sm:py-10 lg:px-10",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-75 motion-safe:animate-dv-ken-burns"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgb(15_42_68/0.94)_0%,rgb(15_42_68/0.72)_48%,rgb(15_42_68/0.2)_100%)]"
        />
        <div aria-hidden className="joya-glow absolute -bottom-24 -left-10 -z-10 h-64 w-64 rounded-full bg-coral/30 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-3xl">
            {eyebrow ? (
              <span className="mb-3 inline-flex items-center gap-2 font-data text-[11.5px] uppercase tracking-[0.1em] text-coral-tint">
                <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden />
                {eyebrow}
              </span>
            ) : null}
            <h1 className="font-display text-[clamp(1.9rem,1.3rem+2.2vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-cream text-balance">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-[58ch] text-[15.5px] leading-relaxed text-cream/80">{description}</p>
            ) : null}
            {meta ? <div className="mt-4 flex flex-wrap items-center gap-2">{meta}</div> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <JoyaEyebrow className="mb-2.5">{eyebrow}</JoyaEyebrow> : null}
        <h1 className="font-display text-page-title font-bold text-navy text-balance">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
            {description}
          </p>
        ) : null}
        {meta ? <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

type JoyaSectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Report-style numbered chip ("01"). */
  index?: number | string;
  icon?: ReactNode;
  /** Filled coral + white icon (consumption mockups). Default: wash + coral icon. */
  iconVariant?: "wash" | "filled";
  /** Filled coral + white index chip. Default: wash + coral numerals. */
  indexVariant?: "wash" | "filled";
  actions?: ReactNode;
  className?: string;
  as?: "h2" | "h3";
};

/** Section title — numbered variant reproduces the report `.rp__hd`. */
export function JoyaSectionHeader({
  title,
  description,
  index,
  icon,
  iconVariant = "wash",
  indexVariant = "wash",
  actions,
  className,
  as: Tag = "h2",
}: JoyaSectionHeaderProps) {
  const chip =
    index != null ? (
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px] font-data text-[13px] font-semibold tabular-nums",
          indexVariant === "filled"
            ? "bg-coral text-white"
            : "bg-coral-soft font-medium text-coral-dark",
        )}
      >
        {typeof index === "number" ? String(index).padStart(2, "0") : index}
      </span>
    ) : icon ? (
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-[12px] [&_svg]:h-[18px] [&_svg]:w-[18px]",
          iconVariant === "filled"
            ? "bg-coral text-white"
            : "bg-coral-soft text-coral",
        )}
      >
        {icon}
      </span>
    ) : null;

  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {chip}
        <div className={cn("min-w-0", chip && "pt-1")}>
          <Tag className="font-display text-section-title text-navy">{title}</Tag>
          {description ? (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
