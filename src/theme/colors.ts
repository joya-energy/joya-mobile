/**
 * Resolved Joya tokens for NativeWind / RN StyleSheet.
 * Source: apps/customer-web/src/styles/joya-tokens.css
 * Prefer these hex values over CSS variables (RN has no CSS var runtime).
 */

export const joyaNeutral = {
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
} as const;

export const joyaColors = {
  coral: "#E37051",
  coralDark: "#C85A3C",
  coralTint: "#FBE4DA",
  coralSoft: "#FFF1EB",
  coralWash: "#FFF7F3",
  navy: "#173B5E",
  navyDark: "#0F2A44",
  navyDeep: "#0A1D30",
  blue: "#3D6690",
  blueTint: "#EAF1F9",
  blueSoft: "#F2F6FB",
  blueLight: "#9FB3CE",
  cream: "#FFFAF6",
  cream2: "#FCF3EA",
  white: "#FFFFFF",
  success: "#1F8A5B",
  successStrong: "#166A46",
  successSoft: "#E4F3EC",
  warning: "#C27C0E",
  warningStrong: "#8F5A06",
  warningSoft: "#FCF1DC",
  danger: "#C62828",
  dangerStrong: "#A11F1F",
  dangerSoft: "#FBE7E6",
  sun: "#E8A838",
} as const;

export const joyaShadows = {
  xs: {
    shadowColor: "#173B5E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: "#173B5E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: "#173B5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: "#173B5E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
