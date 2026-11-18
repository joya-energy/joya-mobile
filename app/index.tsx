import { Link } from "expo-router";
import { Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { joyaColors } from "@/theme/colors";

/**
 * Temporary home while screens are adjusted from the customer-web copies.
 * Public funnel + client routes land here next.
 */
export default function HomeScreen() {
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: joyaColors.cream }}
      className="flex-1 bg-cream"
    >
      <View className="flex-1 justify-center px-6">
        <Text className="font-display text-3xl font-bold text-navy">JOYA</Text>
        <Text className="mt-2 text-base text-ink-muted">
          Mobile client — source copied from customer-web, adjusting for React
          Native.
        </Text>

        <Link href="/auth/login" asChild>
          <Pressable className="mt-8 items-center rounded-2xl bg-coral px-5 py-3.5 active:opacity-90">
            <Text className="font-semibold text-white">Connexion</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
