import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { JoyaPageHeader } from "@/components/joya";

export function ClientScreenScaffold({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <View className="mb-5 mt-2">
          <JoyaPageHeader
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
