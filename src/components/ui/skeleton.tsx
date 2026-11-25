import { useEffect } from "react";
import { AccessibilityInfo, View, type ViewProps } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

/**
 * Brand-tinted shimmer placeholder.
 * Outer View carries NativeWind className; Animated layer only uses style
 * (className on Reanimated views crashes css-interop).
 */
function Skeleton({
  className,
  style,
  ...props
}: ViewProps & { className?: string }) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled || reduced) return;
        opacity.value = withRepeat(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          -1,
          true,
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View
      {...props}
      style={style}
      className={cn("overflow-hidden rounded-md bg-slate-200/80", className)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View
        pointerEvents="none"
        style={[{ flex: 1, backgroundColor: "rgba(255,255,255,0.35)" }, animatedStyle]}
      />
    </View>
  );
}

export { Skeleton };
