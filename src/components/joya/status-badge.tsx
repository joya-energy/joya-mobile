import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

export type JoyaStatus = "success" | "warning" | "danger" | "neutral" | "info";

const STATUS_STYLE: Record<JoyaStatus, { chip: string; text: string; dot: string }> = {
  success: {
    chip: "border-success/20 bg-success-soft",
    text: "text-success-strong",
    dot: "bg-success",
  },
  warning: {
    chip: "border-warning/25 bg-warning-soft",
    text: "text-warning-strong",
    dot: "bg-warning",
  },
  danger: {
    chip: "border-danger/20 bg-danger-soft",
    text: "text-danger-strong",
    dot: "bg-danger",
  },
  info: {
    chip: "border-blue/15 bg-blue-tint",
    text: "text-blue",
    dot: "bg-blue",
  },
  neutral: {
    chip: "border-line bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
  },
};

type JoyaStatusBadgeProps = {
  status: JoyaStatus;
  label: string;
  /** Animated halo for live states — reserved for future Reanimated pulse. */
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** Equipment / document / invoice status — always dot + text (never colour alone). */
export function JoyaStatusBadge({
  status,
  label,
  size = "md",
  className,
}: JoyaStatusBadgeProps) {
  const style = STATUS_STYLE[status];
  return (
    <View
      className={cn(
        "max-w-full flex-row items-center gap-1.5 rounded-full border",
        size === "sm" ? "h-5 px-2" : "h-6 px-2.5",
        style.chip,
        className,
      )}
    >
      <View className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
      <Text
        className={cn(
          "font-medium",
          size === "sm" ? "text-[11px]" : "text-xs",
          style.text,
        )}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
