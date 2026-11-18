"use client";

import type { ReactNode } from "react";

type ChartTooltipPlacement = "above" | "below";

type ChartTooltipProps = {
  visible: boolean;
  /** px from left of chart container */
  x: number;
  /** px from top of chart container */
  y: number;
  placement?: ChartTooltipPlacement;
  children: ReactNode;
};

export function ChartTooltip({
  visible,
  x,
  y,
  placement = "above",
  children,
}: ChartTooltipProps) {
  if (!visible) return null;

  return (
    <div
      className={
        placement === "below"
          ? "pointer-events-none absolute z-20 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 translate-y-2.5 rounded-lg border border-line bg-white/95 px-3.5 py-2.5 text-left shadow-joya-lg backdrop-blur-sm"
          : "pointer-events-none absolute z-20 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg border border-line bg-white/95 px-3.5 py-2.5 text-left shadow-joya-lg backdrop-blur-sm"
      }
      style={{ left: x, top: y }}
    >
      {children}
    </div>
  );
}
