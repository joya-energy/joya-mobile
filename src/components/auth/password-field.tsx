"use client";

import { useState } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

type PasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
};

type PasswordFieldsProps<T extends FieldValues> = {
  control: Control<T>;
  passwordName: FieldPath<T>;
  passwordLabel: string;
  passwordPlaceholder?: string;
  confirmName?: FieldPath<T>;
  confirmLabel?: string;
  confirmPlaceholder?: string;
};

function BasePasswordField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "••••••••",
  autoComplete = "current-password",
  visible,
  onToggleVisible,
}: PasswordFieldProps<T> & {
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <FormControl>
              <Input
                type={visible ? "text" : "password"}
                placeholder={placeholder}
                autoComplete={autoComplete}
                className="pl-10 pr-11"
                {...field}
              />
            </FormControl>
            <button
              type="button"
              onClick={onToggleVisible}
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              aria-pressed={visible}
            >
              {visible ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PasswordField<T extends FieldValues>(props: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);
  return (
    <BasePasswordField
      {...props}
      visible={visible}
      onToggleVisible={() => setVisible((prev) => !prev)}
    />
  );
}

/**
 * Group with optional confirm field. Visibility toggle is shared by both fields.
 */
export function PasswordFields<T extends FieldValues>({
  control,
  passwordName,
  passwordLabel,
  passwordPlaceholder,
  confirmName,
  confirmLabel = "Confirmer le mot de passe",
  confirmPlaceholder,
}: PasswordFieldsProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <BasePasswordField
        control={control}
        name={passwordName}
        label={passwordLabel}
        placeholder={passwordPlaceholder}
        autoComplete="new-password"
        visible={visible}
        onToggleVisible={() => setVisible((prev) => !prev)}
      />
      {confirmName ? (
        <BasePasswordField
          control={control}
          name={confirmName}
          label={confirmLabel}
          placeholder={confirmPlaceholder}
          autoComplete="new-password"
          visible={visible}
          onToggleVisible={() => setVisible((prev) => !prev)}
        />
      ) : null}
    </>
  );
}
