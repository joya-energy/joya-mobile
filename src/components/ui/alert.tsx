import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

type Tone = "danger" | "warning" | "success" | "info";

const toneClass: Record<Tone, string> = {
  danger: "border-danger/30 bg-danger-soft",
  warning: "border-warning/30 bg-warning-soft",
  success: "border-success/30 bg-success-soft",
  info: "border-blue/30 bg-blue-soft",
};

const titleTone: Record<Tone, string> = {
  danger: "text-danger-strong",
  warning: "text-warning-strong",
  success: "text-success-strong",
  info: "text-navy",
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
  ...props
}: ViewProps & {
  className?: string;
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <View
      className={cn("rounded-xl border p-3.5", toneClass[tone], className)}
      {...props}
    >
      {title ? (
        <Text className={cn("mb-1 text-sm font-semibold", titleTone[tone])}>
          {title}
        </Text>
      ) : null}
      {typeof children === "string" ? (
        <Text className="text-sm leading-relaxed text-navy">{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
