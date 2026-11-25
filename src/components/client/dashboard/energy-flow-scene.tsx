import { useEffect, useId } from "react";
import { Text, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { CountUp } from "@/components/joya/count-up";

/**
 * Isometric energy-flow scene (solar panel → site ⇄ grid), drawn with
 * react-native-svg. Coordinates live in a 1000×560 space and the SVG scales
 * to the container width. On phones the value tags sit in a 2×2 legend under
 * the scene (same as the web <640px layout).
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

/** Dash pattern for the flowing "energy packets" (dots via round caps). */
const DASH_ON = 0.1;
const DASH_GAP = 22;
const DASH_PERIOD = DASH_ON + DASH_GAP;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function lerp(
  a: [number, number],
  b: [number, number],
  t: number,
): [number, number] {
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
  for (let c = 1; c < cols; c++)
    lines.push([lerp(A, B, c / cols), lerp(D, C, c / cols)]);
  for (let r = 1; r < rows; r++)
    lines.push([lerp(A, D, r / rows), lerp(B, C, r / rows)]);

  return (
    <G>
      <Ellipse cx={502} cy={252} rx={70} ry={16} fill="#0a1d30" opacity={0.35} />
      <Ellipse cx={502} cy={250} rx={52} ry={11} fill="#ffffff" opacity={0.85} />
      {/* pole */}
      <Polygon points="494,180 510,180 510,246 494,246" fill="#e2e8f0" />
      <Polygon points="510,180 516,184 516,244 510,246" fill="#b8c4d3" />
      {/* support bar */}
      <Polygon points="440,178 520,150 530,158 450,186" fill="#3d6690" />
      {/* frame thickness */}
      <Polygon
        points={`${A} ${D} ${D[0]},${D[1] + 8} ${A[0]},${A[1] + 8}`}
        fill="#cbd5e1"
      />
      <Polygon
        points={`${D} ${C} ${C[0]},${C[1] + 8} ${D[0]},${D[1] + 8}`}
        fill="#94a3b8"
      />
      {/* glass */}
      <Polygon
        points={`${A} ${B} ${C} ${D}`}
        fill={`url(#${gid}-pv)`}
        stroke="#e2e8f0"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {lines.map(([p, q], i) => (
        <Line
          key={i}
          x1={p[0]}
          y1={p[1]}
          x2={q[0]}
          y2={q[1]}
          stroke="#cbd5e1"
          strokeOpacity={0.75}
          strokeWidth={2}
        />
      ))}
      {/* sheen */}
      <Polygon
        points={`${A} ${lerp(A, B, 0.35)} ${lerp(D, C, 0.18)} ${lerp(A, D, 0.6)}`}
        fill="#ffffff"
        opacity={0.12}
      />
    </G>
  );
}

/** Small isometric factory / site building with rooftop panels. */
function SiteBuilding() {
  const T = "190,312 300,368 190,424 80,368";
  return (
    <G>
      <Ellipse cx={190} cy={500} rx={150} ry={34} fill="#0a1d30" opacity={0.35} />
      <Polygon
        points="190,516 340,440 190,364 40,440"
        fill="#ffffff"
        opacity={0.18}
      />
      {/* walls */}
      <Polygon points="80,368 190,424 190,500 80,444" fill="#e6ebf2" />
      <Polygon points="190,424 300,368 300,444 190,500" fill="#c4cfdc" />
      {/* roof */}
      <Polygon points={T} fill="#ffffff" />
      {/* rooftop panels */}
      <Polygon
        points="150,354 210,324 252,345 192,375"
        fill="#173b5e"
        stroke="#dbe3ec"
        strokeWidth={2}
      />
      <Line x1="170" y1="344" x2="212" y2="365" stroke="#9fb3ce" strokeWidth={1.5} />
      <Line x1="190" y1="334" x2="232" y2="355" stroke="#9fb3ce" strokeWidth={1.5} />
      <Line
        x1="180"
        y1="339"
        x2="222"
        y2="360"
        stroke="#9fb3ce"
        strokeOpacity={0.5}
        strokeWidth={1}
      />
      {/* windows left face */}
      {[0, 1, 2].map((i) => (
        <Polygon
          key={`wl-${i}`}
          points={`${96 + i * 30},${388 + i * 15} ${116 + i * 30},${398 + i * 15} ${116 + i * 30},${420 + i * 15} ${96 + i * 30},${410 + i * 15}`}
          fill="#3d6690"
          opacity={0.85}
        />
      ))}
      {/* door + windows right face */}
      <Polygon points="214,452 240,439 240,477 214,490" fill="#173b5e" />
      <Polygon
        points="256,431 280,419 280,437 256,449"
        fill="#3d6690"
        opacity={0.85}
      />
      {/* trees */}
      {[
        [40, 450],
        [62, 462],
        [24, 466],
      ].map(([x, y], i) => (
        <G key={`t-${i}`}>
          <Rect x={x - 2} y={y} width={4} height={12} fill="#94a3b8" />
          <Path
            d={`M ${x} ${y - 26} L ${x + 11} ${y + 2} L ${x - 11} ${y + 2} Z`}
            fill="#7fbf9a"
          />
          <Path
            d={`M ${x} ${y - 26} L ${x + 11} ${y + 2} L ${x} ${y + 2} Z`}
            fill="#5fa57e"
          />
        </G>
      ))}
    </G>
  );
}

/** Lattice transmission pylon on a plinth. */
function Pylon() {
  const stroke = "#c9d5ea";
  return (
    <G>
      <Ellipse cx={810} cy={492} rx={96} ry={24} fill="#0a1d30" opacity={0.35} />
      {/* plinth */}
      <Polygon points="810,458 880,482 810,506 740,482" fill="#ffffff" />
      <Polygon points="740,482 810,506 810,516 740,492" fill="#c4cfdc" />
      <Polygon points="810,506 880,482 880,492 810,516" fill="#94a3b8" />
      {/* legs */}
      <G stroke={stroke} strokeWidth={4} strokeLinecap="round" fill="none">
        <Path d="M 772 486 L 806 300" />
        <Path d="M 848 486 L 814 300" />
        <Path d="M 790 492 L 808 300" stroke="#9fb3ce" strokeWidth={3} />
        <Path d="M 830 492 L 812 300" stroke="#9fb3ce" strokeWidth={3} />
      </G>
      {/* lattice */}
      <G stroke="#b6c5dc" strokeWidth={2} fill="none">
        {[0, 1, 2, 3, 4].map((i) => {
          const y1 = 470 - i * 36;
          const y2 = y1 - 36;
          const w1 = 38 - i * 6.5;
          const w2 = 38 - (i + 1) * 6.5;
          return (
            <G key={i}>
              <Path d={`M ${810 - w1} ${y1} L ${810 + w2} ${y2}`} />
              <Path d={`M ${810 + w1} ${y1} L ${810 - w2} ${y2}`} />
              <Path d={`M ${810 - w2} ${y2} L ${810 + w2} ${y2}`} />
            </G>
          );
        })}
      </G>
      {/* cross arms */}
      <G stroke={stroke} strokeWidth={4} strokeLinecap="round">
        <Path d="M 752 336 L 868 336" />
        <Path d="M 766 312 L 854 312" />
      </G>
      {/* insulators */}
      {[756, 784, 836, 864].map((x) => (
        <G key={x}>
          <Line x1={x} y1={336} x2={x} y2={352} stroke="#9fb3ce" strokeWidth={3} />
          <Circle cx={x} cy={355} r={3.5} fill="#e2e8f0" />
        </G>
      ))}
      {[772, 848].map((x) => (
        <Line key={x} x1={x} y1={312} x2={x} y2={324} stroke="#9fb3ce" strokeWidth={3} />
      ))}
      <Circle cx={810} cy={296} r={5} fill="#e2e8f0" />
    </G>
  );
}

/**
 * Energy "packets" travelling along a connector: a dotted overlay stroke whose
 * dashoffset is animated on the UI thread (replaces SVG <animateMotion>).
 */
function FlowDots({
  path,
  color,
  active,
  speed = 90,
}: {
  path: string;
  color: string;
  active: boolean;
  /** Travel speed in viewBox units per second. */
  speed?: number;
}) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(progress);
    progress.value = 0;
    if (!active || reducedMotion) return;
    progress.value = withRepeat(
      withTiming(1, {
        duration: (DASH_PERIOD / speed) * 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [active, reducedMotion, speed, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: -progress.value * DASH_PERIOD,
  }));

  if (!active) return null;

  return (
    <G fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* soft glow rail */}
      <Path d={path} stroke={color} strokeOpacity={0.22} strokeWidth={12} />
      <AnimatedPath
        d={path}
        stroke={color}
        strokeWidth={8}
        strokeDasharray={[DASH_ON, DASH_GAP]}
        animatedProps={animatedProps}
      />
    </G>
  );
}

