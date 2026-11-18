"use client";

import { useId } from "react";
import { CountUp } from "@/components/joya/count-up";

/**
 * Isometric energy-flow scene (solar panel → site ⇄ grid), drawn in SVG so it
 * stays crisp at any size and works over the photo background.
 * Coordinates live in a 1000×560 space; HTML labels use the same percentages.
 */

type FlowSceneProps = {
  productionKwh: number | null;
  consumptionKwh: number | null;
  exportKwh: number | null;
  importKwh: number | null;
  format: (v: number | null | undefined) => string;
};

const W = 1000;
const H = 560;

/* Connector routes (orthogonal, rounded corners — like the reference app) */
const PATH_PV_SITE = "M 432 168 L 214 168 Q 190 168 190 192 L 190 300";
const PATH_PV_GRID = "M 568 168 L 786 168 Q 810 168 810 192 L 810 292";
const PATH_GRID_SITE = "M 700 452 L 318 452";

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Tilted solar panel on a pole. */
function SolarPanel({ gid }: { gid: string }) {
  const A: [number, number] = [398, 150];
  const B: [number, number] = [512, 92];
  const C: [number, number] = [606, 140];
  const D: [number, number] = [492, 198];
  const rows = 3;
  const cols = 4;
  const lines: Array<[[number, number], [number, number]]> = [];
  for (let c = 1; c < cols; c++) lines.push([lerp(A, B, c / cols), lerp(D, C, c / cols)]);
  for (let r = 1; r < rows; r++) lines.push([lerp(A, D, r / rows), lerp(B, C, r / rows)]);

  return (
    <g>
      <ellipse cx={502} cy={252} rx={70} ry={16} fill="#0a1d30" opacity={0.35} />
      <ellipse cx={502} cy={250} rx={52} ry={11} fill="#ffffff" opacity={0.85} />
      {/* pole */}
      <polygon points="494,180 510,180 510,246 494,246" fill="#e2e8f0" />
      <polygon points="510,180 516,184 516,244 510,246" fill="#b8c4d3" />
      {/* support bar */}
      <polygon points="440,178 520,150 530,158 450,186" fill="#3d6690" />
      {/* frame thickness */}
      <polygon points={`${A} ${D} ${D[0]} ${D[1] + 8} ${A[0]} ${A[1] + 8}`} fill="#cbd5e1" />
      <polygon points={`${D} ${C} ${C[0]} ${C[1] + 8} ${D[0]} ${D[1] + 8}`} fill="#94a3b8" />
      {/* glass */}
      <polygon points={`${A} ${B} ${C} ${D}`} fill={`url(#${gid}-pv)`} stroke="#e2e8f0" strokeWidth={3} strokeLinejoin="round" />
      {lines.map(([p, q], i) => (
        <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#cbd5e1" strokeOpacity={0.75} strokeWidth={2} />
      ))}
      {/* sheen */}
      <polygon points={`${A} ${lerp(A, B, 0.35)} ${lerp(D, C, 0.18)} ${lerp(A, D, 0.6)}`} fill="#ffffff" opacity={0.12} />
    </g>
  );
}

