/** @type {import('tailwindcss').Config} */
const tailwindcssAnimate = require("tailwindcss-animate");

/** `rgb(var(--joya-x-rgb) / <alpha>)` so every token supports `/opacity`. */
const token = (name) => `rgb(var(--joya-${name}-rgb) / <alpha-value>)`;

/**
 * Neutral scale tinted with Joya navy (#173B5E) instead of Tailwind's cold slate.
 * Remapping `slate`/`gray` gives every legacy `text-slate-*` the brand temperature.
 */
const joyaNeutral = {
  50: "#F6F8FA",
  100: "#EEF2F6",
  200: "#E0E6ED",
  300: "#C7D1DC",
  400: "#93A2B4",
  500: "#5F738B",
  600: "#475B73",
  700: "#344B65",
  800: "#1F3B58",
  900: "#0F2A44",
  950: "#0A1D30",
};

module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      screens: {
        xs: "420px",
      },
      fontFamily: {
        sans: ["var(--joya-font-body)"],
        display: ["var(--joya-font-display)"],
        data: ["var(--joya-font-data)"],
        mono: ["var(--joya-font-data)"],
      },
      fontSize: {
        /* Joya type scale — see src/components/joya/README.md */
        "page-title": ["clamp(1.5rem, 1.2rem + 1vw, 2rem)", { lineHeight: "1.15", letterSpacing: "-0.03em", fontWeight: "700" }],
        "section-title": ["1.125rem", { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "650" }],
        "card-title": ["0.9375rem", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        caption: ["0.75rem", { lineHeight: "1.45" }],
        "kpi-lg": ["clamp(1.75rem, 1.4rem + 1.2vw, 2.5rem)", { lineHeight: "1.05", letterSpacing: "-0.035em" }],
        kpi: ["clamp(1.375rem, 1.2rem + 0.6vw, 1.75rem)", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
      },
      colors: {
        slate: joyaNeutral,
        gray: joyaNeutral,
        coral: {
          DEFAULT: token("coral"),
          dark: token("coral-dark"),
          tint: token("coral-tint"),
          soft: token("coral-soft"),
          wash: token("coral-wash"),
        },
        navy: {
          DEFAULT: token("navy"),
          dark: token("navy-dark"),
          deep: token("navy-deep"),
        },
        blue: {
          ...require("tailwindcss/colors").blue,
          DEFAULT: token("blue"),
          tint: token("blue-tint"),
          soft: token("blue-soft"),
          light: "#9FB3CE",
        },
        cream: {
          DEFAULT: token("cream"),
          2: token("cream-2"),
        },
        ink: {
          DEFAULT: token("navy"),
          muted: "var(--joya-muted)",
          faint: "var(--joya-faint)",
        },
        line: {
          DEFAULT: "var(--joya-border)",
          strong: "var(--joya-border-strong)",
        },
        success: {
          DEFAULT: token("success"),
          strong: token("success-strong"),
          soft: token("success-soft"),
        },
        warning: {
          DEFAULT: token("warning"),
          strong: token("warning-strong"),
          soft: token("warning-soft"),
        },
        danger: {
          DEFAULT: token("danger"),
          strong: token("danger-strong"),
          soft: token("danger-soft"),
        },
        info: {
          DEFAULT: token("info"),
          soft: token("info-soft"),
        },
        sun: token("sun"),
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        // Legacy landing names → Joya tokens (see globals.css)
        landing: {
          // RGB tokens so opacity modifiers (`ring-landing-primary/30`) work.
          primary: token("coral"),
          "primary-dark": token("coral-dark"),
          "primary-light": "var(--landing-primary-light)",
          "primary-lightest": token("coral-tint"),
          secondary: token("navy"),
          "secondary-dark": token("navy-dark"),
          "secondary-light": "var(--landing-secondary-light)",
          "secondary-lightest": token("blue-tint"),
          accent: token("coral"),
          "accent-hover": token("coral-dark"),
          heading: token("navy"),
          "tab-bg": token("coral-soft"),
          "card-bg": token("white"),
          "card-border": "var(--landing-card-border)",
          muted: "var(--landing-muted)",
        },
      },
      borderRadius: {
        xs: "var(--joya-radius-xs)",
        sm: "var(--joya-radius-sm)",
        md: "var(--joya-radius-sm)",
        lg: "var(--joya-radius-md)",
        xl: "var(--joya-radius-lg)",
        "2xl": "var(--joya-radius-xl)",
        "3xl": "var(--joya-radius-2xl)",
        pill: "var(--joya-radius-pill)",
      },
      boxShadow: {
        "joya-xs": "var(--joya-shadow-xs)",
        "joya-sm": "var(--joya-shadow-sm)",
        "joya-md": "var(--joya-shadow-md)",
        "joya-lg": "var(--joya-shadow-lg)",
        "joya-coral": "var(--joya-shadow-coral)",
        "joya-ring": "var(--joya-ring)",
        sm: "var(--joya-shadow-xs)",
        DEFAULT: "var(--joya-shadow-sm)",
        md: "var(--joya-shadow-sm)",
        lg: "var(--joya-shadow-md)",
        xl: "var(--joya-shadow-lg)",
        "2xl": "var(--joya-shadow-lg)",
      },
      transitionTimingFunction: {
        joya: "var(--joya-ease-out)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "220ms",
        slow: "420ms",
      },
      zIndex: {
        sticky: "30",
        nav: "40",
        overlay: "50",
        modal: "60",
        toast: "80",
      },
      spacing: {
        sidebar: "var(--joya-sidebar-width)",
        "sidebar-collapsed": "var(--joya-sidebar-collapsed)",
        header: "var(--joya-header-height)",
      },
      maxWidth: {
        content: "var(--joya-content-max)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "step-enter": {
          from: { opacity: "0", transform: "translateX(8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "step-exit": {
          from: { opacity: "1", transform: "translateX(0)" },
          to: { opacity: "0", transform: "translateX(-8px)" },
        },
        "bg-float-slow": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(24px, -18px) scale(1.06)" },
        },
        "bg-float-fast": {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "50%": { transform: "translate(-18px, 14px) scale(1.04)" },
        },
        "dv-scale-in": {
          from: { opacity: "0", transform: "scale(0.94) translateY(10px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "dv-slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "dv-ken-burns": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.07)" },
        },
        "dv-glow-pulse": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.12)" },
        },
        "dv-cta-glow": {
          "0%, 100%": {
            boxShadow: "0 4px 16px rgb(var(--joya-coral-rgb) / 0.22)",
          },
          "50%": {
            boxShadow: "0 8px 28px rgb(var(--joya-coral-rgb) / 0.42)",
          },
        },
        "dv-shine": {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in-up": "fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.35s ease-out forwards",
        "step-enter": "step-enter 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "bg-float-slow": "bg-float-slow 13s ease-in-out infinite",
        "bg-float-fast": "bg-float-fast 9s ease-in-out infinite",
        "dv-scale-in": "dv-scale-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "dv-slide-in-right": "dv-slide-in-right 0.55s ease-out forwards",
        "dv-ken-burns": "dv-ken-burns 18s ease-out forwards",
        "dv-glow-pulse": "dv-glow-pulse 4s ease-in-out infinite",
        "dv-cta-glow": "dv-cta-glow 2.4s ease-in-out infinite",
        "dv-shine": "dv-shine 2.8s ease-in-out infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
