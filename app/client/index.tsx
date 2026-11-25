import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { JoyaEyebrow, JoyaLogo } from "@/components/joya";
import { Card, CardContent } from "@/components/ui/card";
import { ClientDashboard } from "@/components/client/dashboard/client-dashboard";
import { useAuth } from "@/contexts/auth-context";
import { useClientJourney } from "@/contexts/client-journey-context";
import { useResolvedAvatarUrl } from "@/hooks/use-resolved-avatar-url";
import { joyaColors } from "@/theme/colors";

export default function ClientHomeScreen() {
  const { user, logout } = useAuth();
  const { phase, isLoading: journeyLoading, refetchJourney } =
    useClientJourney();
  const [refreshing, setRefreshing] = useState(false);
  const [dashKey, setDashKey] = useState(0);
  const { src: avatarSrc, failed, setFailed } = useResolvedAvatarUrl(
    user?.avatar,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchJourney();
    setDashKey((k) => k + 1);
    setRefreshing(false);
  }, [refetchJourney]);

  const showDashboard = !phase || phase === "dashboard";

  const initials = useMemo(() => {
    const parts = (user?.full_name ?? "").split(" ").filter(Boolean).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "J";
  }, [user?.full_name]);

  const showAvatar = Boolean(avatarSrc) && !failed;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mb-3 mt-2 flex-row items-center justify-between px-4">
          <Pressable
            onPress={() => router.push("/client")}
            accessibilityRole="button"
            accessibilityLabel="Joya Energy — accueil"
            hitSlop={8}
          >
            <JoyaLogo variant="mark" height={32} />
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push("/client/profile")}
              accessibilityRole="button"
              accessibilityLabel="Mon profil"
              className="h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-coral-soft"
              style={{
                shadowColor: joyaColors.navy,
                shadowOpacity: 0.1,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: 2,
              }}
            >
              {showAvatar ? (
                <Image
                  source={{ uri: avatarSrc! }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  onError={() => setFailed(true)}
                  accessibilityLabel={user?.full_name ?? "Profil"}
                />
              ) : (
                <Text className="font-display text-[13px] font-bold text-coral">
                  {initials}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={logout}
              className="rounded-full border border-line bg-white px-3 py-2"
            >
              <Text className="text-xs font-semibold text-coral-dark">
                Déconnexion
              </Text>
            </Pressable>
          </View>
        </View>

        {journeyLoading ? (
          <Text className="mb-3 px-3 text-sm text-ink-muted">
            Chargement du parcours…
          </Text>
        ) : null}

        {phase && phase !== "dashboard" ? (
          <Card className="mx-3 mb-4 rounded-2xl">
            <CardContent className="gap-2 p-5">
              <JoyaEyebrow>Parcours</JoyaEyebrow>
              <Text className="font-display text-xl font-bold text-navy">
                {phase === "welcome"
                  ? "Bienvenue"
                  : phase === "onboarding" || phase === "pending_review"
                    ? "Intégration en cours"
                    : phase === "follow_up"
                      ? "Suivi du projet"
                      : phase}
              </Text>
              <Text className="text-sm text-ink-muted">
                Utilisez la barre de navigation pour continuer.
              </Text>
              {phase === "welcome" ? (
                <Link href="/client/welcome" asChild>
                  <Pressable className="mt-2 rounded-2xl bg-coral px-4 py-3">
                    <Text className="text-center font-semibold text-white">
                      Commencer
                    </Text>
                  </Pressable>
                </Link>
              ) : null}
              {phase === "onboarding" || phase === "pending_review" ? (
                <Link href="/client/onboarding" asChild>
                  <Pressable className="mt-2 rounded-2xl bg-coral px-4 py-3">
                    <Text className="text-center font-semibold text-white">
                      Ouvrir l'intégration
                    </Text>
                  </Pressable>
                </Link>
              ) : null}
              {phase === "follow_up" ? (
                <Link href="/client/follow-up" asChild>
                  <Pressable className="mt-2 rounded-2xl bg-coral px-4 py-3">
                    <Text className="text-center font-semibold text-white">
                      Voir le suivi
                    </Text>
                  </Pressable>
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {showDashboard ? <ClientDashboard key={dashKey} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
