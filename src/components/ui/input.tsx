import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export interface InputProps extends TextInputProps {
  className?: string;
  /** Web leftovers ignored on native */
  type?: string;
  inputMode?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      className,
      placeholderTextColor = "rgba(23,59,94,0.4)",
      type,
      inputMode,
      secureTextEntry,
      ...props
    },
    ref,
  ) => {
    const secure =
      secureTextEntry ??
      (type === "password" ? true : type === "text" ? false : undefined);

    return (
      <TextInput
        ref={ref}
        placeholderTextColor={placeholderTextColor}
        secureTextEntry={secure}
        keyboardType={
          inputMode === "email" || type === "email"
            ? "email-address"
            : inputMode === "numeric"
              ? "number-pad"
              : props.keyboardType
        }
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
