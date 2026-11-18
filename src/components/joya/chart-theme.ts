/**
 * Chart palette (hex mirror of `joya-tokens.css`) for SVG / Recharts props,
 * where CSS variables can't be concatenated with alpha suffixes.
 *
 * Rules:
 *  - coral  → the series the client cares about (production, savings, current)
 *  - navy   → reference / actual / consumption
 *  - blue   → comparison / secondary series
 *  - muted  → previous period, baselines
 *  - sun    → irradiation only
 */
export const JOYA_CHART = {
  coral: "#E37051",
  coralDark: "#C85A3C",
  coralLight: "#F0A68A",
  coralTint: "#FBE4DA",
  navy: "#173B5E",
  navyDark: "#0F2A44",
  blue: "#3D6690",
  blueLight: "#9FB3CE",
  blueTint: "#EAF1F9",
  muted: "#93A2B4",
  sun: "#E8A838",
  sunLight: "#F5D08A",
  success: "#1F8A5B",
  successTint: "#E4F3EC",
  warning: "#C27C0E",
  danger: "#C62828",
  grid: "rgba(23, 59, 94, 0.08)",
  axis: "rgba(23, 59, 94, 0.5)",
  axisText: "#5F738B",
  tooltipBg: "#0F2A44",
  fontData: "var(--joya-font-data)",
  fontBody: "var(--joya-font-body)",
} as const;

/** Shared Recharts styling so every chart reads as one system. */
export const JOYA_RECHARTS = {
  grid: { strokeDasharray: "3 4", stroke: JOYA_CHART.grid, vertical: false },
  tick: { fontSize: 11, fill: JOYA_CHART.axisText, fontFamily: JOYA_CHART.fontData },
  axisLine: { stroke: "rgba(23, 59, 94, 0.14)" },
  tooltip: {
    borderRadius: 12,
    border: "1px solid rgba(23, 59, 94, 0.1)",
    boxShadow: "0 16px 32px -16px rgba(23, 59, 94, 0.28)",
    background: "rgba(255, 255, 255, 0.97)",
    fontFamily: JOYA_CHART.fontBody,
    fontSize: 12.5,
    color: JOYA_CHART.navy,
    padding: "10px 12px",
  },
  cursor: { fill: "rgba(227, 112, 81, 0.06)", stroke: "rgba(227, 112, 81, 0.35)" },
} as const;
