import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/utils";

type JoyaEyebrowProps = {
  children: ReactNode;
  className?: string;
};

/** Plex Mono uppercase label with coral dot — landing `.eyebrow`. */
export function JoyaEyebrow({ children, className }: JoyaEyebrowProps) {
  return (
    <View className={cn("mb-1 flex-row items-center gap-2", className)}>
      <View className="h-1.5 w-1.5 rounded-full bg-coral" />
      <Text className="font-data text-[11.5px] uppercase tracking-[0.1em] text-coral-dark">
        {children}
      </Text>
    </View>
  );
}

type JoyaPageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  image?: string | number;
  className?: string;
};

export function JoyaPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  image,
  className,
}: JoyaPageHeaderProps) {
  if (image) {
    return (
      <View
        className={cn(
          "relative overflow-hidden rounded-3xl bg-navy-dark px-6 py-8",
          className,
        )}
      >
        <Image
          source={typeof image === "string" ? { uri: image } : image}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
          contentFit="cover"
        />
        <LinearGradient
          colors={[
            "rgba(15,42,68,0.94)",
            "rgba(15,42,68,0.72)",
            "rgba(15,42,68,0.2)",
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        />
        <View className="gap-3">
          {eyebrow ? (
            typeof eyebrow === "string" ? (
              <JoyaEyebrow>
                <Text className="text-coral-tint">{eyebrow}</Text>
              </JoyaEyebrow>
            ) : (
              eyebrow
            )
          ) : null}
          <Text className="font-display text-3xl font-extrabold leading-tight tracking-tight text-cream">
            {title}
          </Text>
          {description ? (
            <Text className="text-[15px] leading-relaxed text-cream/80">
              {description}
            </Text>
          ) : null}
          {meta}
          {actions}
        </View>
      </View>
    );
  }

  return (
    <View className={cn("gap-2", className)}>
      {typeof eyebrow === "string" ? (
        <JoyaEyebrow>{eyebrow}</JoyaEyebrow>
      ) : (
        eyebrow
      )}
      <Text className="font-display text-2xl font-bold tracking-tight text-navy">
        {title}
      </Text>
      {description ? (
        <Text className="text-[15px] leading-relaxed text-ink-muted">
          {description}
        </Text>
      ) : null}
      {meta}
      {actions}
    </View>
  );
}

type JoyaSectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  index?: number | string;
  icon?: ReactNode;
  iconVariant?: "wash" | "filled";
  indexVariant?: "wash" | "filled";
  actions?: ReactNode;
  className?: string;
  /** Web parity prop — ignored on native (always Text). */
  as?: "h2" | "h3";
};

/** Section title — numbered variant matches the web report header. */
export function JoyaSectionHeader({
  title,
  description,
  index,
  icon,
  iconVariant = "wash",
  indexVariant = "wash",
  actions,
  className,
}: JoyaSectionHeaderProps) {
  const chip =
    index != null ? (
      <View
        className={cn(
          "h-10 w-10 items-center justify-center rounded-[12px]",
          indexVariant === "filled" ? "bg-coral" : "bg-coral-soft",
        )}
      >
        <Text
          className={cn(
            "font-data text-[13px] font-semibold tabular-nums",
            indexVariant === "filled" ? "text-white" : "text-coral-dark",
          )}
        >
          {typeof index === "number" ? String(index).padStart(2, "0") : index}
        </Text>
      </View>
    ) : icon ? (
      <View
        className={cn(
          "h-10 w-10 items-center justify-center rounded-[12px]",
          iconVariant === "filled" ? "bg-coral" : "bg-coral-soft",
        )}
      >
        {icon}
      </View>
    ) : null;

  return (
    <View className={cn("mb-3 gap-2", className)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-3">
          {chip}
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-display text-base font-semibold text-navy">
              {title}
            </Text>
            {description ? (
              <Text className="text-sm text-ink-muted">{description}</Text>
            ) : null}
          </View>
        </View>
        {actions}
      </View>
    </View>
  );
}
