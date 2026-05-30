import React from "react";
import { View, Text } from "react-native";
import { Calendar } from "lucide-react-native";
import dayjs from "dayjs";
import { useTheme } from "../../utils/ThemeContext";

interface DateFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

/**
 * Web sürümü: gerçek <input type="date"> (tarayıcı tarih seçicisi).
 * Görünür chip'in üstüne şeffaf bir input bindirilir; tıklayınca seçici açılır.
 */
export function DateField({ value, onChange }: DateFieldProps) {
  const { isDark } = useTheme();
  const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)";
  const safe = dayjs(value).isValid() ? dayjs(value) : dayjs();
  const display = safe.format("DD MMMM YYYY");

  return (
    <View className="relative h-10 mb-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
      <View className="flex-row items-center justify-center h-full">
        <Calendar size={13} color={muted} />
        <Text className="text-xs font-bold text-light-subtext dark:text-dark-subtext ml-2">{display}</Text>
      </View>
      {React.createElement("input", {
        type: "date",
        value: safe.format("YYYY-MM-DD"),
        max: dayjs().format("YYYY-MM-DD"),
        onClick: (e: any) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            /* showPicker desteklenmiyorsa normal davranış */
          }
        },
        onChange: (e: any) => {
          if (e.target.value) onChange(e.target.value);
        },
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          border: "none",
          padding: 0,
          margin: 0,
        },
      } as any)}
    </View>
  );
}