/** Pulsing glow behind the panel. */
function SunGlow({ gid }: { gid: string }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);
    if (reducedMotion) {
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [reducedMotion, pulse]);

  const animatedProps = useAnimatedProps(() => ({
    r: 150 * (1 + 0.08 * pulse.value),
    opacity: 0.7 + 0.3 * pulse.value,
  }));

  return (
    <AnimatedCircle
      cx={500}
      cy={140}
      r={150}
      fill={`url(#${gid}-sun)`}
      animatedProps={animatedProps}
    />
  );
}

type TagTone = "sun" | "site" | "grid";

function Tag({
  label,
  value,
  tone,
  index,
}: {
  label: string;
  value: string;
  tone: TagTone;
  index: number;
}) {
  const valueColor = tone === "sun" ? "#ffd2c2" : "#FFFAF6";
  return (
    <Animated.View
      entering={FadeInDown.duration(600).delay(100 + index * 150)}
      style={{
        flexGrow: 1,
        flexBasis: "46%",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 12,
        paddingVertical: 8,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          color: "rgba(255,250,246,0.75)",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" }}>
        <CountUp
          text={value}
          style={{
            fontSize: 17,
            fontWeight: "700",
            color: valueColor,
            fontVariant: ["tabular-nums"],
          }}
        />
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: "rgba(255,250,246,0.7)",
          }}
        >
          {" "}
          kWh
        </Text>
      </View>
    </Animated.View>
  );
}

