import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronRight } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-2xl px-4",
  {
    variants: {
      variant: {
        default: "bg-coral active:opacity-90",
        destructive: "bg-danger active:opacity-90",
        outline: "border border-line bg-transparent",
        secondary: "bg-blue-soft",
        ghost: "bg-transparent",
        link: "bg-transparent px-0",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3",
        lg: "h-12 px-5",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const labelVariants = cva("text-center text-sm font-semibold", {
  variants: {
    variant: {
      default: "text-white",
      destructive: "text-white",
      outline: "text-navy",
      secondary: "text-navy",
      ghost: "text-navy",
      link: "text-coral",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface ButtonProps
  extends Omit<PressableProps, "children">,
    VariantProps<typeof buttonVariants> {
  className?: string;
  textClassName?: string;
  loading?: boolean;
  children?: React.ReactNode;
  /** Web leftover — ignored on native */
  asChild?: boolean;
  type?: string;
}

export function Button({
  className,
  textClassName,
  variant,
  size,
  loading,
  disabled,
  children,
  asChild: _asChild,
  type: _type,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        buttonVariants({ variant, size }),
        isDisabled && "opacity-50",
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "default" || !variant ? "#fff" : joyaColors.navy}
        />
      ) : typeof children === "string" ? (
        <Text className={cn(labelVariants({ variant }), textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

/** Coral chevron puck used inside primary CTAs on web. */
export function ButtonPuck({
  className,
  icon,
}: {
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View
      className={cn(
        "ml-2 h-8 w-8 items-center justify-center rounded-full bg-white/20",
        className,
      )}
    >
      {icon ?? <ChevronRight size={18} color="#fff" />}
    </View>
  );
}

export { buttonVariants };
