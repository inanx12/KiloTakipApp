import React, { useState } from "react";
import { View, Text, TouchableOpacity, Platform, Modal, Pressable } from "react-native";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import dayjs from "dayjs";
import { useTheme } from "../../utils/ThemeContext";

interface DateFieldProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

/**
 * Native sürümü: gerçek takvim picker'ı (@react-native-community/datetimepicker).
 * - Android: native tarih dialog'u (imperative API)
 * - iOS: alttan açılan modal içinde inline takvim + "Tamam"
 * - Geçmiş tarih serbest, gelecek tarihler devre dışı (maximumDate)
 */
export function DateField({ value, onChange }: DateFieldProps) {
  const { isDark } = useTheme();
  const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)";
  const [show, setShow] = useState(false);

  const current = dayjs(value).isValid() ? dayjs(value) : dayjs();
  const currentDateObj = current.toDate();
  const maxDate = new Date(); // bugün — gelecek kapalı

  const commit = (selected?: Date) => {
    if (selected) onChange(dayjs(selected).format("YYYY-MM-DD"));
  };

  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: currentDateObj,
        mode: "date",
        maximumDate: maxDate,
        onChange: (event, selected) => {
          if (event.type === "set") commit(selected);
        },
      });
    } else {
      setShow(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={openPicker}
        className="flex-row items-center justify-center h-10 mb-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl"
      >
        <Calendar size={13} color={muted} />
        <Text className="text-xs font-bold text-light-subtext dark:text-dark-subtext ml-2">
          {current.format("DD MMMM YYYY")}
        </Text>
      </TouchableOpacity>

      {Platform.OS === "ios" && show ? (
        <Modal transparent visible={show} animationType="fade" onRequestClose={() => setShow(false)}>
          <Pressable
            className="flex-1 justify-end"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onPress={() => setShow(false)}
          >
            {/* İçeriğe basınca modal kapanmasın diye iç Pressable touch'ı yakalar */}
            <Pressable
              onPress={() => {}}
              className="bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border rounded-t-3xl px-4 pt-4 pb-8"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
                  Tarih Seç
                </Text>
                <TouchableOpacity onPress={() => setShow(false)} className="px-4 py-2 rounded-xl bg-accent-blue">
                  <Text className="text-[#06181A] font-extrabold text-xs">Tamam</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={currentDateObj}
                mode="date"
                display="inline"
                maximumDate={maxDate}
                themeVariant={isDark ? "dark" : "light"}
                locale="tr-TR"
                onChange={(_event, selected) => commit(selected)}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
