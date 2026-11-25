import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dashboard layout (hero → energy flow → performance). */
export function DashboardSkeleton() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Chargement du tableau de bord"
      className="w-full flex-col gap-5 pb-6"
    >
      <View className="rounded-2xl border border-line bg-white p-5 shadow-joya-sm">
        <Skeleton className="h-4 w-36 rounded-full" />
        <Skeleton className="mt-4 h-8 w-3/4" />
        <Skeleton className="mt-3 h-4 w-48" />
        <View className="mt-5 flex-row flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-full" />
          ))}
        </View>
      </View>

      <View className="overflow-hidden rounded-2xl border border-line bg-white shadow-joya-sm">
        <View className="flex-row items-end justify-between gap-3 border-b border-line px-5 py-4">
          <View className="gap-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-56" />
          </View>
          <Skeleton className="h-8 w-8 rounded-full" />
        </View>
        <View className="gap-4 p-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-20 rounded-xl bg-success-soft" />
          <Skeleton className="h-20 rounded-xl bg-coral-wash" />
          <Skeleton className="h-20 rounded-xl bg-blue-soft" />
        </View>
      </View>

      <View className="rounded-2xl border border-line bg-white shadow-joya-sm">
        <View className="border-b border-line px-5 py-4">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="mt-2 h-5 w-40" />
        </View>
        <View className="gap-8 p-5">
          {[4, 4, 3].map((count, row) => (
            <View key={row}>
              <View className="mb-4 flex-row items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-[12px]" />
                <Skeleton className="h-4 w-48" />
              </View>
              <View className="flex-row flex-wrap gap-3">
                {Array.from({ length: count }).map((_, i) => (
                  <Skeleton key={i} className="h-28 min-w-[46%] flex-1 rounded-xl" />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
