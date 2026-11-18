/** Map pointer position to SVG viewBox coordinates (respects preserveAspectRatio). */
export function clientToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } {
  if (typeof svg.createSVGPoint === "function") {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const matrix = svg.getScreenCTM()?.inverse();
    if (matrix) {
      const local = pt.matrixTransform(matrix);
      return { x: local.x, y: local.y };
    }
  }

  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  return {
    x: ((clientX - rect.left) / rect.width) * vb.width,
    y: ((clientY - rect.top) / rect.height) * vb.height,
  };
}

/** Map viewBox coordinates to px offset inside a container wrapping the SVG. */
export function svgPointToContainerOffset(
  svg: SVGSVGElement,
  container: HTMLElement,
  svgX: number,
  svgY: number,
): { px: number; py: number } {
  if (typeof svg.createSVGPoint === "function") {
    const pt = svg.createSVGPoint();
    pt.x = svgX;
    pt.y = svgY;
    const matrix = svg.getScreenCTM();
    if (matrix) {
      const screen = pt.matrixTransform(matrix);
      const rect = container.getBoundingClientRect();
      return { px: screen.x - rect.left, py: screen.y - rect.top };
    }
  }

  const rect = svg.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const screenX = rect.left + (svgX / vb.width) * rect.width;
  const screenY = rect.top + (svgY / vb.height) * rect.height;
  return {
    px: screenX - containerRect.left,
    py: screenY - containerRect.top,
  };
}

/** Index of the data point whose x is closest to `svgX`. */
export function nearestIndexByX(
  length: number,
  svgX: number,
  xAt: (index: number) => number,
): number {
  if (length <= 0) return -1;
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < length; i++) {
    const dist = Math.abs(xAt(i) - svgX);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export function formatKwFr(value: number): string {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} kW`;
}

export { formatTnd as formatTndFr } from "@/lib/format/currency";
