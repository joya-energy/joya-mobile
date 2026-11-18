import { BlurView } from "expo-blur";
import { Link, usePathname } from "expo-router";
import { Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ClipboardList,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import { useAuth } from "@/contexts/auth-context";
import { useClientJourney } from "@/contexts/client-journey-context";
import { isManager, isTechnicalReferent } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const MOBILE_NAV_LABELS: Record<string, string> = {
  "Tableau de bord": "Accueil",
  "Mes informations": "Infos",
  "Mes contrats": "Contrats",
  "Suivi du projet": "Suivi",
  Suivi: "Suivi",
  Intégration: "Intégration",
};

function buildMainNav(
  pathname: string,
  phase: string | null,
  role?: string | null,
): (NavItem & { active: boolean })[] {
  const withActive = (items: NavItem[]) =>
    items.map((item) => ({
      ...item,
      active:
        item.href === "/client"
          ? pathname === "/client" || pathname === "/client/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`),
    }));

  if (isTechnicalReferent(role) || !isManager(role)) {
    return withActive([
      { label: "Tableau de bord", href: "/client", icon: LayoutDashboard },
      { label: "Suivi", href: "/client/monitoring", icon: Zap },
      { label: "Consommation", href: "/client/consumption", icon: Gauge },
    ]);
  }

  if (phase === "follow_up") {
    return withActive([
      { label: "Suivi du projet", href: "/client/follow-up", icon: ListChecks },
      {
        label: "Mes informations",
        href: "/client/informations",
        icon: FolderOpen,
      },
    ]);
  }

  if (phase === "dashboard") {
    return withActive([
      { label: "Tableau de bord", href: "/client", icon: LayoutDashboard },
      { label: "Suivi", href: "/client/monitoring", icon: Zap },
      { label: "Consommation", href: "/client/consumption", icon: Gauge },
      {
        label: "Mes informations",
        href: "/client/informations",
        icon: FolderOpen,
      },
    ]);
  }

  if (phase === "onboarding" || phase === "pending_review") {
    return withActive([
      {
        label: "Intégration",
        href: "/client/onboarding",
        icon: ClipboardList,
      },
    ]);
  }

  return withActive([
    { label: "Tableau de bord", href: "/client", icon: LayoutDashboard },
  ]);
}

/** Floating glass tab bar — mirrors customer-web client-mobile-nav. */
export function ClientMobileNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const journey = useClientJourney();
  const phase = journey?.phase ?? null;
  const mainNav = buildMainNav(pathname, phase, user?.role);

  if (mainNav.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: Math.max(12, insets.bottom),
        zIndex: 50,
      }}
    >
      <BlurView
        intensity={40}
        tint="light"
        className="overflow-hidden rounded-3xl border border-white/70"
        style={{
          backgroundColor: "rgba(255,255,255,0.72)",
        }}
      >
        <View className="h-16 flex-row items-stretch gap-1 p-1.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href as never} asChild>
                <Pressable
                  className={cn(
                    "min-w-0 flex-1 items-center justify-center gap-0.5 rounded-2xl px-1",
                    item.active && "bg-white",
                  )}
                  style={
                    item.active
                      ? {
                          shadowColor: "#173B5E",
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 2,
                        }
                      : undefined
                  }
                >
                  <Icon
                    size={20}
                    color={item.active ? joyaColors.coral : "#93A2B4"}
                    strokeWidth={item.active ? 2.1 : 1.75}
                  />
                  <Text
                    numberOfLines={1}
                    className={cn(
                      "max-w-full text-[10.5px]",
                      item.active
                        ? "font-semibold text-navy"
                        : "font-medium text-slate-500",
                    )}
                  >
                    {MOBILE_NAV_LABELS[item.label] ?? item.label}
                  </Text>
                </Pressable>
              </Link>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}