/** Small isometric factory / site building with rooftop panels. */
function SiteBuilding() {
  // top diamond
  const T = "190,312 300,368 190,424 80,368";
  return (
    <g>
      <ellipse cx={190} cy={500} rx={150} ry={34} fill="#0a1d30" opacity={0.35} />
      <polygon points="190,516 340,440 190,364 40,440" fill="#ffffff" opacity={0.18} />
      {/* walls */}
      <polygon points="80,368 190,424 190,500 80,444" fill="#e6ebf2" />
      <polygon points="190,424 300,368 300,444 190,500" fill="#c4cfdc" />
      {/* roof */}
      <polygon points={T} fill="#ffffff" />
      {/* rooftop panels */}
      <polygon points="150,354 210,324 252,345 192,375" fill="#173b5e" stroke="#dbe3ec" strokeWidth={2} />
      <line x1="170" y1="344" x2="212" y2="365" stroke="#9fb3ce" strokeWidth={1.5} />
      <line x1="190" y1="334" x2="232" y2="355" stroke="#9fb3ce" strokeWidth={1.5} />
      <line x1="180" y1="339" x2="222" y2="360" stroke="#9fb3ce" strokeOpacity={0.5} strokeWidth={1} />
      {/* windows left face */}
      {[0, 1, 2].map((i) => (
        <polygon
          key={`wl-${i}`}
          points={`${96 + i * 30},${388 + i * 15} ${116 + i * 30},${398 + i * 15} ${116 + i * 30},${420 + i * 15} ${96 + i * 30},${410 + i * 15}`}
          fill="#3d6690"
          opacity={0.85}
        />
      ))}
      {/* door + windows right face */}
      <polygon points="214,452 240,439 240,477 214,490" fill="#173b5e" />
      <polygon points="256,431 280,419 280,437 256,449" fill="#3d6690" opacity={0.85} />
      {/* trees */}
      {[
        [40, 450],
        [62, 462],
        [24, 466],
      ].map(([x, y], i) => (
        <g key={`t-${i}`}>
          <rect x={x - 2} y={y} width={4} height={12} fill="#94a3b8" />
          <path d={`M ${x} ${y - 26} L ${x + 11} ${y + 2} L ${x - 11} ${y + 2} Z`} fill="#7fbf9a" />
          <path d={`M ${x} ${y - 26} L ${x + 11} ${y + 2} L ${x} ${y + 2} Z`} fill="#5fa57e" />
        </g>
      ))}
    </g>
  );
}

/** Lattice transmission pylon on a plinth. */
function Pylon() {
  const stroke = "#c9d5ea";
  return (
    <g>
      <ellipse cx={810} cy={492} rx={96} ry={24} fill="#0a1d30" opacity={0.35} />
      {/* plinth */}
      <polygon points="810,458 880,482 810,506 740,482" fill="#ffffff" />
      <polygon points="740,482 810,506 810,516 740,492" fill="#c4cfdc" />
      <polygon points="810,506 880,482 880,492 810,516" fill="#94a3b8" />
      {/* legs */}
      <g stroke={stroke} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M 772 486 L 806 300" />
        <path d="M 848 486 L 814 300" />
        <path d="M 790 492 L 808 300" stroke="#9fb3ce" strokeWidth={3} />
        <path d="M 830 492 L 812 300" stroke="#9fb3ce" strokeWidth={3} />
      </g>
      {/* lattice */}
      <g stroke="#b6c5dc" strokeWidth={2} fill="none">
        {[0, 1, 2, 3, 4].map((i) => {
          const y1 = 470 - i * 36;
          const y2 = y1 - 36;
          const w1 = 38 - i * 6.5;
          const w2 = 38 - (i + 1) * 6.5;
          return (
            <g key={i}>
              <path d={`M ${810 - w1} ${y1} L ${810 + w2} ${y2}`} />
              <path d={`M ${810 + w1} ${y1} L ${810 - w2} ${y2}`} />
              <path d={`M ${810 - w2} ${y2} L ${810 + w2} ${y2}`} />
            </g>
          );
        })}
      </g>
      {/* cross arms */}
      <g stroke={stroke} strokeWidth={4} strokeLinecap="round">
        <path d="M 752 336 L 868 336" />
        <path d="M 766 312 L 854 312" />
      </g>
      {/* insulators */}
      {[756, 784, 836, 864].map((x) => (
        <g key={x}>
          <line x1={x} y1={336} x2={x} y2={352} stroke="#9fb3ce" strokeWidth={3} />
          <circle cx={x} cy={355} r={3.5} fill="#e2e8f0" />
        </g>
      ))}
      {[772, 848].map((x) => (
        <line key={x} x1={x} y1={312} x2={x} y2={324} stroke="#9fb3ce" strokeWidth={3} />
      ))}
      <circle cx={810} cy={296} r={5} fill="#e2e8f0" />
    </g>
  );
}

