import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarDays } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { joyaColors } from "@/theme/colors";

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, 12);
}

function toYmd(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/** dd/mm/yyyy — what the web `<input type="date">` shows in fr-FR. */
export function formatYmdShort(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}

type DatePillProps = {
  /** YYYY-MM-DD */
  value: string;
  onChange: (ymd: string) => void;
  /** Latest selectable day (YYYY-MM-DD). */
  max?: string;
  /** Accessibility label + iOS sheet title. */
  label: string;
  /** `dark` = translucent pill for use over the page-header photo. */
  tone?: "light" | "dark";
  disabled?: boolean;
  className?: string;
};

/** Native replacement for the web `<input type="date">` pill. */
export function DatePill({
  value,
  onChange,
  max,
  label,
  tone = "light",
  disabled,
  className,
}: DatePillProps) {
  const [open, setOpen] = useState(false);
  const [iosDraft, setIosDraft] = useState<Date>(() => parseYmd(value));
  const insets = useSafeAreaInsets();
  const dark = tone === "dark";

  function handleAndroidChange(event: DateTimePickerEvent, date?: Date) {
    setOpen(false);
    if (event.type === "set" && date) onChange(toYmd(date));
  }

  function openPicker() {
    setIosDraft(parseYmd(value));
    setOpen(true);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} : ${formatYmdShort(value)}`}
        disabled={disabled}
        onPress={openPicker}
        className={cn(
          "h-10 flex-row items-center gap-2 self-start rounded-full border px-3.5",
          dark ? "border-white/20 bg-white/10" : "border-line bg-white",
          disabled && "opacity-50",
          className,
        )}
      >
        <CalendarDays
          size={16}
          color={dark ? joyaColors.coral : joyaColors.blue}
        />
        <Text
          className={cn(
            "font-data text-[13px] font-medium",
            dark ? "text-white" : "text-navy",
          )}
        >
          {formatYmdShort(value)}
        </Text>
      </Pressable>

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={parseYmd(value)}
          mode="date"
          display="default"
          maximumDate={max ? parseYmd(max) : undefined}
          onChange={handleAndroidChange}
        />
      ) : null}

      {Platform.OS === "ios" ? (
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
              className="rounded-t-3xl bg-white px-4 pt-4"
              style={{ paddingBottom: Math.max(insets.bottom, 12) }}
            >
              <Text className="mb-2 px-2 font-data text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
                {label}
              </Text>
              <DateTimePicker
                value={iosDraft}
                mode="date"
                display="inline"
                themeVariant="light"
                accentColor={joyaColors.coral}
                maximumDate={max ? parseYmd(max) : undefined}
                onChange={(_event, date) => {
                  if (date) setIosDraft(date);
                }}
              />
              <View className="mt-2 flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(false)}
                  className="h-11 flex-1 items-center justify-center rounded-2xl border border-line"
                >
                  <Text className="text-sm font-semibold text-navy">Annuler</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(toYmd(iosDraft));
                    setOpen(false);
                  }}
                  className="h-11 flex-1 items-center justify-center rounded-2xl bg-coral"
                >
                  <Text className="text-sm font-semibold text-white">OK</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}
