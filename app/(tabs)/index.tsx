import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Edit2, Trash2, Calendar, ArrowDownRight, ArrowUpRight, Flame } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import dayjs from "dayjs";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { DateField } from "../../components/ui/DateField";
import { SuccessTick } from "../../components/ui/SuccessTick";
import { AnimatedChart } from "../../components/AnimatedChart";
import { useTheme } from "../../utils/ThemeContext";

import {
  getWeightHistory,
  saveWeightEntry,
  deleteWeightEntry,
  getProfile,
  WeightEntry,
} from "../../utils/storage";
import { calculateStreak, calculateETA, calculateMovingAverage } from "../../utils/helpers";

type TimeFilter = "Hafta" | "Ay" | "Tümü";

export default function DashboardScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)";

  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [targetWeight, setTargetWeight] = useState<number>(0);

  // Form states
  const [weightInput, setWeightInput] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>(""); // YYYY-MM-DD
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);

  // Filter state
  const [filter, setFilter] = useState<TimeFilter>("Hafta");

  const loadData = async () => {
    const wHistory = await getWeightHistory();
    setHistory(wHistory);
    const profile = await getProfile();
    if (profile) setTargetWeight(profile.targetWeight);
    setDateInput(dayjs().format("YYYY-MM-DD"));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleSave = async () => {
    setError(null);
    const weightNum = parseFloat(weightInput.replace(",", "."));

    if (isNaN(weightNum) || weightNum <= 10 || weightNum > 400) {
      setError("Geçerli bir kilo girin (10 - 400 kg).");
      return;
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateInput)) {
      setError("Geçerli bir tarih girin (YYYY-AA-GG).");
      return;
    }

    const updatedHistory = await saveWeightEntry(weightNum, dateInput);
    setHistory(updatedHistory);
    setWeightInput("");
    setEditingId(null);
    setDateInput(dayjs().format("YYYY-MM-DD"));
    setShowSuccessTick(true);
  };

  const handleCancelEdit = () => {
    setWeightInput("");
    setEditingId(null);
    setDateInput(dayjs().format("YYYY-MM-DD"));
    setError(null);
  };

  const startEdit = (entry: WeightEntry) => {
    setEditingId(entry.id);
    setWeightInput(entry.weight.toString());
    setDateInput(entry.date);
    setError(null);
  };

  const handleDelete = (id: string, date: string) => {
    const performDelete = async () => {
      const updated = await deleteWeightEntry(id);
      setHistory(updated);
      if (editingId === id) handleCancelEdit();
    };

    if (Platform.OS === "web") {
      if (window.confirm(`${dayjs(date).format("DD MMMM YYYY")} kaydını silmek istiyor musunuz?`)) {
        performDelete();
      }
    } else {
      Alert.alert("Kaydı Sil", `${dayjs(date).format("DD MMMM YYYY")} kaydını silmek istiyor musunuz?`, [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", onPress: performDelete, style: "destructive" },
      ]);
    }
  };

  const getFilteredData = () => {
    if (history.length === 0) return [];
    const sorted = [...history].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    if (filter === "Hafta") return sorted.slice(-7);
    if (filter === "Ay") return sorted.slice(-30);
    return sorted;
  };

  const filteredEntries = getFilteredData();
  const currentWeight = history.length > 0 ? history[history.length - 1].weight : null;

  const getWeightChange = () => {
    if (history.length < 2) return null;
    const diff = history[history.length - 1].weight - history[0].weight;
    return {
      diff,
      text: `${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg`,
      isLoss: diff < 0,
      isGain: diff > 0,
    };
  };

  const changeInfo = getWeightChange();
  const streak = calculateStreak(history);

  const avgSeries = calculateMovingAverage(history, 7);
  const latestAvg = avgSeries.length > 0 ? avgSeries[avgSeries.length - 1] : null;

  const etaInfo =
    currentWeight && targetWeight > 0 ? calculateETA(history, currentWeight, targetWeight) : null;
  const etaText =
    etaInfo?.status === "success"
      ? etaInfo.etaDate.split(" ").slice(0, 2).join(" ")
      : etaInfo?.status === "reached"
      ? "Ulaşıldı 🎉"
      : "—";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-light-bg dark:bg-dark-bg"
    >
      <SuccessTick visible={showSuccessTick} onComplete={() => setShowSuccessTick(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 32 }}
      >
        {/* Header: tarih + seri rozeti */}
        <Animated.View entering={FadeInDown.duration(450)} className="flex-row justify-between items-center mb-5">
          <View>
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-light-subtext dark:text-dark-subtext">
              {dayjs().format("dddd")}
            </Text>
            <Text className="text-2xl font-black text-light-text dark:text-dark-text mt-0.5">
              {dayjs().format("DD MMMM")}
            </Text>
          </View>

          <View className="flex-row items-center bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border rounded-full px-3.5 py-2">
            <Flame size={15} color="#FF8C42" fill="#FF8C42" strokeWidth={0} />
            <Text className="text-sm font-black text-light-text dark:text-dark-text ml-1.5">{streak}</Text>
            <Text className="text-[11px] font-bold text-light-subtext dark:text-dark-subtext ml-1">gün</Text>
          </View>
        </Animated.View>

        {/* HERO: bugünkü kilo */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)}>
          <Card elevated className="items-center py-8">
            <Text className="text-[11px] font-bold uppercase tracking-[2px] text-light-subtext dark:text-dark-subtext mb-2">
              Güncel Kilo
            </Text>
            <View className="flex-row items-baseline">
              {currentWeight ? (
                <>
                  <Text className="text-[64px] leading-[64px] font-black text-light-text dark:text-dark-text">
                    {currentWeight.toFixed(1)}
                  </Text>
                  <Text className="text-lg font-bold text-light-subtext dark:text-dark-subtext ml-1.5">kg</Text>
                </>
              ) : (
                <Text className="text-[44px] leading-[52px] font-black text-light-subtext dark:text-dark-subtext">
                  — kg
                </Text>
              )}
            </View>

            {changeInfo ? (
              <View className="flex-row items-center mt-3">
                {changeInfo.isLoss ? (
                  <ArrowDownRight size={18} color="#30E0A1" strokeWidth={2.5} />
                ) : changeInfo.isGain ? (
                  <ArrowUpRight size={18} color="#FF5A5F" strokeWidth={2.5} />
                ) : null}
                <Text
                  className="text-base font-black ml-1"
                  style={{ color: changeInfo.isLoss ? "#30E0A1" : changeInfo.isGain ? "#FF5A5F" : muted }}
                >
                  {changeInfo.text}
                </Text>
                <Text className="text-xs font-semibold text-light-subtext dark:text-dark-subtext ml-1.5">
                  başlangıçtan beri
                </Text>
              </View>
            ) : (
              <Text className="text-xs font-semibold text-light-subtext dark:text-dark-subtext mt-3">
                İlk kaydını ekle, takip başlasın
              </Text>
            )}
          </Card>
        </Animated.View>

        {/* Hızlı kayıt girişi */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)} className="mt-4">
          <Card className="overflow-hidden">
            {editingId ? <View className="absolute left-0 top-0 bottom-0 w-1 bg-accent-purple" /> : null}
            <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext mb-3">
              {editingId ? "Kaydı Düzenle" : "Kilo Ekle"}
            </Text>

            {/* Tarih seçici (web: input[type=date], native: gün adımlayıcı) */}
            <DateField value={dateInput} onChange={setDateInput} />

            {/* Giriş + aksiyon */}
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Input
                  placeholder="Örn: 74.5"
                  keyboardType="numeric"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  error={error || undefined}
                />
              </View>

              {editingId ? (
                <>
                  <Button title="Güncelle" onPress={handleSave} className="h-12 min-w-[104px]" />
                  <TouchableOpacity
                    onPress={handleCancelEdit}
                    className="w-12 h-12 items-center justify-center rounded-2xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border"
                  >
                    <Text className="text-light-text dark:text-dark-text font-black">✕</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Button title="Kaydet" onPress={handleSave} className="h-12 min-w-[112px]" />
              )}
            </View>
          </Card>
        </Animated.View>

        {/* 2 küçük istatistik kartı */}
        <Animated.View entering={FadeInDown.duration(450).delay(180)} className="flex-row gap-3 mt-4">
          <Card className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
              7 Gün Ort.
            </Text>
            <Text
              className="text-xl font-black text-light-text dark:text-dark-text mt-1.5"
              style={{ lineHeight: 26 }}
            >
              {latestAvg ? `${latestAvg.toFixed(1)}` : "—"}
              <Text className="text-xs font-bold text-light-subtext dark:text-dark-subtext"> kg</Text>
            </Text>
          </Card>

          <Card className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
              Tahmini Hedef
            </Text>
            <Text
              className="text-xl font-black text-accent-blue mt-1.5"
              style={{ lineHeight: 26 }}
              numberOfLines={1}
            >
              {etaText}
            </Text>
          </Card>
        </Animated.View>

        {/* Segment + Grafik */}
        <Animated.View entering={FadeInDown.duration(450).delay(240)} className="mt-7">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-black text-light-text dark:text-dark-text">Kilo Grafiği</Text>

            <View className="flex-row bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border rounded-full p-1">
              {(["Hafta", "Ay", "Tümü"] as TimeFilter[]).map((t) => {
                const active = filter === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setFilter(t)}
                    className={`px-3.5 py-1.5 rounded-full ${active ? "bg-accent-blue" : ""}`}
                  >
                    <Text
                      className={`text-[11px] font-extrabold ${active ? "" : "text-light-subtext dark:text-dark-subtext"}`}
                      style={active ? { color: "#06181A" } : undefined}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Card className="px-2 py-3">
            <AnimatedChart data={filteredEntries} targetWeight={targetWeight > 0 ? targetWeight : undefined} />
          </Card>
        </Animated.View>

        {/* Son kayıtlar */}
        <Animated.View entering={FadeInDown.duration(450).delay(300)} className="mt-7">
          <Text className="text-base font-black text-light-text dark:text-dark-text mb-3">
            Son Kayıtlar <Text className="text-light-subtext dark:text-dark-subtext">({history.length})</Text>
          </Text>

          {history.length > 0 ? (
            <View className="gap-2.5">
              {[...history].reverse().map((item) => (
                <Card key={item.id} className="flex-row justify-between items-center py-3.5">
                  <View className="flex-row items-center">
                    <View className="bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border w-10 h-10 rounded-xl items-center justify-center">
                      <Calendar size={16} color="#00F0FF" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-[11px] font-bold text-light-subtext dark:text-dark-subtext">
                        {dayjs(item.date).format("DD MMMM YYYY")}
                      </Text>
                      <Text
                        className="text-base font-black text-light-text dark:text-dark-text mt-0.5"
                        style={{ lineHeight: 22 }}
                      >
                        {item.weight.toFixed(1)}
                        <Text className="text-xs font-semibold text-light-subtext dark:text-dark-subtext"> kg</Text>
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      className="w-9 h-9 items-center justify-center rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border"
                    >
                      <Edit2 size={15} color="#BF55EC" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.date)}
                      className="w-9 h-9 items-center justify-center rounded-xl bg-light-elevated dark:bg-dark-elevated border border-light-border dark:border-dark-border"
                    >
                      <Trash2 size={15} color="#FF5A5F" />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card className="py-10 items-center">
              <Text className="text-light-subtext dark:text-dark-subtext font-semibold text-sm">
                Henüz kilo kaydı yok.
              </Text>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
