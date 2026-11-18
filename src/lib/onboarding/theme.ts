/**
 * Shared Tailwind classes for onboarding — bound to the Joya design tokens
 * (cream canvas, white cards, navy text, coral actions). Keep in sync with
 * `src/components/ui/*` primitives.
 */
export const brand = {
  pageBg:
    "relative min-h-screen w-full overflow-hidden bg-cream text-navy",
  /** Soft brand glows (landing hero language), hidden on small screens. */
  orbPrimary:
    "pointer-events-none absolute -left-40 -top-40 hidden h-[28rem] w-[28rem] rounded-full bg-coral/10 blur-3xl md:block",
  orbSecondary:
    "pointer-events-none absolute -right-32 top-1/3 hidden h-[24rem] w-[24rem] rounded-full bg-blue/10 blur-3xl md:block",
  orbTertiary: "hidden",
} as const;

export const ob = {
  page: "space-y-6 pb-12",
  card: "rounded-2xl border border-line bg-white p-5 shadow-joya-md sm:p-8",
  cardTitle: "font-display text-xl font-bold tracking-tight text-navy",
  cardSubtitle: "text-sm leading-relaxed text-ink-muted",
  sectionBorder: "border-b border-line pb-4",
  sectionIcon: "text-coral",
  label: "text-[13px] font-semibold text-navy",
  labelMuted: "text-ink-faint",
  input:
    "h-11 rounded-md border border-input bg-white text-navy placeholder:text-slate-400 focus-visible:border-coral focus-visible:ring-[3px] focus-visible:ring-coral/20",
  inputError: "border-danger bg-danger-soft/40",
  selectTrigger:
    "h-11 rounded-md border border-input bg-white text-navy data-[placeholder]:text-slate-400",
  errorBadge:
    "flex items-center gap-1 rounded-pill bg-danger-soft px-2 py-0.5 text-[10.5px] font-semibold text-danger-strong",
  badge:
    "inline-flex items-center gap-1 rounded-pill border border-coral/25 bg-coral-soft px-3.5 py-1.5 text-[13px] font-semibold text-coral-dark",
  progressTrack: "h-1.5 w-full overflow-hidden rounded-full bg-navy/10",
  progressFill: "h-full rounded-full bg-coral transition-[width] duration-700 ease-joya",
  btnPrimary:
    "h-12 rounded-pill bg-coral px-10 font-semibold text-white shadow-joya-xs transition-[transform,background-color,box-shadow] duration-base ease-joya hover:-translate-y-px hover:bg-coral-dark hover:shadow-joya-coral disabled:opacity-50",
  btnOutline:
    "h-12 rounded-pill border border-line-strong bg-white px-8 font-semibold text-navy transition-colors hover:border-navy/60 disabled:opacity-50",
  btnGhost:
    "font-semibold text-navy/80 hover:bg-navy/5 hover:text-navy",
  pillActive:
    "border-coral bg-coral-soft text-navy shadow-joya-xs ring-2 ring-coral/20",
  pillIdle:
    "border-line bg-white text-navy/75 hover:border-line-strong hover:bg-cream",
  loader: "text-coral",
  pageTitle:
    "font-display text-page-title font-bold text-navy",
  stepMeta: "text-sm font-medium text-ink-muted",
} as const;
