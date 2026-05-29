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
import { Plus, Edit2, Trash2, Calendar, TrendingDown, TrendingUp, Info, Flame, Target } from "lucide-react-native";
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import dayjs from "dayjs";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
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
import { calculateStreak, calculateETA } from "../../utils/helpers";

type TimeFilter = "Hafta" | "Ay" | "Tümü";

export default function DashboardScreen() {
  const { isDark } = useTheme();

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

  // Load all local data
  const loadData = async () => {
    const wHistory = await getWeightHistory();
    setHistory(wHistory);

    const profile = await getProfile();
    if (profile) {
      setTargetWeight(profile.targetWeight);
    }
    
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
      setError("Lütfen geçerli bir kilo girin (10 - 400 kg).");
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateInput)) {
      setError("Lütfen geçerli bir tarih girin (YYYY-AA-GG).");
      return;
    }

    // Save/Update record
    const updatedHistory = await saveWeightEntry(weightNum, dateInput);
    setHistory(updatedHistory);

    // Reset Form
    setWeightInput("");
    setEditingId(null);
    setDateInput(dayjs().format("YYYY-MM-DD"));

    // Trigger success animation
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
      if (editingId === id) {
        handleCancelEdit();
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`${date} tarihli kaydı silmek istediğinize emin misiniz?`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Kaydı Sil",
        `${date} tarihli kaydı silmek istediğinize emin misiniz?`,
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Sil", onPress: performDelete, style: "destructive" },
        ]
      );
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

  const getWeightChange = () => {
    if (history.length < 1) return { value: 0, text: "0.0 kg", color: "text-light-subtext dark:text-dark-subtext", isLoss: false };
    const initialWeight = history[0].weight;
    const cw = history[history.length - 1].weight;
    const diff = cw - initialWeight;
    const formatted = `${diff > 0 ? "+" : ""}${diff.toFixed(1)} kg`;
    
    if (diff < 0) return { value: diff, text: formatted, color: "text-accent-green", isLoss: true };
    if (diff > 0) return { value: diff, text: formatted, color: "text-accent-red", isLoss: false };
    return { value: diff, text: formatted, color: "text-light-text dark:text-white", isLoss: false };
  };

  const changeInfo = getWeightChange();
  const streak = calculateStreak(history);
  
  const etaInfo = currentWeight && targetWeight > 0 
    ? calculateETA(history, currentWeight, targetWeight) 
    : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-light-bg dark:bg-dark-bg"
    >
      <SuccessTick visible={showSuccessTick} onComplete={() => setShowSuccessTick(false)} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        className="flex-1"
      >
        <Animated.View entering={FadeInUp.delay(100).duration(500)} className="mb-6 mt-4">
          <Text className="text-3xl font-black text-light-text dark:text-white tracking-tight uppercase">
            Kilo Takibi
          </Text>
          <Text className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-bold mt-1">
            Gelişiminizi Günlük Kayıtlarla İzleyin
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <Card className="mb-6 relative overflow-hidden">
            {editingId && (
              <View className="absolute left-0 top-0 bottom-0 w-1 bg-accent-purple" />
            )}
            <Text className="text-base font-black text-light-text dark:text-white mb-3 uppercase tracking-wide">
              {editingId ? "Kayıt Düzenle" : "Yeni Kilo Girişi"}
            </Text>

            <View className="flex-row items-start space-x-3 gap-3">
              <View className="flex-1">
                <Input
                  placeholder="Örn: 74.5"
                  keyboardType="numeric"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  error={error || undefined}
                  className="text-lg font-bold"
                />
              </View>

              <View className="w-[110px]">
                <TouchableOpacity
                  className="mb-1.5 flex-row items-center justify-center h-[34px] bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg"
                >
                  <Calendar size={12} color={isDark ? "#9A9AB0" : "#6C757D"} />
                  <Text className="text-[10px] text-light-subtext dark:text-dark-subtext font-bold ml-1">{dateInput}</Text>
                </TouchableOpacity>

                <View className="flex-row space-x-1 gap-1">
                  {editingId ? (
                    <>
                      <TouchableOpacity
                        onPress={handleSave}
                        className="flex-1 h-9 bg-accent-purple items-center justify-center rounded-lg"
                      >
                        <Text className="text-white text-xs font-bold">GÜNCELLE</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleCancelEdit}
                        className="w-9 h-9 bg-light-border dark:bg-dark-border items-center justify-center rounded-lg"
                      >
                        <Text className="text-light-text dark:text-white text-xs font-black">X</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Button
                      title="KAYDET"
                      onPress={handleSave}
                      className="flex-1 h-9"
                      textClassName="text-[10px] tracking-wide"
                    />
                  )}
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} className="flex-row space-x-4 gap-4 mb-4">
          <Card className="flex-1 items-center p-4">
            <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-black mb-1">
              GÜNCEL KİLO
            </Text>
            <Text className="text-2xl font-black text-light-text dark:text-white">
              {currentWeight ? `${currentWeight.toFixed(1)} kg` : "--"}
            </Text>
          </Card>

          <Card className="flex-1 items-center p-4">
            <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-black mb-1">
              TOPLAM DEĞİŞİM
            </Text>
            <View className="flex-row items-center">
              {history.length > 1 && (
                <View className="mr-1">
                  {changeInfo.isLoss ? (
                    <TrendingDown size={18} color="#00FF87" strokeWidth={2.5} />
                  ) : changeInfo.value > 0 ? (
                    <TrendingUp size={18} color="#FF3B30" strokeWidth={2.5} />
                  ) : null}
                </View>
              )}
              <Text className={`text-2xl font-black ${changeInfo.color}`}>
                {changeInfo.text}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} className="flex-row space-x-4 gap-4 mb-6">
          <Card className="flex-1 items-center p-4">
            <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-black mb-1">
              SERİ
            </Text>
            <View className="flex-row items-center">
              <Flame size={18} color="#FF8C00" strokeWidth={2.5} className="mr-1" />
              <Text className="text-2xl font-black text-light-text dark:text-white">
                {streak} Gün
              </Text>
            </View>
          </Card>

          {targetWeight > 0 && etaInfo?.status === "success" && (
            <Card className="flex-1 items-center p-4">
              <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-black mb-1 text-center">
                TAHMİNİ HEDEF
              </Text>
              <View className="flex-row items-center">
                <Target size={18} color="#BF55EC" strokeWidth={2.5} className="mr-1" />
                <Text className="text-sm mt-1 font-black text-accent-purple text-center">
                  {etaInfo.etaDate.split(' ').slice(0, 2).join(' ')}
                </Text>
              </View>
            </Card>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xs text-light-subtext dark:text-dark-subtext font-black uppercase tracking-wider">
              Kilo Değişim Grafiği
            </Text>

            <View className="flex-row bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-0.5">
              {(["Hafta", "Ay", "Tümü"] as TimeFilter[]).map((t) => {
                const active = filter === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setFilter(t)}
                    className={`px-3 py-1.5 rounded-lg ${active ? "bg-accent-blue" : ""}`}
                  >
                    <Text
                      className={`text-xs font-extrabold uppercase ${
                        active ? "text-[#08080C]" : "text-light-subtext dark:text-dark-subtext"
                      }`}
                    >
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Card className="items-center p-3 mb-6 relative">
            <AnimatedChart data={filteredEntries} targetWeight={targetWeight > 0 ? targetWeight : undefined} />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
          <View className="mb-3">
            <Text className="text-xs text-light-subtext dark:text-dark-subtext font-black uppercase tracking-wider mb-3">
              Geçmiş Kayıtlar ({history.length})
            </Text>
          </View>

          {history.length > 0 ? (
            <View className="space-y-2 gap-2">
              {[...history].reverse().map((item) => (
                <Card
                  key={item.id}
                  className="flex-row justify-between items-center p-4 border border-light-border dark:border-dark-border/40"
                >
                  <View className="flex-row items-center space-x-3 gap-3">
                    <View className="bg-light-bg dark:bg-dark-bg p-2 rounded-lg border border-light-border dark:border-dark-border">
                      <Calendar size={16} color="#00F0FF" />
                    </View>
                    <View>
                      <Text className="text-xs text-light-subtext dark:text-dark-subtext font-bold">{item.date}</Text>
                      <Text className="text-base font-black text-light-text dark:text-white mt-0.5">
                        {item.weight.toFixed(1)} <Text className="text-xs font-semibold text-light-subtext dark:text-dark-subtext">kg</Text>
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row space-x-2 gap-2">
                    <TouchableOpacity
                      onPress={() => startEdit(item)}
                      className="p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border active:border-accent-purple rounded-lg"
                    >
                      <Edit2 size={14} color="#BF55EC" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.date)}
                      className="p-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border active:border-accent-red rounded-lg"
                    >
                      <Trash2 size={14} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))}
            </View>
          ) : (
            <Card className="py-10 items-center justify-center">
              <Text className="text-light-subtext dark:text-dark-subtext font-semibold text-sm">
                Henüz eklenmiş bir kilo kaydı bulunmamaktadır.
              </Text>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
