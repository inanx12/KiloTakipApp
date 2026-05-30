import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react-native";
import dayjs from "dayjs";
import { useTheme } from "../../utils/ThemeContext";

interface DateFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

/**
 * Native sürümü (paket eklemeden): gün adımlayıcı.
 * ◀ / ▶ ile gün değiştirilir; geleceğe izin verilmez.
 */
export function DateField({ value, onChange }: DateFieldProps) {
  const { isDark } = useTheme();
  const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)";
  const d = dayjs(value).isValid() ? dayjs(value) : dayjs();
  const isToday = d.format("YYYY-MM-DD") === dayjs().format("YYYY-MM-DD");

  const shift = (delta: number) => {
    const next = d.add(delta, "day");
    if (next.isAfter(dayjs(), "day")) return; // gelecek tarihe izin yok
    onChange(next.format("YYYY-MM-DD"));
  };

  return (
    <View className="flex-row items-center h-10 mb-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
      <TouchableOpacity onPress={() => shift(-1)} className="px-3 h-full items-center justify-center">
        <ChevronLeft size={16} color={muted} />
      </TouchableOpacity>

      <View className="flex-1 flex-row items-center justify-center">
        <Calendar size={13} color={muted} />
        <Text className="text-xs font-bold text-light-subtext dark:text-dark-subtext ml-2">
          {d.format("DD MMMM YYYY")}
          {isToday ? " · Bugün" : ""}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => shift(1)}
        disabled={isToday}
        className={`px-3 h-full items-center justify-center ${isToday ? "opacity-30" : ""}`}
      >
        <ChevronRight size={16} color={muted} />
      </TouchableOpacity>
    </View>
  );
}
