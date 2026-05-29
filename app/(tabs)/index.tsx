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
import {
  Edit2,
  Trash2,
  Calendar,
  TrendingDown,
  TrendingUp,
  Flame,
  Minus,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import dayjs from "dayjs";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { SuccessTick } from "../../components/ui/SuccessTick";
import { AnimatedChart } from "../../components/AnimatedChart";
import { usePalette } from "../../utils/colors";

import {
  getWeightHistory,
  saveWeightEntry,
  deleteWeightEntry,
  getProfile,
  WeightEntry,
} from "../../utils/storage";
import { calculateStreak, calculateETA } from "../../utils/helpers";

type TimeFilter = "Hafta" | "Ay" | "Tümü";

export default function DashboardScreen() {
  const palette = usePalette();

  const [history, setHistory] = useState<WeightEntry[]>([]);
  const [targetWeight, setTargetWeight] = useState<number>(0);

  // Form
  const [weightInput, setWeightInput] = useState<string>("");
  const [dateInput, setDateInput] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessTick, setShowSuccessTick] = useState(false);

  const [filter, setFilter] = useState<TimeFilter>("Hafta");

  const loadData = async () => {
    const wHistory = await getWeightHistory();
    setHistory(wHistory);
    const profile = await getProfile();
    if (profile) setTargetWeight(profile.targetWeight);
    if (!editingId) setDateInput(dayjs().format("YYYY-MM-DD"));
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      setError("Geçerli bir tarih girin (YYYY-AA-GG).");
      return;
    }

    const updated = await saveWeightEntry(weightNum, dateInput);
    setHistory(updated);
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
    const msg = `${dayjs(date).format("D MMMM YYYY")} tarihli kaydı silmek istediğinize emin misiniz?`;
    if (Platform.OS === "web") {
      if (window.confirm(msg)) performDelete();
    } else {
      Alert.alert("Kaydı Sil", msg, [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", onPress: performDelete, style: "destructive" },
      ]);
    }
  };

  const getFilteredData = () => {
    if (history.length === 0) return [];
    const sorted = [...history].sort(
      (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
    );
    if (filter === "Hafta") return sorted.slice(-7);
    if (filter === "Ay") return sorted.slice(-30);
    return sorted;
  };

  const filteredEntries = getFilteredData();
  const currentWeight = history.length > 0 ? history[history.length - 1].weight : null;

  // Hero altı: son kayda göre değişim
  const lastDelta =
    history.length >= 2
      ? history[history.length - 1].weight - history[history.length - 2].weight
      : null;

  // Toplam değişim (ilk → güncel)
  const totalDelta =
    history.length >= 2 ? history[history.length - 1].weight - history[0].weight : null;

  const streak = calculateStreak(history);
  const etaInfo =
    currentWeight && targetWeight > 0
      ? calculateETA(history, currentWeight, targetWeight)
      : null;

  const remaining =
    currentWeight && targetWeight > 0 ? currentWeight - targetWeight : null;

  const fmtDelta = (d: number) => `${d > 0 ? "+" : d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)} kg`;
  const deltaColor = (d: number) =>
    d < 0 ? palette.green : d > 0 ? palette.red : palette.subtext;

  const DeltaPill = ({ value }: { value: number }) => {
    const c = deltaColor(value);
    const Icon = value < 0 ? TrendingDown : value > 0 ? TrendingUp : Minus;
    return (
      <View
        className="flex-row items-center self-center px-3 py-1.5 rounded-full"
        style={{ backgroundColor: c + "1A" }}
      >
        <Icon size={15} color={c} strokeWidth={2.6} />
        <Text className="text-sm font-extrabold ml-1.5" style={{ color: c }}>
          {fmtDelta(value)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-light-bg dark:bg-dark-bg"
    >
      <SuccessTick visible={showSuccessTick} onComplete={() => setShowSuccessTick(false)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 48 }}
        className="flex-1"
      >
        {/* Üst satır: tarih + seri rozeti */}
        <Animated.View entering={FadeInDown.duration(450)} className="flex-row items-center justify-between mb-7 mt-2">
          <View>
            <Text className="text-light-muted dark:text-dark-muted text-[11px] font-bold uppercase tracking-widest">
              {dayjs().format("dddd")}
            </Text>
            <Text className="text-light-text dark:text-white text-lg font-extrabold mt-0.5">
              {dayjs().format("D MMMM YYYY")}
            </Text>
          </View>

          <View
            className="flex-row items-center px-3.5 py-2 rounded-full border border-light-border dark:border-dark-border"
            style={{ backgroundColor: palette.flame + "14" }}
          >
            <Flame size={16} color={palette.flame} strokeWidth={2.6} />
            <Text className="text-sm font-extrabold ml-1.5" style={{ color: palette.flame }}>
              {streak}
            </Text>
            <Text className="text-[11px] font-bold ml-1 text-light-subtext dark:text-dark-subtext">gün seri</Text>
          </View>
        </Animated.View>

        {/* KAHRAMAN: bugünkü kilo */}
        <Animated.View entering={FadeInDown.delay(80).duration(450)} className="items-center mb-7">
          <Text className="text-light-muted dark:text-dark-muted text-xs font-bold uppercase tracking-[3px] mb-1">
            Güncel Kilo
          </Text>
          <View className="flex-row items-baseline">
            <Text className="text-light-text dark:text-white text-7xl font-black tracking-tight">
              {currentWeight !== null ? currentWeight.toFixed(1) : "--"}
            </Text>
            <Text className="text-light-subtext dark:text-dark-subtext text-2xl font-bold ml-1.5">kg</Text>
          </View>
          {lastDelta !== null && (
            <View className="mt-3">
              <DeltaPill value={lastDelta} />
            </View>
          )}
        </Animated.View>

        {/* Hızlı kayıt */}
        <Animated.View entering={FadeInDown.delay(160).duration(450)}>
          <Card
            elevated
            className={`mb-5 ${editingId ? "border-accent-purple" : ""}`}
          >
            <Text className="text-light-text dark:text-white text-[13px] font-extrabold uppercase tracking-wide mb-3">
              {editingId ? "Kaydı Düzenle" : "Yeni Kilo Girişi"}
            </Text>

            <View className="flex-row items-end gap-3">
              <View className="flex-1">
                <Input
                  placeholder="Örn: 74.5"
                  keyboardType="numeric"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  className="text-lg font-bold"
                />
              </View>
              {editingId ? (
                <View className="flex-row gap-2">
                  <Button title="Güncelle" variant="secondary" onPress={handleSave} className="px-4" />
                  <Button title="İptal" variant="ghost" onPress={handleCancelEdit} className="px-3" />
                </View>
              ) : (
                <Button title="Kaydet" onPress={handleSave} className="px-6" />
              )}
            </View>

            <View className="flex-row items-center mt-3">
              <Calendar size={13} color={palette.muted} strokeWidth={2.4} />
              <Text className="text-[11px] text-light-muted dark:text-dark-muted font-semibold ml-1.5">
                {dayjs(dateInput).isValid() ? dayjs(dateInput).format("D MMMM YYYY") : dateInput}
              </Text>
            </View>

            {error && (
              <Text className="text-accent-red text-xs font-semibold mt-2">{error}</Text>
            )}
          </Card>
        </Animated.View>

        {/* 2 küçük istatistik kartı */}
        <Animated.View entering={FadeInDown.delay(240).duration(450)} className="flex-row gap-3 mb-6">
          <Card className="flex-1">
            <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold uppercase tracking-widest">
              Toplam Değişim
            </Text>
            {totalDelta !== null ? (
              <View className="flex-row items-center mt-2">
                {totalDelta < 0 ? (
                  <TrendingDown size={18} color={palette.green} strokeWidth={2.6} />
                ) : totalDelta > 0 ? (
                  <TrendingUp size={18} color={palette.red} strokeWidth={2.6} />
                ) : (
                  <Minus size={18} color={palette.subtext} strokeWidth={2.6} />
                )}
                <Text
                  className="text-2xl font-black ml-1.5"
                  style={{ color: deltaColor(totalDelta) }}
                >
                  {fmtDelta(totalDelta)}
                </Text>
              </View>
            ) : (
              <Text className="text-2xl font-black text-light-subtext dark:text-dark-subtext mt-2">--</Text>
            )}
          </Card>

          <Card className="flex-1">
            <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold uppercase tracking-widest">
              {etaInfo?.status === "success" ? "Tahmini Hedef" : "Hedefe Kalan"}
            </Text>
            {etaInfo?.status === "success" ? (
              <Text className="text-base font-black text-accent-purple mt-2" numberOfLines={2}>
                {etaInfo.etaDate.split(" ").slice(0, 2).join(" ")}
              </Text>
            ) : remaining !== null ? (
              <Text className="text-2xl font-black text-light-text dark:text-white mt-2">
                {Math.abs(remaining).toFixed(1)}
                <Text className="text-sm font-bold text-light-subtext dark:text-dark-subtext"> kg</Text>
              </Text>
            ) : (
              <Text className="text-2xl font-black text-light-subtext dark:text-dark-subtext mt-2">--</Text>
            )}
          </Card>
        </Animated.View>

        {/* Segment + grafik */}
        <Animated.View entering={FadeInDown.delay(320).duration(450)}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-light-subtext dark:text-dark-subtext text-xs font-extrabold uppercase tracking-wider">
              Kilo Grafiği
            </Text>
            <View className="flex-row bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-1">
              {(["Hafta", "Ay", "Tümü"] as TimeFilter[]).map((t) => {
                const active = filter === t;
                return (
                  <TouchableOpacity
                    key={t}
                    activeOpacity={0.8}
                    onPress={() => setFilter(t)}
                    className="px-3 py-1 rounded-lg"
                    style={active ? { backgroundColor: palette.accent } : undefined}
                  >
                    <Text
                      className="text-xs font-extrabold"
                      style={{ color: active ? "#0A0A0B" : palette.muted }}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Card className="mb-6 px-2 py-4">
            <AnimatedChart
              data={filteredEntries}
              targetWeight={targetWeight > 0 ? targetWeight : undefined}
            />
          </Card>
        </Animated.View>

        {/* Son kayıtlar */}
        <Animated.View entering={FadeInDown.delay(400).duration(450)}>
          <Text className="text-light-subtext dark:text-dark-subtext text-xs font-extrabold uppercase tracking-wider mb-3">
            Son Kayıtlar ({history.length})
          </Text>

          {history.length > 0 ? (
            <View className="gap-2.5">
              {[...history].reverse().map((item, idx, reversed) => {
                const prev = reversed[idx + 1];
                const d = prev ? item.weight - prev.weight : null;
                return (
                  <Animated.View key={item.id} entering={FadeIn.delay(Math.min(idx, 8) * 40)}>
                    <Card className="flex-row items-center justify-between py-3.5">
                      <View className="flex-row items-center">
                        <View
                          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                          style={{ backgroundColor: palette.accent + "14" }}
                        >
                          <Calendar size={17} color={palette.accent} strokeWidth={2.4} />
                        </View>
                        <View>
                          <Text className="text-[11px] text-light-muted dark:text-dark-muted font-semibold">
                            {dayjs(item.date).format("D MMM YYYY")}
                          </Text>
                          <View className="flex-row items-baseline mt-0.5">
                            <Text className="text-base font-black text-light-text dark:text-white">
                              {item.weight.toFixed(1)}
                            </Text>
                            <Text className="text-[11px] font-semibold text-light-subtext dark:text-dark-subtext ml-1">
                              kg
                            </Text>
                            {d !== null && d !== 0 && (
                              <Text
                                className="text-[11px] font-bold ml-2"
                                style={{ color: deltaColor(d) }}
                              >
                                {d > 0 ? "+" : "−"}
                                {Math.abs(d).toFixed(1)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>

                      <View className="flex-row gap-2">
                        <TouchableOpacity
                          onPress={() => startEdit(item)}
                          activeOpacity={0.7}
                          className="w-9 h-9 rounded-xl items-center justify-center bg-light-bg dark:bg-dark-elevated"
                        >
                          <Edit2 size={15} color={palette.purple} strokeWidth={2.2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id, item.date)}
                          activeOpacity={0.7}
                          className="w-9 h-9 rounded-xl items-center justify-center bg-light-bg dark:bg-dark-elevated"
                        >
                          <Trash2 size={15} color={palette.red} strokeWidth={2.2} />
                        </TouchableOpacity>
                      </View>
                    </Card>
                  </Animated.View>
                );
              })}
            </View>
          ) : (
            <Card className="py-10 items-center justify-center">
              <Text className="text-light-subtext dark:text-dark-subtext font-semibold text-sm text-center">
                Henüz kilo kaydı yok.{"\n"}Yukarıdan ilk kaydını ekle.
              </Text>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