export function EnergyFlowScene({
  productionKwh,
  consumptionKwh,
  exportKwh,
  importKwh,
  format,
}: FlowSceneProps) {
  const gid = `pv${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const hasPv = (productionKwh ?? 0) > 0;
  const hasExport = (exportKwh ?? 0) > 0;
  const hasImport = (importKwh ?? 0) > 0;

  return (
    <View className="w-full">
      <View
        className="w-full"
        style={{ aspectRatio: W / H }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Production ${format(productionKwh)} kWh, consommation ${format(consumptionKwh)} kWh, export ${format(exportKwh)} kWh, import ${format(importKwh)} kWh`}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <Defs>
            <SvgLinearGradient id={`${gid}-pv`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#2b4f78" />
              <Stop offset="100%" stopColor="#0f2a44" />
            </SvgLinearGradient>
            <RadialGradient id={`${gid}-sun`} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0%" stopColor="#E37051" stopOpacity="0.55" />
              <Stop offset="100%" stopColor="#E37051" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* sun glow behind the panel */}
          <SunGlow gid={gid} />

          {/* connectors */}
          <G fill="none" strokeLinecap="round" strokeLinejoin="round">
            <Path d={PATH_PV_SITE} stroke="rgba(255,250,246,0.38)" strokeWidth={4} />
            <Path d={PATH_PV_GRID} stroke="rgba(255,250,246,0.38)" strokeWidth={4} />
            <Path d={PATH_GRID_SITE} stroke="rgba(255,250,246,0.38)" strokeWidth={4} />
          </G>
          <FlowDots path={PATH_PV_SITE} color="#F0A68A" active={hasPv} speed={90} />
          <FlowDots path={PATH_PV_GRID} color="#F5D08A" active={hasExport} speed={80} />
          <FlowDots path={PATH_GRID_SITE} color="#9FB3CE" active={hasImport} speed={75} />

          <SiteBuilding />
          <Pylon />
          <SolarPanel gid={gid} />
        </Svg>
      </View>

      <View className="mt-2.5 flex-row flex-wrap gap-2">
        <Tag index={0} label="Production PV" value={format(productionKwh)} tone="sun" />
        <Tag index={1} label="Consommation" value={format(consumptionKwh)} tone="site" />
        <Tag index={2} label="Export réseau" value={format(exportKwh)} tone="grid" />
        <Tag index={3} label="Import réseau" value={format(importKwh)} tone="grid" />
      </View>
    </View>
  );
}