function FlowDots({ path, color, active, reverse = false, dur = 2.6 }: { path: string; color: string; active: boolean; reverse?: boolean; dur?: number }) {
  if (!active) return null;
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <circle key={i} r={5.5} fill={color} style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
          <animateMotion
            dur={`${dur}s`}
            begin={`${(-dur / 3) * i}s`}
            repeatCount="indefinite"
            path={path}
            keyPoints={reverse ? "1;0" : "0;1"}
            keyTimes="0;1"
            calcMode="linear"
          />
        </circle>
      ))}
    </g>
  );
}

function Tag({
  x,
  y,
  label,
  value,
  tone,
  align = "center",
}: {
  x: number;
  y: number;
  label: string;
  value: string;
  tone: "sun" | "site" | "grid";
  align?: "center" | "left" | "right";
}) {
  return (
    <div
      className={`flow-tag is-${tone} is-${align}`}
      style={{ left: pct(x, W), top: pct(y, H) }}
    >
      <span className="flow-tag-label">{label}</span>
      <span className="flow-tag-value">
        <CountUp text={value} />
        <small> kWh</small>
      </span>
    </div>
  );
}

export function EnergyFlowScene({
  productionKwh,
  consumptionKwh,
  exportKwh,
  importKwh,
  format,
}: FlowSceneProps) {
  const gid = `pv${useId().replace(/:/g, "")}`;
  const hasPv = (productionKwh ?? 0) > 0;
  const hasExport = (exportKwh ?? 0) > 0;
  const hasImport = (importKwh ?? 0) > 0;

  return (
    <>
    <div className="flow-iso" role="img" aria-label={`Production ${format(productionKwh)} kWh, consommation ${format(consumptionKwh)} kWh, export ${format(exportKwh)} kWh, import ${format(importKwh)} kWh`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="flow-iso-svg" aria-hidden>
        <defs>
          <linearGradient id={`${gid}-pv`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2b4f78" />
            <stop offset="100%" stopColor="#0f2a44" />
          </linearGradient>
          <radialGradient id={`${gid}-sun`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#E37051" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E37051" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* sun glow behind the panel */}
        <circle cx={500} cy={140} r={150} fill={`url(#${gid}-sun)`} className="flow-sun-glow" />

        {/* connectors */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={PATH_PV_SITE} stroke="rgba(255,250,246,0.38)" strokeWidth={4} />
          <path d={PATH_PV_GRID} stroke="rgba(255,250,246,0.38)" strokeWidth={4} />
          <path d={PATH_GRID_SITE} stroke="rgba(255,250,246,0.38)" strokeWidth={4} />
        </g>
        <FlowDots path={PATH_PV_SITE} color="#F0A68A" active={hasPv} />
        <FlowDots path={PATH_PV_GRID} color="#F5D08A" active={hasExport} dur={3} />
        <FlowDots path={PATH_GRID_SITE} color="#9FB3CE" active={hasImport} dur={3.2} />

        <SiteBuilding />
        <Pylon />
        <SolarPanel gid={gid} />
      </svg>

      <Tag x={655} y={262}label="Production PV" value={format(productionKwh)} tone="sun" />
      <Tag x={92} y={246} label="Consommation" value={format(consumptionKwh)} tone="site" />
      <Tag x={908} y={236} label="Export réseau" value={format(exportKwh)} tone="grid" />
      <Tag x={510} y={398} label="Import réseau" value={format(importKwh)} tone="grid" />
    </div>
    <div className="flow-iso-legend" aria-hidden>
      <Tag x={0} y={0} label="Production PV" value={format(productionKwh)} tone="sun" />
      <Tag x={0} y={0} label="Consommation" value={format(consumptionKwh)} tone="site" />
      <Tag x={0} y={0} label="Export réseau" value={format(exportKwh)} tone="grid" />
      <Tag x={0} y={0} label="Import réseau" value={format(importKwh)} tone="grid" />
    </div>
    </>
  );
}
