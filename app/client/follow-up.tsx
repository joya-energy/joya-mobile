import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementRef,
} from "react";
import {
  RefreshControl,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FollowUpTimeline, {
  type FollowUpDateRequest,
  type FollowUpStage,
} from "@/components/client/follow-up/follow-up-timeline";
import { JoyaLoadingState } from "@/components/joya";
import { useClientJourney } from "@/contexts/client-journey-context";
import { journeyApi } from "@/lib/journey/api";
import { subscribeAppRefresh } from "@/lib/realtime/app-refresh";
import { toast } from "@/lib/toast";

export default function FollowUpScreen() {
  const { refetchJourney } = useClientJourney();
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null);
  const timelineYRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [stages, setStages] = useState<FollowUpStage[]>([]);
  const [requests, setRequests] = useState<FollowUpDateRequest[]>([]);

  const loadTimeline = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? hasLoadedOnceRef.current;

    // `isInitialLoading` starts true, so the first (foreground) load needs no flag flip.
    try {
      const data = await journeyApi.getFollowUpTimeline();
      setStages(data.stages as FollowUpStage[]);
      setRequests(data.dateRequests as FollowUpDateRequest[]);
      hasLoadedOnceRef.current = true;
    } catch (error) {
      if (!background) {
        setStages([]);
        setRequests([]);
      }
      toast.error(
        error instanceof Error
          ? error.message
          : "Impossible de charger le suivi du projet.",
      );
    } finally {
      if (!background) setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    // Async data fetch on mount: state is only set after the awaited request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTimeline();
  }, [loadTimeline]);

  useEffect(() => {
    return subscribeAppRefresh("follow_up", () => {
      void loadTimeline({ background: true });
    });
  }, [loadTimeline]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTimeline({ background: true });
    } finally {
      setRefreshing(false);
    }
  }, [loadTimeline]);

  const handleSubmitDateRequest = async (payload: {
    stageId: number;
    requestedDate: string;
    message: string;
  }) => {
    setRequestSubmitting(true);
    try {
      await journeyApi.requestFollowUpDateChange(payload);
      await loadTimeline({ background: true });
      await refetchJourney();
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleTimelineLayout = useCallback((event: LayoutChangeEvent) => {
    timelineYRef.current = event.nativeEvent.layout.y;
  }, []);

  const handleEditPanelLayout = useCallback((y: number) => {
    // +12 = top padding of the content wrapper.
    scrollRef.current?.scrollTo({
      y: Math.max(0, timelineYRef.current + y + 12 - 8),
      animated: true,
    });
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-3 pt-3">
          {isInitialLoading ? (
            <JoyaLoadingState label="Chargement du suivi de votre projet…" />
          ) : (
            <View onLayout={handleTimelineLayout}>
              <FollowUpTimeline
                stages={stages}
                requests={requests}
                onSubmitDateRequest={handleSubmitDateRequest}
                requestSubmitting={requestSubmitting}
                onEditPanelLayout={handleEditPanelLayout}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
