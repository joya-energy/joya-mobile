import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementRef,
  type ReactNode,
} from "react";
import {
  RefreshControl,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { ClientContractsCard } from "@/components/client/onboarding-info/client-contracts-card";
import { ClientInvoicesCard } from "@/components/client/onboarding-info/client-invoices-card";
import { ClientStegBillsCard } from "@/components/client/onboarding-info/client-steg-bills-card";
import { EnvironmentalImpactReportsCard } from "@/components/client/onboarding-info/environmental-impact-reports-card";
import { OnboardingInfoPreview } from "@/components/client/onboarding-info/onboarding-info-preview";
import { JoyaErrorState, JoyaLoadingState } from "@/components/joya";
import { useAuth } from "@/contexts/auth-context";
import { useOnboardingSummary } from "@/hooks/use-onboarding-summary";
import { canSeeEnvironmentalImpactReports } from "@/lib/auth/roles";

const SCROLL_TARGETS = [
  "impact-environnemental",
  "factures",
  "factures-steg",
  "mes-contrats",
] as const;

type ScrollTarget = (typeof SCROLL_TARGETS)[number];

function parseScrollTarget(raw: string | string[] | undefined): ScrollTarget | null {
  const value = (Array.isArray(raw) ? raw[0] : raw)?.replace(/^#/, "");
  return SCROLL_TARGETS.find((target) => target === value) ?? null;
}

/** Equivalent of the web `id="…"` anchors: reports its y offset for scrolling. */
function SectionAnchor({
  id,
  onMeasured,
  children,
}: {
  id: ScrollTarget;
  onMeasured: (id: ScrollTarget, y: number) => void;
  children: ReactNode;
}) {
  return (
    <View
      onLayout={(event: LayoutChangeEvent) =>
        onMeasured(id, event.nativeEvent.layout.y)
      }
    >
      {children}
    </View>
  );
}

export default function ClientInformationsScreen() {
  const { user } = useAuth();
  const { summary, loading, error, reload, companyId } = useOnboardingSummary();
  const showReports = canSeeEnvironmentalImpactReports(user?.role);
  const params = useLocalSearchParams<{ section?: string; hash?: string }>();
  const target = parseScrollTarget(params.section ?? params.hash);

  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const offsets = useRef<Partial<Record<ScrollTarget, number>>>({});
  const pendingTarget = useRef<ScrollTarget | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cardsKey, setCardsKey] = useState(0);

  const scrollToPending = useCallback(() => {
    const id = pendingTarget.current;
    if (!id) return;
    const y = offsets.current[id];
    if (y == null) return;
    pendingTarget.current = null;
    // +12 = top padding of the content wrapper, -8 = breathing room.
    scrollRef.current?.scrollTo({ y: Math.max(0, y + 4), animated: true });
  }, []);

  useEffect(() => {
    if (loading) return;
    pendingTarget.current = target;
    scrollToPending();
  }, [loading, target, showReports, summary, scrollToPending]);

  const handleSectionLayout = useCallback(
    (id: ScrollTarget, y: number) => {
      offsets.current[id] = y;
      scrollToPending();
    },
    [scrollToPending],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setCardsKey((key) => key + 1);
    setRefreshing(false);
  }, [reload]);

  let content: ReactNode;
  if (loading && !refreshing) {
    content = <JoyaLoadingState label="Chargement de votre dossier…" />;
  } else if (error || !summary) {
    content = (
      <JoyaErrorState
        className="rounded-2xl border border-line bg-white"
        description={error ?? "Données indisponibles pour le moment."}
        onRetry={() => void reload()}
      />
    );
  } else {
    content = (
      <View className="gap-6">
        <OnboardingInfoPreview summary={summary} />
        {showReports ? (
          <SectionAnchor
            key={`contracts-${cardsKey}`}
            id="mes-contrats"
            onMeasured={handleSectionLayout}
          >
            <ClientContractsCard />
          </SectionAnchor>
        ) : null}
        {companyId ? (
          <SectionAnchor
            key={`steg-${cardsKey}`}
            id="factures-steg"
            onMeasured={handleSectionLayout}
          >
            <ClientStegBillsCard companyId={companyId} />
          </SectionAnchor>
        ) : null}
        <SectionAnchor
          key={`invoices-${cardsKey}`}
          id="factures"
          onMeasured={handleSectionLayout}
        >
          <ClientInvoicesCard />
        </SectionAnchor>
        {showReports ? (
          <SectionAnchor
            key={`reports-${cardsKey}`}
            id="impact-environnemental"
            onMeasured={handleSectionLayout}
          >
            <EnvironmentalImpactReportsCard />
          </SectionAnchor>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-3 pt-3">{content}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
