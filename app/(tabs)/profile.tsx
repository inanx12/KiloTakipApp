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
  Download,
  Trash2,
  Scale,
  Dumbbell,
  Target,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Moon,
  Sun,
  MonitorSmartphone,
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<WeightEntry[]>([]);

  // Theme
  const { theme, setTheme, isDark } = useTheme();

  // Form states
  const [heightInput, setHeightInput] = useState<string>("");
  const [targetWeightInput, setTargetWeightInput] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load profile and history
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

    const heightNum = parseInt(heightInput);
    const targetWeightNum = parseFloat(targetWeightInput.replace(",", "."));

    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      setFormError("Lütfen geçerli bir boy girin (100 - 250 cm).");
      return;
    }

    if (isNaN(targetWeightNum) || targetWeightNum < 20 || targetWeightNum > 300) {
      setFormError("Lütfen geçerli bir hedef kilo girin (20 - 300 kg).");
      return;
    }

    const updated = await saveProfile(heightNum, targetWeightNum);
    setProfile(updated);
    setSuccessMsg("Profil ayarlarınız başarıyla güncellendi!");
    
    setTimeout(() => {
      setSuccessMsg(null);
    }, 3000);
  };

  const handleExportCSV = async () => {
    if (history.length === 0) {
      if (Platform.OS === "web") {
        window.alert("Dışa aktarılacak kilo kaydı bulunamadı.");
      } else {
        Alert.alert("Veri Yok", "Dışa aktarılacak kilo kaydı bulunamadı.");
      }
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
      setSuccessMsg("Tüm veriler başarıyla sıfırlandı.");
      setTimeout(() => setSuccessMsg(null), 3000);
    };

    if (Platform.OS === "web") {
      if (window.confirm("Tüm kilo geçmişiniz ve profil bilgileriniz silinecektir. Bu işlem GERİ ALINAMAZ! Onaylıyor musunuz?")) {
        performReset();
      }
    } else {
      Alert.alert(
        "Verileri Sıfırla",
        "Tüm kilo geçmişiniz ve profil bilgileriniz silinecektir. Bu işlem GERİ ALINAMAZ! Onaylıyor musunuz?",
        [
          { text: "Vazgeç", style: "cancel" },
          { text: "Sıfırla", onPress: performReset, style: "destructive" },
        ]
      );
    }
  };

  const currentWeight = history.length > 0 ? history[history.length - 1].weight : 0;
  const initialWeight = history.length > 0 ? history[0].weight : 0;
  
  const bmi = profile ? calculateBMI(currentWeight, profile.height) : 0;
  const bmiInfo = getBMICategory(bmi);

  const getProgressInfo = () => {
    if (!profile || history.length === 0) return { percent: 0, text: "Giriş yapılması bekleniyor" };
    const target = profile.targetWeight;
    
    if (currentWeight === target) return { percent: 100, text: "Hedefe ulaşıldı!" };

    const totalDistance = Math.abs(initialWeight - target);
    const currentDistance = Math.abs(currentWeight - target);

    if (totalDistance === 0) return { percent: 0, text: "Aynı başlangıç/hedef kilo" };

    const diff = totalDistance - currentDistance;
    const rawPercent = Math.max(0, Math.min(100, (diff / totalDistance) * 100));
    
    return {
      percent: Math.round(rawPercent),
      text: `%${Math.round(rawPercent)} tamamlandı`,
    };
  };

  const progress = getProgressInfo();
  const etaInfo = profile
    ? calculateETA(history, currentWeight, profile.targetWeight)
    : null;

  const ThemeOption = ({ type, icon: Icon, label }: { type: ThemeType, icon: any, label: string }) => {
    const isActive = theme === type;
    return (
      <TouchableOpacity
        onPress={() => setTheme(type)}
        className={`flex-1 flex-row items-center justify-center p-3 rounded-xl border ${
          isActive 
            ? "bg-accent-blue/10 border-accent-blue" 
            : "bg-light-bg dark:bg-dark-bg border-light-border dark:border-dark-border"
        }`}
      >
        <Icon size={16} color={isActive ? "#00F0FF" : isDark ? "#9A9AB0" : "#6C757D"} />
        <Text className={`ml-2 text-xs font-bold ${isActive ? "text-accent-blue" : "text-light-subtext dark:text-dark-subtext"}`}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-light-bg dark:bg-dark-bg"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        className="flex-1"
      >
        <View className="mb-6 mt-4">
          <Text className="text-3xl font-black text-light-text dark:text-white tracking-tight uppercase">
            Profil & Ayarlar
          </Text>
          <Text className="text-xs text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-bold mt-1">
            Gövde Analizi ve Tercihler
          </Text>
        </View>

        <View className="mb-6">
          <MorphingSilhouette bmi={bmi} heightCm={profile?.height || 0} />
        </View>

        {profile && currentWeight > 0 ? (
          <Card className="mb-6 border-l-4" style={{ borderLeftColor: bmiInfo.color }}>
            <View className="flex-row justify-between items-center mb-2">
              <View>
                <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-widest font-black">
                  VÜCUT KİTLE İNDEKSİ (VKİ)
                </Text>
                <Text className="text-3xl font-black text-light-text dark:text-white mt-1">
                  {bmi.toFixed(1)} <Text className="text-xs font-semibold text-light-subtext dark:text-dark-subtext">kg/m²</Text>
                </Text>
              </View>

              <View
                className="px-3.5 py-1.5 rounded-full border"
                style={{ borderColor: bmiInfo.color + "40", backgroundColor: bmiInfo.color + "12" }}
              >
                <Text className="text-xs font-extrabold uppercase" style={{ color: bmiInfo.color }}>
                  {bmiInfo.category}
                </Text>
              </View>
            </View>

            <View className="h-1.5 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-full mt-3 mb-2 flex-row overflow-hidden">
              <View className="flex-1 border-r border-light-border dark:border-dark-border/40" style={{ backgroundColor: bmi < 18.5 ? "#00F0FF" : "transparent" }} />
              <View className="flex-1.5 border-r border-light-border dark:border-dark-border/40" style={{ backgroundColor: bmi >= 18.5 && bmi < 25 ? "#00FF87" : "transparent" }} />
              <View className="flex-1.2 border-r border-light-border dark:border-dark-border/40" style={{ backgroundColor: bmi >= 25 && bmi < 30 ? "#BF55EC" : "transparent" }} />
              <View className="flex-1" style={{ backgroundColor: bmi >= 30 ? "#FF3B30" : "transparent" }} />
            </View>

            <Text className="text-xs text-light-subtext dark:text-dark-subtext mt-1 leading-5">
              {bmiInfo.description}
            </Text>
          </Card>
        ) : (
          <Card className="mb-6 items-center p-6 border border-dashed border-light-border dark:border-dark-border">
            <Scale size={24} color={isDark ? "#9A9AB0" : "#6C757D"} strokeWidth={1.5} />
            <Text className="text-light-text dark:text-white font-bold text-center mt-3 mb-1">VKİ Hesaplanamadı</Text>
            <Text className="text-light-subtext dark:text-dark-subtext text-xs text-center leading-5">
              VKİ hesabının yapılabilmesi için lütfen boyunuzu girin ve en az 1 kilo kaydı ekleyin.
            </Text>
          </Card>
        )}

        {/* Theme Selector */}
        <Card className="mb-6">
          <Text className="text-base font-black text-light-text dark:text-white mb-4 uppercase tracking-wide">
            Tema Ayarları
          </Text>
          <View className="flex-row space-x-2 gap-2">
            <ThemeOption type="system" icon={MonitorSmartphone} label="Sistem" />
            <ThemeOption type="light" icon={Sun} label="Aydınlık" />
            <ThemeOption type="dark" icon={Moon} label="Karanlık" />
          </View>
        </Card>

        {/* Input Profile Card */}
        <Card className="mb-6">
          <Text className="text-base font-black text-light-text dark:text-white mb-4 uppercase tracking-wide">
            Fiziksel Parametreler
          </Text>

          {formError && (
            <View className="bg-accent-red/10 border border-accent-red/20 rounded-xl p-3 mb-4">
              <Text className="text-accent-red text-xs font-semibold text-center">{formError}</Text>
            </View>
          )}

          {successMsg && (
            <View className="bg-accent-green/10 border border-accent-green/20 rounded-xl p-3 mb-4">
              <Text className="text-accent-green text-xs font-semibold text-center">{successMsg}</Text>
            </View>
          )}

          <View className="flex-row space-x-4 gap-4 w-full">
            <View className="flex-1 w-1/2">
              <Input
                label="Boy (cm)"
                placeholder="Örn: 180"
                keyboardType="numeric"
                value={heightInput}
                onChangeText={setHeightInput}
              />
            </View>

            <View className="flex-1 w-1/2">
              <Input
                label="Hedef Kilo (kg)"
                placeholder="Örn: 75.0"
                keyboardType="numeric"
                value={targetWeightInput}
                onChangeText={setTargetWeightInput}
              />
            </View>
          </View>

          <Button
            title="PROFİLİ GÜNCELLE"
            onPress={handleUpdateProfile}
            className="w-full mt-2"
          />
        </Card>

        {/* Target Progress & ETA Card */}
        {profile && history.length > 0 && (
          <Card className="mb-6">
            <Text className="text-base font-black text-light-text dark:text-white mb-4 uppercase tracking-wide">
              Hedef İlerlemesi & Tahmin
            </Text>

            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-xs text-light-subtext dark:text-dark-subtext font-bold">Tamamlanma Oranı</Text>
              <Text className="text-sm font-black text-accent-blue">{progress.text}</Text>
            </View>

            <View className="h-3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-full overflow-hidden mb-4 p-0.5">
              <View
                className="h-full bg-accent-blue rounded-full shadow"
                style={{ width: `${progress.percent}%` }}
              />
            </View>

            <View className="flex-row items-center justify-between bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl p-3 mb-4">
              <View className="items-center flex-1">
                <Text className="text-[9px] text-light-subtext dark:text-dark-subtext font-bold uppercase tracking-wider">İLK KİLO</Text>
                <Text className="text-sm font-extrabold text-light-text dark:text-white mt-0.5">{initialWeight.toFixed(1)} kg</Text>
              </View>
              <ChevronRight size={14} color={isDark ? "#232335" : "#E9ECEF"} />
              <View className="items-center flex-1">
                <Text className="text-[9px] text-light-subtext dark:text-dark-subtext font-bold uppercase tracking-wider">GÜNCEL</Text>
                <Text className="text-sm font-extrabold text-accent-blue mt-0.5">{currentWeight.toFixed(1)} kg</Text>
              </View>
              <ChevronRight size={14} color={isDark ? "#232335" : "#E9ECEF"} />
              <View className="items-center flex-1">
                <Text className="text-[9px] text-light-subtext dark:text-dark-subtext font-bold uppercase tracking-wider">HEDEF</Text>
                <Text className="text-sm font-extrabold text-accent-purple mt-0.5">{profile.targetWeight.toFixed(1)} kg</Text>
              </View>
            </View>

            {etaInfo && (
              <View className="border-t border-light-border dark:border-dark-border/60 pt-4 mt-1">
                <View className="flex-row items-start space-x-3 gap-3">
                  <View className="bg-light-bg dark:bg-dark-bg p-2.5 border border-light-border dark:border-dark-border rounded-xl mt-0.5">
                    {etaInfo.status === "reached" ? (
                      <Dumbbell size={16} color="#00FF87" />
                    ) : etaInfo.status === "wrong_direction" ? (
                      <TrendingUp size={16} color="#FF3B30" />
                    ) : (
                      <Target size={16} color="#BF55EC" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-light-text dark:text-white font-bold uppercase tracking-wider">
                      {etaInfo.status === "reached"
                        ? "HEDEFE ULAŞILDI!"
                        : etaInfo.status === "wrong_direction"
                        ? "EĞİLİM YÖNÜ HATALI"
                        : "TAHMİNİ HEDEF TARİHİ"}
                    </Text>

                    {etaInfo.status === "success" && (
                      <Text className="text-sm font-black text-accent-purple mt-1">
                        {etaInfo.etaDate}
                      </Text>
                    )}

                    {etaInfo.status !== "success" && (
                      <Text className="text-xs text-light-subtext dark:text-dark-subtext font-bold mt-1">
                        {etaInfo.etaDate}
                      </Text>
                    )}

                    {etaInfo.status === "success" && (
                      <Text className="text-xs text-light-subtext dark:text-dark-subtext mt-1.5 leading-5 font-semibold">
                        Mevcut haftalık hızınızla ({Math.abs(etaInfo.ratePerWeek)} kg/hafta) hedefinize ulaşmak için yaklaşık{" "}
                        <Text className="text-light-text dark:text-white font-extrabold">{etaInfo.weeksRemaining} hafta</Text> gerekmektedir.
                      </Text>
                    )}

                    {etaInfo.status === "wrong_direction" && (
                      <Text className="text-xs text-light-subtext dark:text-dark-subtext mt-1.5 leading-5 font-semibold">
                        Hedefiniz kilo {currentWeight > profile.targetWeight ? "vermek" : "almak"} ancak son dönemde kilo{" "}
                        {etaInfo.ratePerWeek > 0 ? "aldınız" : "verdiniz"} ({Math.abs(etaInfo.ratePerWeek)} kg/hafta).
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Global Utilities Action Cards */}
        <Card className="p-4 space-y-3 gap-3">
          <Text className="text-xs text-light-subtext dark:text-dark-subtext font-black uppercase tracking-wider mb-2 ml-1">
            Yönetici Araçları
          </Text>

          <Button
            title="VERİLERİ CSV DIŞA AKTAR"
            onPress={handleExportCSV}
            variant="outline"
            className="w-full h-11 border-accent-blue/20"
            textClassName="text-xs font-extrabold"
          />

          <Button
            title="TÜM VERİLERİ SIFIRLA"
            onPress={handleResetData}
            variant="danger"
            className="w-full h-11 bg-accent-red/10 border border-accent-red/20 active:bg-accent-red"
            textClassName="text-xs font-extrabold text-accent-red active:text-white"
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
