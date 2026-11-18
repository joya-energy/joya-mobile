import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor = "rgba(23,59,94,0.4)", ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor}
        className={cn(
          "h-11 rounded-xl border border-line bg-white px-3 text-base text-navy",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
