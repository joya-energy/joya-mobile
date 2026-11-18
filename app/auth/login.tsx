import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

/**
 * Placeholder route — login-form.tsx will be adjusted from the copied web
 * component (DOM → RN) in the next pass.
 */
export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream px-6">
      <View className="flex-1 justify-center">
        <Text className="font-display text-2xl font-bold text-navy">
          Connexion
        </Text>
        <Text className="mt-2 text-ink-muted">
          Auth API + SecureStore Bearer is wired. UI form port from
          src/components/auth/login-form.tsx is next.
        </Text>
        <Link href="/" className="mt-6 text-coral">
          Retour
        </Link>
      </View>
    </SafeAreaView>
  );
}
