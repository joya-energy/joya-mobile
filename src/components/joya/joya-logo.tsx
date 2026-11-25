import { Image } from "expo-image";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { cn } from "@/lib/utils";

const MARK = require("../../../assets/brand/apple-touch-icon.png");
const FULL = require("../../../assets/brand/joya-energy-logo.png");

const FULL_RATIO = 288 / 122;

type JoyaLogoProps = {
  /** `full` = mark + wordmark, `mark` = coral app tile. */
  variant?: "full" | "mark";
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** Rendered height in px (width follows the asset ratio). */
  height?: number;
};

/** Official Joya Energy logo — same assets as customer-web. */
export function JoyaLogo({
  variant = "full",
  className,
  style,
  height = 32,
}: JoyaLogoProps) {
  if (variant === "mark") {
    return (
      <View className={cn("shrink-0 overflow-hidden rounded-[28%]", className)} style={style}>
        <Image
          source={MARK}
          style={{ width: height, height }}
          contentFit="cover"
          accessibilityLabel="Joya Energy"
        />
      </View>
    );
  }

  const width = Math.round(height * FULL_RATIO);
  return (
    <View className={cn("shrink-0", className)} style={style}>
      <Image
        source={FULL}
        style={{ width, height }}
        contentFit="contain"
        accessibilityLabel="Joya Energy"
      />
    </View>
  );
}
