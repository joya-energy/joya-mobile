/** @type {import('tailwindcss').Config} */
const { joyaColors, joyaNeutral } = require("./src/theme/colors.js");

/**
 * Phone-only screens: no sm/md/lg desktop breakpoints.
 * Desktop Tailwind classes from customer-web never apply on device.
 */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    screens: {
      xs: "420px",
    },
    extend: {
      colors: {
        slate: joyaNeutral,
        gray: joyaNeutral,
        coral: {
          DEFAULT: joyaColors.coral,
          dark: joyaColors.coralDark,
          tint: joyaColors.coralTint,
          soft: joyaColors.coralSoft,
          wash: joyaColors.coralWash,
        },
        navy: {
          DEFAULT: joyaColors.navy,
          dark: joyaColors.navyDark,
          deep: joyaColors.navyDeep,
        },
        blue: {
          DEFAULT: joyaColors.blue,
          tint: joyaColors.blueTint,
          soft: joyaColors.blueSoft,
          light: joyaColors.blueLight,
        },
        cream: {
          DEFAULT: joyaColors.cream,
          2: joyaColors.cream2,
        },
        ink: {
          DEFAULT: joyaColors.navy,
          muted: "rgba(23, 59, 94, 0.66)",
          faint: "rgba(23, 59, 94, 0.48)",
        },
        line: {
          DEFAULT: "rgba(23, 59, 94, 0.1)",
          strong: "rgba(23, 59, 94, 0.2)",
        },
        success: {
          DEFAULT: joyaColors.success,
          strong: joyaColors.successStrong,
          soft: joyaColors.successSoft,
        },
        warning: {
          DEFAULT: joyaColors.warning,
          strong: joyaColors.warningStrong,
          soft: joyaColors.warningSoft,
        },
        danger: {
          DEFAULT: joyaColors.danger,
          strong: joyaColors.dangerStrong,
          soft: joyaColors.dangerSoft,
        },
        sun: joyaColors.sun,
        background: joyaColors.cream,
        foreground: joyaColors.navy,
        primary: {
          DEFAULT: joyaColors.coral,
          foreground: joyaColors.white,
        },
        secondary: {
          DEFAULT: joyaColors.blueSoft,
          foreground: joyaColors.navy,
        },
        muted: {
          DEFAULT: joyaColors.cream2,
          foreground: "rgba(23, 59, 94, 0.66)",
        },
        accent: {
          DEFAULT: joyaColors.coralSoft,
          foreground: joyaColors.navy,
        },
        destructive: {
          DEFAULT: joyaColors.danger,
          foreground: joyaColors.white,
        },
        border: "rgba(23, 59, 94, 0.1)",
        input: "rgba(23, 59, 94, 0.1)",
        ring: joyaColors.coral,
        card: {
          DEFAULT: joyaColors.white,
          foreground: joyaColors.navy,
        },
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "14px",
        lg: "18px",
        xl: "24px",
        "3xl": "28px",
      },
      fontFamily: {
        sans: ["Inter"],
        display: ["Archivo"],
        data: ["IBMPlexMono"],
        mono: ["IBMPlexMono"],
      },
    },
  },
  plugins: [],
};
