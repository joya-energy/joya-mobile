import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { joyaColors } from "@/theme/colors";

/** Entry: send authenticated users to client, others to login. */
export default function Index() {
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

  if (isAuthenticated) {
    return <Redirect href={"/client" as never} />;
  }

  return <Redirect href={"/auth/login" as never} />;
}
