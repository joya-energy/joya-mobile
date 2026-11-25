import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function ConsumptionSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement de la consommation"
      className="w-full flex-col gap-4 pb-8"
    >
      <Skeleton className="h-14 rounded-xl bg-slate-200/60" />
      <Skeleton className="h-28 rounded-xl bg-white" />
      <View className="flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl bg-white" />
        ))}
      </View>
      <View className="flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl bg-white" />
        ))}
      </View>
      <Skeleton className="h-64 rounded-xl bg-white" />
    </View>
  );
}
