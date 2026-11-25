import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronDown } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

export type PillSelectOption = { value: string; label: string };

type PillSelectProps = {
  value: string;
  options: PillSelectOption[];
  onChange: (value: string) => void;
  /** Sheet title + accessibility label. */
  label: string;
  className?: string;
};

/** Native replacement for the web Radix `Select` (pill trigger + bottom sheet). */
export function PillSelect({
  value,
  options,
  onChange,
  label,
  className,
}: PillSelectProps) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(true)}
        className={cn(
          "h-9 flex-row items-center justify-between gap-2 rounded-full border border-line bg-white px-3",
          className,
        )}
      >
        <Text
          numberOfLines={1}
          className="shrink text-[13px] font-medium text-navy"
        >
          {selected?.label ?? label}
        </Text>
        <ChevronDown size={16} color={joyaColors.navy} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <Pressable
            accessibilityLabel="Fermer"
            className="flex-1"
            onPress={() => setOpen(false)}
          />
          <View
            className="max-h-[65%] rounded-t-3xl bg-white px-4 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 12) }}
          >
            <Text className="mb-2 px-2 font-data text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
              {label}
            </Text>
            <ScrollView>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex-row items-center justify-between rounded-xl px-3 py-3",
                      isSelected && "bg-coral-soft",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[15px] text-navy",
                        isSelected && "font-semibold",
                      )}
                    >
                      {option.label}
                    </Text>
                    {isSelected ? (
                      <Check size={16} color={joyaColors.coral} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
