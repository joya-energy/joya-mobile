import { useId } from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

type CornerGlowProps = {
  color: string;
  opacity: number;
  /** Gradient centre, 0–1 in the card's bounding box. */
  cx: number;
  cy: number;
};

/** Soft radial colour wash filling its parent (replaces CSS radial-gradient). */
export function CornerGlow({ color, opacity, cx, cy }: CornerGlowProps) {
  const id = `glow${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
    >
      <Defs>
        <RadialGradient id={id} cx={cx} cy={cy} rx={0.75} ry={0.85}>
          <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
