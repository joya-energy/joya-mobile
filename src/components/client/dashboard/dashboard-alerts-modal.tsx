import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Bell, X } from "lucide-react";
import type { DashboardAlert } from "@/types/dashboard";
import { DASHBOARD_ALERTS_CARD_BG, DASHBOARD_CHART_COLOR } from "./constants";
import { DashboardAlertsList } from "./dashboard-alerts-list";

type DashboardAlertsModalProps = {
  open: boolean;
  onClose: () => void;
  alerts: DashboardAlert[];
  titleId?: string;
};

export function DashboardAlertsModal({
  open,
  onClose,
  alerts,
}: DashboardAlertsModalProps) {
  const count = alerts.length;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center p-4">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={onClose}
          className="absolute inset-0 bg-navy-deep/50"
        />
        <View
          accessibilityViewIsModal
          className="w-full max-w-[40rem] overflow-hidden rounded-2xl border border-white/10"
          style={{ backgroundColor: DASHBOARD_ALERTS_CARD_BG, maxHeight: "88%" }}
        >
          <View className="flex-row items-center gap-3 border-b border-white/15 px-5 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-coral/20">
              <Bell size={20} color={DASHBOARD_CHART_COLOR} />
            </View>
            <Text
              accessibilityRole="header"
              className="font-display text-xl font-bold tracking-tight text-white"
            >
              Alertes
            </Text>
            {count > 0 ? (
              <View
                className="h-7 min-w-7 items-center justify-center rounded-full px-2"
                style={{ backgroundColor: DASHBOARD_CHART_COLOR }}
              >
                <Text className="text-xs font-bold text-white">{count}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer la fenêtre"
              className="ml-auto h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            >
              <X size={20} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>
          <ScrollView
            className="shrink"
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16 }}
          >
            <DashboardAlertsList alerts={alerts} variant="modal" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
