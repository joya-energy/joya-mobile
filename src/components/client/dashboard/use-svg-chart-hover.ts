"use client";

import { useCallback, useRef, useState } from "react";
import {
  clientToSvgPoint,
  nearestIndexByX,
  svgPointToContainerOffset,
} from "./chart-interaction";

type ChartPadding = { top: number; right: number; bottom: number; left: number };

type UseSvgChartHoverOptions = {
  dataLength: number;
  plotWidth: number;
  plotHeight: number;
  pad: ChartPadding;
  xAt: (index: number) => number;
  /** When set, tooltip anchors on the snapped data point (not raw pointer). */
  yAt?: (index: number) => number;
};

export function useSvgChartHover({
  dataLength,
  plotWidth,
  plotHeight,
  pad,
  xAt,
  yAt,
}: UseSvgChartHoverOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ index: number; px: number; py: number } | null>(
    null,
  );

  const plotXMin = pad.left;
  const plotXMax = pad.left + plotWidth;
  const plotYMin = pad.top;
  const plotYMax = pad.top + plotHeight;

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const svg = svgRef.current;
      const container = containerRef.current;
      if (!svg || !container || dataLength === 0) return;

      const { x, y } = clientToSvgPoint(svg, e.clientX, e.clientY);
      if (x < plotXMin || x > plotXMax || y < plotYMin || y > plotYMax) {
        setHover(null);
        return;
      }

      const index = nearestIndexByX(dataLength, x, xAt);
      if (index < 0) return;

      const anchor =
        yAt != null
          ? svgPointToContainerOffset(svg, container, xAt(index), yAt(index))
          : {
              px: e.clientX - container.getBoundingClientRect().left,
              py: e.clientY - container.getBoundingClientRect().top,
            };

      setHover({
        index,
        px: anchor.px,
        py: anchor.py,
      });
    },
    [dataLength, plotXMin, plotXMax, plotYMin, plotYMax, xAt, yAt],
  );

  const onMouseLeave = useCallback(() => setHover(null), []);

  return {
    containerRef,
    svgRef,
    hover,
    onMouseMove,
    onMouseLeave,
  };
}
