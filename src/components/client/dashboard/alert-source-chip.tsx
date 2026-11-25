import { Text, View } from "react-native";
import { cn } from "@/lib/utils";

type AlertSourceChipProps = {
  label?: string;
  variant?: "default" | "modal";
  className?: string;
};

export function AlertSourceChip({
  label,
  variant = "default",
  className,
}: AlertSourceChipProps) {
  if (!label?.trim()) return null;

  return (
    <View
      className={cn(
        "max-w-full self-start rounded-full px-2 py-0.5",
        variant === "modal"
          ? "border border-white/20 bg-white/10"
          : "bg-slate-100",
        className,
      )}
    >
      <Text
        numberOfLines={1}
        className={cn(
          "text-[10px] font-medium",
          variant === "modal" ? "text-white/80" : "text-slate-600",
        )}
      >
        {label}
      </Text>
    </View>
  );
}
