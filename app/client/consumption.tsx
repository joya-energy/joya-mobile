import { useCallback, useState } from "react";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ClientConsumption } from "@/components/client/consumption";

export default function ConsumptionScreen() {
  const [refreshing, setRefreshing] = useState(false);
  // ClientConsumption owns its data (useEdgeConsumption) and exposes no
  // refetch, so pull-to-refresh remounts it with a new key.
  const [consumptionKey, setConsumptionKey] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setConsumptionKey((k) => k + 1);
    // Remount re-triggers every fetch; keep the spinner briefly for feedback.
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 8,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <ClientConsumption key={consumptionKey} />
      </ScrollView>
    </SafeAreaView>
  );
}
