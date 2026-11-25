import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { AccessibilityInfo } from "react-native";
import { CalendarDays, Clock3, Gauge, MapPin } from "lucide-react-native";
import type { ClientDashboardSite } from "@/types/dashboard";
import { CLIENT_DASHBOARD_MISSING } from "@/lib/dashboard/defaults";
import { useAuth } from "@/contexts/auth-context";
import { CountUp } from "@/components/joya/count-up";
import { joyaColors } from "@/theme/colors";

const HERO_IMAGE = require("../../../../assets/brand/images/installer-hand-on-solar-panel-sunset.jpg");

const SITE_STATUS: Record<
  ClientDashboardSite["status"],
  { label: string; color: string }
> = {
  online: { label: "Installation en ligne", color: "#4ade80" },
  offline: { label: "Installation hors ligne", color: joyaColors.danger },
  maintenance: { label: "Maintenance en cours", color: joyaColors.warning },
};

function present(value: string | undefined | null): value is string {
  const trimmed = value?.trim();
  return Boolean(trimmed) && trimmed !== CLIENT_DASHBOARD_MISSING;
}

function GlassChip({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="max-w-full flex-row items-center gap-1.5 rounded-full border border-white/20 bg-white/10 py-1 pl-2.5 pr-3">
      <View className="opacity-90">{icon}</View>
      <Text className="shrink text-[12px] text-cream/85" numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

function StatusPulse({ color }: { color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled || reduced) return;
        scale.value = withRepeat(
          withTiming(2.2, { duration: 1400, easing: Easing.out(Easing.quad) }),
          -1,
          false,
        );
        opacity.value = withRepeat(
          withTiming(0, { duration: 1400, easing: Easing.out(Easing.quad) }),
          -1,
          false,
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [opacity, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View className="relative h-2 w-2 items-center justify-center">
      <Animated.View
        style={[
          {
            position: "absolute",
            height: 8,
            width: 8,
            borderRadius: 999,
            backgroundColor: color,
          },
          pulseStyle,
        ]}
      />
      <View
        style={{
          height: 8,
          width: 8,
          borderRadius: 999,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

type DashboardHeroProps = {
  site: ClientDashboardSite;
  dailySavingsValue: string;
  actions?: ReactNode;
};

/**
 * Dashboard opener: solar photo, navy scrim, Archivo headline, glass chips.
 */
export function DashboardHero({
  site,
  dailySavingsValue,
  actions,
}: DashboardHeroProps) {
  const { user } = useAuth();
  const firstName = user?.full_name?.split(" ")[0];
  const status = SITE_STATUS[site.status] ?? SITE_STATUS.online;
  const location = present(site.siteLocation)
    ? site.siteLocation
    : present(site.addressLine)
      ? site.addressLine
      : null;

  return (
    <View className="relative isolate w-full overflow-hidden bg-navy-dark">
      <Image
        source={HERO_IMAGE}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          opacity: 0.7,
        }}
        contentFit="cover"
        contentPosition="center"
      />
      <LinearGradient
        colors={[
          "rgba(15,42,68,0.94)",
          "rgba(15,42,68,0.78)",
          "rgba(15,42,68,0.25)",
        ]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View className="gap-4 p-5">
        <View className="min-w-0 gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-2">
              <View className="h-1.5 w-1.5 rounded-full bg-coral" />
              <Text className="font-data text-[11.5px] uppercase tracking-[0.1em] text-coral-tint">
                {firstName ? `Bonjour ${firstName}` : "Tableau de bord"}
              </Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1">
              <StatusPulse color={status.color} />
              <Text className="text-[11.5px] font-semibold text-cream">
                {status.label}
              </Text>
            </View>
          </View>

          <Text className="font-display text-[1.85rem] font-extrabold leading-[1.05] tracking-tight text-cream">
            {present(site.siteName) ? site.siteName : "Mon installation"}
          </Text>

          {location ? (
            <View className="flex-row items-center gap-1.5">
              <MapPin size={16} color={joyaColors.coralTint ?? "#F6C7B8"} />
              <Text className="shrink text-[14px] text-cream/75" numberOfLines={2}>
                {location}
              </Text>
            </View>
          ) : null}

          <View className="mt-1 flex-row flex-wrap gap-1.5">
            {present(site.installedCapacityLabel) ? (
              <GlassChip
                icon={<Gauge size={14} color={joyaColors.coralTint ?? "#F6C7B8"} />}
              >
                {site.installedCapacityLabel}
              </GlassChip>
            ) : null}
            {present(site.dayLabel) ? (
              <GlassChip
                icon={
                  <CalendarDays size={14} color={joyaColors.coralTint ?? "#F6C7B8"} />
                }
              >
                {site.dayLabel}
              </GlassChip>
            ) : null}
            {present(site.lastUpdatedAt) ? (
              <GlassChip
                icon={<Clock3 size={14} color={joyaColors.coralTint ?? "#F6C7B8"} />}
              >
                {`Mis à jour ${site.lastUpdatedAt}`}
              </GlassChip>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
          <Text className="max-w-[55%] font-data text-[10.5px] uppercase tracking-[0.1em] text-cream/70">
            Économie financière journalière
          </Text>
          <CountUp
            text={dailySavingsValue}
            className="font-display text-[1.75rem] font-extrabold leading-none tracking-tight text-coral"
          />
        </View>
      </View>

      {actions ? (
        <View className="absolute right-4 top-4 flex-row items-center gap-2">
          {actions}
        </View>
      ) : null}
    </View>
  );
}
