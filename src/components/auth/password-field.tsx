import { useState } from "react";
import { Pressable, View } from "react-native";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { joyaColors } from "@/theme/colors";

type PasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
};

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = "••••••••",
  autoComplete = "current-password",
}: PasswordFieldProps<T>) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <View className="relative">
            <View className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2">
              <Lock size={16} color={joyaColors.blueLight} />
            </View>
            <FormControl>
              <Input
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                secureTextEntry={!visible}
                autoComplete={
                  autoComplete === "current-password"
                    ? "password"
                    : autoComplete === "new-password"
                      ? "password-new"
                      : undefined
                }
                textContentType={
                  autoComplete === "new-password" ? "newPassword" : "password"
                }
                className="pl-10 pr-11"
              />
            </FormControl>
            <Pressable
              onPress={() => setVisible((v) => !v)}
              accessibilityLabel={
                visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
              }
              className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full"
            >
              {visible ? (
                <EyeOff size={16} color={joyaColors.blueLight} />
              ) : (
                <Eye size={16} color={joyaColors.blueLight} />
              )}
            </Pressable>
          </View>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
