import * as React from "react";
import { Text, View, type ViewProps, type TextProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "rounded-xl border border-line bg-white shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("flex flex-col gap-1 p-5", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      className={cn(
        "font-display text-lg font-semibold leading-tight text-navy",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      className={cn("text-sm leading-relaxed text-ink-muted", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return <View className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-3 border-t border-line px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}
