import { ActivityIndicator, Text, View } from "react-native";
import { useDeviceScope } from "@/contexts/device-scope-context";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

type DeviceScopeLoadingOverlayProps = {
  className?: string;
};

export function DeviceScopeLoadingOverlay({
  className,
}: DeviceScopeLoadingOverlayProps) {
  const { isScopeLoading, showSwitcher } = useDeviceScope();

  if (!isScopeLoading || !showSwitcher) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityState={{ busy: true }}
      className={cn(
        "absolute inset-0 z-20 items-center rounded-lg bg-white/50 pt-6",
        className,
      )}
    >
      <View className="flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <ActivityIndicator size="small" color={joyaColors.navy} />
        <Text className="text-sm font-medium text-slate-700">
          Mise à jour des données…
        </Text>
      </View>
    </View>
  );
}
