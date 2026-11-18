import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LoginForm } from "@/components/auth/login-form";
import { Text } from "react-native";

export default function LoginScreen() {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
          className="px-5"
        >
          <View className="mb-6 items-center pt-6">
            <Text className="font-display text-3xl font-bold text-navy">
              JOYA
            </Text>
            <Text className="mt-1 text-sm text-ink-muted">Énergie solaire</Text>
          </View>
          <LoginForm />
          <View className="h-10" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
