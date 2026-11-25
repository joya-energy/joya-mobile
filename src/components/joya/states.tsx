import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  AlertTriangle,
  Inbox,
  type LucideIcon,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { joyaColors } from "@/theme/colors";

type JoyaEmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function JoyaEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
  style,
}: JoyaEmptyStateProps) {
  return (
    <View
      style={style}
      className={cn(
        "items-center justify-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <View
        className={cn(
          "items-center justify-center rounded-2xl bg-coral-soft",
          compact ? "h-10 w-10" : "h-14 w-14",
        )}
      >
        <Icon
          size={compact ? 20 : 24}
          color={joyaColors.coral}
        />
      </View>
      <Text
        className={cn(
          "text-center font-display font-semibold text-navy",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </Text>
      {description ? (
        <Text className="max-w-sm text-center text-[13px] leading-relaxed text-ink-muted">
          {description}
        </Text>
      ) : null}
      {action ? <View className="mt-1">{action}</View> : null}
    </View>
  );
}

type JoyaErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  compact?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function JoyaErrorState({
  title = "Impossible de charger ces données",
  description = "Vérifiez votre connexion ou réessayez dans un instant.",
  onRetry,
  retryLabel = "Réessayer",
  compact = false,
  className,
  style,
}: JoyaErrorStateProps) {
  return (
    <View
      style={style}
      accessibilityRole="alert"
      className={cn(
        "items-center justify-center",
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14",
        className,
      )}
    >
      <View
        className={cn(
          "items-center justify-center rounded-2xl bg-danger-soft",
          compact ? "h-10 w-10" : "h-14 w-14",
        )}
      >
        <AlertTriangle
          size={compact ? 20 : 24}
          color={joyaColors.danger}
        />
      </View>
      <Text
        className={cn(
          "text-center font-display font-semibold text-navy",
          compact ? "text-sm" : "text-base",
        )}
      >
        {title}
      </Text>
      {description ? (
        <Text className="max-w-sm text-center text-[13px] leading-relaxed text-ink-muted">
          {description}
        </Text>
      ) : null}
      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onPress={onRetry}
          className="mt-1"
        >
          {retryLabel}
        </Button>
      ) : null}
    </View>
  );
}

export function JoyaLoadingState({
  label = "Chargement…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <View
      accessibilityRole="progressbar"
      className={cn(
        "min-h-[40vh] items-center justify-center gap-3",
        className,
      )}
    >
      <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-joya-sm">
        <ActivityIndicator color={joyaColors.coral} />
      </View>
      <Text className="text-[13px] font-medium text-ink-muted">{label}</Text>
    </View>
  );
}
