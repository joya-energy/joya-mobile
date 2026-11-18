import { Stack } from "expo-router";
import { joyaColors } from "@/theme/colors";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: joyaColors.cream },
      }}
    />
  );
}
