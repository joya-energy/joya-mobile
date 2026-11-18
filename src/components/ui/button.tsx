import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "flex-row items-center justify-center rounded-2xl px-4 py-3",
  {
    variants: {
      variant: {
        default: "bg-coral active:opacity-90",
        destructive: "bg-danger active:opacity-90",
        outline: "border border-line bg-transparent",
        secondary: "bg-blue-soft",
        ghost: "bg-transparent",
        link: "bg-transparent px-0 py-0",
      },
      size: {
        default: "h-11",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
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
}

export function Button({
  className,
  textClassName,
  variant,
  size,
  loading,
  disabled,
  children,
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
        <ActivityIndicator color="#fff" />
      ) : typeof children === "string" ? (
        <Text
          className={cn(labelVariants({ variant }), textClassName)}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

export { buttonVariants };
