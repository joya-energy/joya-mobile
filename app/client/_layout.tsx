import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { ClientJourneyProvider } from "@/contexts/client-journey-context";
import { ClientMobileNav } from "@/components/client/client-mobile-nav";
import { joyaColors } from "@/theme/colors";

export default function ClientLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: joyaColors.cream,
        }}
      >
        <ActivityIndicator color={joyaColors.coral} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={"/auth/login" as never} />;
  }

  return (
    <ClientJourneyProvider>
      <View style={{ flex: 1, backgroundColor: joyaColors.cream }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: joyaColors.cream },
          }}
        />
        <ClientMobileNav />
      </View>
    </ClientJourneyProvider>
  );
}
