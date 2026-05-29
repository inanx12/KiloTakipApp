import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  Scale,
  Target,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Moon,
  Sun,
  MonitorSmartphone,
  Download,
  RotateCcw,
} from "lucide-react-native";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { MorphingSilhouette } from "../../components/MorphingSilhouette";
import {
  getProfile,
  saveProfile,
  getWeightHistory,
  clearAllData,
  UserProfile,
  WeightEntry,
} from "../../utils/storage";
import {
  calculateBMI,
  getBMICategory,
  calculateETA,
  exportToCSV,
} from "../../utils/helpers";
import { useTheme, ThemeType } from "../../utils/ThemeContext";
import { usePalette } from "../../utils/colors";

// VKİ konum çubuğu için segmentler (15–35 ölçeği)
const BMI_SEGMENTS = [
  { min: 15, max: 18.5, color: "#00B0F0" },
  { min: 18.5, max: 25, color: "#22D17E" },
  { min: 25, max: 30, color: "#BF55EC" },
  { min: 30, max: 35, color: "#FF5C5C" },
];

export default function ProfileScreen() {
  const palette = usePalette();
  const { theme, setTheme, isDark } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<WeightEntry[]>([]);

  const [heightInput, setHeightInput] = useState<string>("");
  const [targetWeightInput, setTargetWeightInput] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    const prof = await getProfile();
    if (prof) {
      setProfile(prof);
      setHeightInput(prof.height.toString());
      setTargetWeightInput(prof.targetWeight.toString());
    }
    const hist = await getWeightHistory();
    setHistory(hist);
    setFormError(null);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSuccessMsg(null);
    }, [])
  );

  const handleUpdateProfile = async () => {
    setFormError(null);
    setSuccessMsg(null);
    const heightNum = parseInt(heightInput, 10);
    const targetWeightNum = parseFloat(targetWeightInput.replace(",", "."));

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      setFormError("Geçerli bir boy girin (100 - 250 cm).");
      return;
    }
    if (isNaN(targetWeightNum) || targetWeightNum < 20 || targetWeightNum > 300) {
      setFormError("Geçerli bir hedef kilo girin (20 - 300 kg).");
      return;
    }

    const updated = await saveProfile(heightNum, targetWeightNum);
    setProfile(updated);
    setSuccessMsg("Profil güncellendi!");
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExportCSV = async () => {
    if (history.length === 0) {
      const m = "Dışa aktarılacak kilo kaydı bulunamadı.";
      Platform.OS === "web" ? window.alert(m) : Alert.alert("Veri Yok", m);
      return;
    }
    const csvContent = exportToCSV(history);

    if (Platform.OS === "web") {
      try {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "kilo_takip_verileri.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Web CSV download error:", e);
      }
    } else {
      try {
        const fileUri = FileSystem.documentDirectory + "kilo_takip_verileri.csv";
        await FileSystem.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Hata", "Paylaşım sistemi bu cihazda aktif değil.");
        }
      } catch (e) {
        console.error("Native share error:", e);
        Alert.alert("Hata", "CSV dosyası paylaşılamadı.");
      }
    }
  };

  const handleResetData = () => {
    const performReset = async () => {
      await clearAllData();
      setProfile(null);
      setHistory([]);
      setHeightInput("");
      setTargetWeightInput("");
      setSuccessMsg("Tüm veriler sıfırlandı.");
      setTimeout(() => setSuccessMsg(null), 3000);
    };
    const msg =
      "Tüm kilo geçmişiniz ve profil bilgileriniz silinecektir. Bu işlem GERİ ALINAMAZ! Onaylıyor musunuz?";
    if (Platform.OS === "web") {
      if (window.confirm(msg)) performReset();
    } else {
      Alert.alert("Verileri Sıfırla", msg, [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sıfırla", onPress: performReset, style: "destructive" },
      ]);
    }
  };

  const currentWeight = history.length > 0 ? history[history.length - 1].weight : 0;
  const initialWeight = history.length > 0 ? history[0].weight : 0;
  const bmi = profile ? calculateBMI(currentWeight, profile.height) : 0;
  const bmiInfo = getBMICategory(bmi);

  const getProgressInfo = () => {
    if (!profile || history.length === 0) return { percent: 0, text: "Veri bekleniyor" };
    const target = profile.targetWeight;
    if (currentWeight === target) return { percent: 100, text: "Hedefe ulaşıldı!" };
    const totalDistance = Math.abs(initialWeight - target);
    const currentDistance = Math.abs(currentWeight - target);
    if (totalDistance === 0) return { percent: 0, text: "Aynı başlangıç/hedef" };
    const diff = totalDistance - currentDistance;
    const rawPercent = Math.max(0, Math.min(100, (diff / totalDistance) * 100));
    return { percent: Math.round(rawPercent), text: `%${Math.round(rawPercent)} tamamlandı` };
  };

  const progress = getProgressInfo();
  const etaInfo = profile ? calculateETA(history, currentWeight, profile.targetWeight) : null;

  const ThemeOption = ({ type, icon: Icon, label }: { type: ThemeType; icon: any; label: string }) => {
    const isActive = theme === type;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setTheme(type)}
        className="flex-1 flex-row items-center justify-center py-3 rounded-xl border"
        style={{
          backgroundColor: isActive ? palette.accent + "1A" : palette.bg,
          borderColor: isActive ? palette.accent : palette.border,
        }}
      >
        <Icon size={16} color={isActive ? palette.accent : palette.muted} strokeWidth={2.4} />
        <Text
          className="ml-2 text-xs font-bold"
          style={{ color: isActive ? palette.accent : palette.subtext }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-light-bg dark:bg-dark-bg"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 48 }}
        className="flex-1"
      >
        <View className="mb-6 mt-2">
          <Text className="text-light-text dark:text-white text-2xl font-black tracking-tight">
            Profil & Ayarlar
          </Text>
          <Text className="text-light-muted dark:text-dark-muted text-xs font-semibold mt-1">
            Vücut analizi ve tercihler
          </Text>
        </View>

        {/* Fiziksel parametreler */}
        <Card elevated className="mb-5">
          <Text className="text-light-text dark:text-white text-[13px] font-extrabold uppercase tracking-wide mb-4">
            Fiziksel Parametreler
          </Text>

          {formError && (
            <View className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-3 mb-4">
              <Text className="text-accent-red text-xs font-semibold text-center">{formError}</Text>
            </View>
          )}
          {successMsg && (
            <View className="flex-row items-center justify-center bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 mb-4">
              <CheckCircle2 size={15} color={palette.green} strokeWidth={2.4} />
              <Text className="text-accent-green text-xs font-semibold text-center ml-1.5">{successMsg}</Text>
            </View>
          )}

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Input
                label="Boy (cm)"
                placeholder="180"
                keyboardType="numeric"
                value={heightInput}
                onChangeText={setHeightInput}
              />
            </View>
            <View className="flex-1">
              <Input
                label="Hedef Kilo (kg)"
                placeholder="75"
                keyboardType="numeric"
                value={targetWeightInput}
                onChangeText={setTargetWeightInput}
              />
            </View>
          </View>

          <Button title="Profili Güncelle" onPress={handleUpdateProfile} className="w-full mt-4" />
        </Card>

        {/* VKİ */}
        {profile && currentWeight > 0 ? (
          <Card className="mb-5">
            <View className="flex-row justify-between items-start mb-3">
              <View>
                <Text className="text-light-muted dark:text-dark-muted text-[10px] font-bold uppercase tracking-widest">
                  Vücut Kitle İndeksi
                </Text>
                <View className="flex-row items-baseline mt-1">
                  <Text className="text-4xl font-black text-light-text dark:text-white">{bmi.toFixed(1)}</Text>
                  <Text className="text-xs font-semibold text-light-subtext dark:text-dark-subtext ml-1.5">kg/m²</Text>
                </View>
              </View>
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: bmiInfo.color + "1A" }}
              >
                <Text className="text-xs font-extrabold uppercase" style={{ color: bmiInfo.color }}>
                  {bmiInfo.category}
                </Text>
              </View>
            </View>

            {/* İnce renkli konum çubuğu */}
            <View className="flex-row h-2 rounded-full overflow-hidden mt-2 mb-3 gap-0.5">
              {BMI_SEGMENTS.map((seg) => {
                const active = bmi >= seg.min && bmi < seg.max;
                const flex = seg.max - seg.min;
                return (
                  <View
                    key={seg.min}
                    style={{
                      flex,
                      backgroundColor: seg.color,
                      opacity: active ? 1 : 0.22,
                    }}
                  />
                );
              })}
            </View>

            <Text className="text-xs text-light-subtext dark:text-dark-subtext leading-5">
              {bmiInfo.description}
            </Text>
          </Card>
        ) : (
          <Card className="mb-5 items-center p-6 border-dashed">
            <Scale size={24} color={palette.muted} strokeWidth={1.6} />
            <Text className="text-light-text dark:text-white font-bold text-center mt-3 mb-1">VKİ Hesaplanamadı</Text>
            <Text className="text-light-subtext dark:text-dark-subtext text-xs text-center leading-5">
              Boyunuzu girin ve en az 1 kilo kaydı ekleyin.
            </Text>
          </Card>
        )}

        {/* Silüet */}
        <View className="mb-5">
          <MorphingSilhouette bmi={bmi} heightCm={profile?.height || 0} />
        </View>

        {/* Tema seçici */}
        <Card elevated className="mb-5">
          <Text className="text-light-text dark:text-white text-[13px] font-extrabold uppercase tracking-wide mb-3">
            Tema
          </Text>
          <View className="flex-row gap-2">
            <ThemeOption type="system" icon={MonitorSmartphone} label="Sistem" />
            <ThemeOption type="light" icon={Sun} label="Açık" />
            <ThemeOption type="dark" icon={Moon} label="Koyu" />
          </View>
        </Card>

        {/* Hedef ilerlemesi & ETA */}
        {profile && history.length > 0 && (
          <Card className="mb-5">
            <Text className="text-light-text dark:text-white text-[13px] font-extrabold uppercase tracking-wide mb-4">
              Hedef İlerlemesi
            </Text>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs text-light-muted dark:text-dark-muted font-bold">Tamamlanma</Text>
              <Text className="text-sm font-black text-accent-blue">{progress.text}</Text>
            </View>
            <View className="h-2.5 bg-light-bg dark:bg-dark-elevated rounded-full overflow-hidden mb-4">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress.percent}%`, backgroundColor: palette.accent }}
              />
            </View>

            <View className="flex-row items-center justify-between bg-light-bg dark:bg-dark-elevated rounded-xl p-3 mb-4">
              <View className="items-center flex-1">
                <Text className="text-[9px] text-light-muted dark:text-dark-muted font-bold uppercase tracking-wider">İlk</Text>
                <Text className="text-sm font-extrabold text-light-text dark:text-white mt-0.5">{initialWeight.toFixed(1)}</Text>
              </View>
              <ChevronRight size={14} color={palette.muted} />
              <View className="items-center flex-1">
                <Text className="text-[9px] text-light-muted dark:text-dark-muted font-bold uppercase tracking-wider">Güncel</Text>
                <Text className="text-sm font-extrabold text-accent-blue mt-0.5">{currentWeight.toFixed(1)}</Text>
              </View>
              <ChevronRight size={14} color={palette.muted} />
              <View className="items-center flex-1">
                <Text className="text-[9px] text-light-muted dark:text-dark-muted font-bold uppercase tracking-wider">Hedef</Text>
                <Text className="text-sm font-extrabold text-accent-purple mt-0.5">{profile.targetWeight.toFixed(1)}</Text>
              </View>
            </View>

            {etaInfo && (
              <View className="flex-row items-start gap-3 border-t border-light-border dark:border-dark-border pt-4">
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor:
                      (etaInfo.status === "reached"
                        ? palette.green
                        : etaInfo.status === "wrong_direction"
                        ? palette.red
                        : palette.purple) + "14",
                  }}
                >
                  {etaInfo.status === "reached" ? (
                    <CheckCircle2 size={18} color={palette.green} strokeWidth={2.4} />
                  ) : etaInfo.status === "wrong_direction" ? (
                    <TrendingUp size={18} color={palette.red} strokeWidth={2.4} />
                  ) : (
                    <Target size={18} color={palette.purple} strokeWidth={2.4} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-light-text dark:text-white font-bold uppercase tracking-wider">
                    {etaInfo.status === "reached"
                      ? "Hedefe Ulaşıldı!"
                      : etaInfo.status === "wrong_direction"
                      ? "Eğilim Yönü Hatalı"
                      : etaInfo.status === "success"
                      ? "Tahmini Hedef Tarihi"
                      : "Tahmin"}
                  </Text>
                  {etaInfo.status === "success" ? (
                    <>
                      <Text className="text-sm font-black text-accent-purple mt-1">{etaInfo.etaDate}</Text>
                      <Text className="text-xs text-light-subtext dark:text-dark-subtext mt-1.5 leading-5">
                        Haftalık {Math.abs(etaInfo.ratePerWeek)} kg hızıyla hedefe yaklaşık{" "}
                        <Text className="text-light-text dark:text-white font-extrabold">{etaInfo.weeksRemaining} hafta</Text> kaldı.
                      </Text>
                    </>
                  ) : (
                    <Text className="text-xs text-light-subtext dark:text-dark-subtext mt-1 leading-5">{etaInfo.etaDate}</Text>
                  )}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Dışa aktar + sıfırla */}
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleExportCSV}
              className="h-12 flex-row items-center justify-center rounded-2xl border border-light-border dark:border-dark-border bg-light-card dark:bg-dark-card"
            >
              <Download size={16} color={palette.accent} strokeWidth={2.4} />
              <Text className="text-light-text dark:text-white text-[13px] font-bold ml-2">Dışa Aktar</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleResetData}
              className="h-12 flex-row items-center justify-center rounded-2xl border border-accent-red/30 bg-accent-red/10"
            >
              <RotateCcw size={16} color={palette.red} strokeWidth={2.4} />
              <Text className="text-accent-red text-[13px] font-bold ml-2">Sıfırla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
