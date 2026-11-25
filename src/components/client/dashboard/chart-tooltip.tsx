import { useState, type ReactNode } from "react";
import { View, type LayoutChangeEvent } from "react-native";

type ChartTooltipPlacement = "above" | "below";

type ChartTooltipProps = {
  visible: boolean;
  /** px from left of chart container */
  x: number;
  /** px from top of chart container */
  y: number;
  placement?: ChartTooltipPlacement;
  /** Chart container width — when given, the tooltip is clamped inside it. */
  containerWidth?: number;
  children: ReactNode;
};

const GAP = 10;
const EDGE = 4;

/**
 * Absolutely positioned tooltip, centred on (x, y) above or below the point.
 * Measures itself via onLayout (no CSS transforms needed) and stays invisible
 * for the first frame so it never flashes at a wrong position.
 */
export function ChartTooltip({
  visible,
  x,
  y,
  placement = "above",
  containerWidth,
  children,
}: ChartTooltipProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  if (!visible) return null;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  };

  let left = x - size.width / 2;
  if (containerWidth != null && containerWidth > 0) {
    left = Math.min(Math.max(left, EDGE), Math.max(EDGE, containerWidth - size.width - EDGE));
  }
  const top = placement === "below" ? y + GAP : y - size.height - GAP;

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      className="absolute rounded-lg border border-line bg-white px-3.5 py-2.5"
      style={{
        left,
        top,
        zIndex: 20,
        opacity: size.width > 0 ? 1 : 0,
        maxWidth: containerWidth != null && containerWidth > 0 ? containerWidth - EDGE * 2 : undefined,
        // Soft elevation (shadow-joya-lg equivalent)
        shadowColor: "#173B5E",
        shadowOpacity: 0.22,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
      }}
    >
      {children}
    </View>
  );
}
