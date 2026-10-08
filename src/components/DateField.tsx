// components/DateField.tsx

import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";

import { C } from "@/lib/theme";

/**
 * Parse "YYYY-MM-DD" → Date (or null if invalid/empty).
 */
function parseYMD(s: string): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  if (isNaN(dt.getTime())) return null;
  return dt;
}

/**
 * Format Date → "YYYY-MM-DD".
 */
function formatYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * A form-friendly date field. Tapping opens the native date picker.
 * Value/onChange both use the "YYYY-MM-DD" string format.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = "YYYY-MM-DD",
  maximumDate,
  minimumDate,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}) {
  const [show, setShow] = useState(false);
  const parsed = parseYMD(value);

  const handleChange = (event: any, date?: Date) => {
    // On Android, the picker closes itself and reports event.type
    if (Platform.OS === "android") {
      setShow(false);
      if (event?.type === "set" && date) {
        onChange(formatYMD(date));
      }
    } else {
      // iOS stays open until user dismisses
      if (date) onChange(formatYMD(date));
    }
  };

  const handleDismiss = () => setShow(false);

  return (
    <View className="flex-1 mb-2.5">
      {label ? (
        <Text
          className="text-[11px] font-semibold mb-1 uppercase tracking-[0.5px]"
          style={{ color: C.navySoft }}
        >
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setShow((v) => !v)}
        className="rounded-xl px-3 py-2.5 border flex-row items-center justify-between"
        style={{ borderColor: C.border, backgroundColor: C.white }}
      >
        <Text
          className="text-[14px]"
          style={{
            color: parsed ? C.navy : C.muted,
          }}
        >
          {parsed ? formatYMD(parsed) : placeholder}
        </Text>
        <MaterialIcons name="calendar-today" size={16} color={C.navy} />
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={parsed ?? new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
          maximumDate={maximumDate ?? new Date()}
          minimumDate={minimumDate}
          onTouchCancel={handleDismiss}
        />
      )}
    </View>
  );
}
