import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { JoyaEyebrow, JoyaPageHeader } from "@/components/joya";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useClientJourney } from "@/contexts/client-journey-context";
import { clientDashboardApi } from "@/lib/dashboard/api";
import type { ClientDashboardData } from "@/types/dashboard";
import { joyaColors } from "@/theme/colors";

export default function ClientHomeScreen() {
  const { user, logout } = useAuth();
  const { phase, journey, isLoading: journeyLoading, refetchJourney } =
    useClientJourney();
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (phase && phase !== "dashboard") {
        setData(null);
        return;
      }
      const dashboard = await clientDashboardApi.fetch();
      setData(dashboard);
    } catch {
      setError(
        phase === "dashboard"
          ? "Impossible de charger le tableau de bord."
          : null,
      );
      setData(null);
    } finally {
      setLoadingDash(false);
    }
  }, [phase]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refetchJourney()]);
    setRefreshing(false);
  };

  const firstName = user?.full_name?.split(" ")[0];
  const kpis = data?.kpis?.slice(0, 4) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mb-4 mt-2 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <JoyaPageHeader
              eyebrow="Espace client"
              title={`Bonjour${firstName ? `, ${firstName}` : ""}`}
              description={
                journeyLoading
                  ? "Chargement du parcours…"
                  : `Phase : ${phase ?? "—"}`
              }
            />
          </View>
          <Pressable
            onPress={logout}
            className="rounded-full border border-line bg-white px-3 py-2"
          >
            <Text className="text-xs font-semibold text-coral-dark">
              Déconnexion
            </Text>
          </Pressable>
        </View>

        {loadingDash && phase === "dashboard" ? (
          <ActivityIndicator color={joyaColors.coral} className="mt-10" />
        ) : null}

        {error ? (
          <Text className="mb-3 text-sm text-danger">{error}</Text>
        ) : null}

        {phase && phase !== "dashboard" ? (
          <Card className="mb-4 rounded-2xl">
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
                      Ouvrir l&apos;intégration
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

        <View className="gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.id} className="rounded-2xl">
              <CardContent className="gap-1 p-5">
                <JoyaEyebrow>{kpi.label}</JoyaEyebrow>
                <Text className="font-display text-3xl font-bold text-navy">
                  {kpi.displayValue}
                </Text>
                {kpi.footnote ? (
                  <Text className="text-sm text-ink-muted">{kpi.footnote}</Text>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </View>

        <View className="mt-6 gap-2">
          <Text className="font-display text-base font-semibold text-navy">
            Raccourcis
          </Text>
          <Link href="/client/monitoring" asChild>
            <Pressable className="rounded-2xl border border-line bg-white px-4 py-3.5">
              <Text className="font-medium text-navy">Suivi / monitoring</Text>
            </Pressable>
          </Link>
          <Link href="/client/consumption" asChild>
            <Pressable className="rounded-2xl border border-line bg-white px-4 py-3.5">
              <Text className="font-medium text-navy">Consommation</Text>
            </Pressable>
          </Link>
          <Link href="/client/informations" asChild>
            <Pressable className="rounded-2xl border border-line bg-white px-4 py-3.5">
              <Text className="font-medium text-navy">Mes informations</Text>
            </Pressable>
          </Link>
          <Link href="/client/profile" asChild>
            <Pressable className="rounded-2xl border border-line bg-white px-4 py-3.5">
              <Text className="font-medium text-navy">Profil</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
