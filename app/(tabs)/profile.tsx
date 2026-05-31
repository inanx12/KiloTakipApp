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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Download, Upload, Trash2, Scale, Moon, Sun, Smartphone, ChevronRight } from "lucide-react-native";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { MorphingSilhouette } from "../../components/MorphingSilhouette";
import {
  getProfile,
  saveProfile,
  getWeightHistory,
  clearAllData,
  importBackup,
  UserProfile,
  WeightEntry,
} from "../../utils/storage";
import { calculateBMI, getBMICategory, calculateETA, exportToCSV, parseBackupCSV } from "../../utils/helpers";
import { useTheme, ThemeType } from "../../utils/ThemeContext";

// VKİ kategori renkleri — helpers.getBMICategory ile birebir aynı kodlar
const BMI_ZONES = [
  { label: "Zayıf", color: "#00F0FF" },
  { label: "Normal", color: "#30E0A1" },
  { label: "Fazla", color: "#BF55EC" },
  { label: "Obez", color: "#FF8A5B" },
];

export default function ProfileScreen() {
  const { theme, setTheme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)";

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

    const heightNum = parseInt(heightInput);
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
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleExportCSV = async () => {
    if (history.length === 0) {
      const msg = "Dışa aktarılacak kilo kaydı bulunamadı.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Veri Yok", msg);
      return;
    }

    const csvContent = exportToCSV(history, profile);

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
        await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
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

  const applyImport = async (text: string, debug?: string) => {
    const raw = text || "";

    // Excel/.xlsx (ZIP arşivi, "PK" ile başlar) veya metin olmayan dosya tespiti
    const head = raw.replace(/^[\uFEFF\s]+/, "").slice(0, 4);
    if (head.startsWith("PK") || /\u0000/.test(raw.slice(0, 2000))) {
      const msg =
        "Seçtiğin dosya bir Excel (.xlsx) / metin olmayan dosya; uygulama düz .csv bekliyor.\n\n" +
        "Dosyayı Excel'de AÇIP KAYDETME — Excel .csv'yi .xlsx'e çevirir. " +
        "'Dışa Aktar' ile oluşan .csv dosyasını doğrudan seç.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("İçe Aktarma", msg);
      return;
    }

    const { entries, profile: importedProfile } = parseBackupCSV(raw);
    if (entries.length === 0 && !importedProfile) {
      const preview = raw.slice(0, 60).replace(/\r/g, "\\r").replace(/\n/g, "\\n");
      const msg =
        `Geçerli yedek verisi bulunamadı.\n` +
        `Okunan: ${raw.length} karakter.` +
        (raw.length > 0 ? `\nBaşlangıç: "${preview}"` : `\n(Dosya boş okundu.)`) +
        (debug ? `\n${debug}` : ``);
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("İçe Aktarma", msg);
      return;
    }

    const res = await importBackup(entries, importedProfile);
    await loadData(); // ekranı anında tazele
    const okMsg = `Yedek yüklendi: ${entries.length} kayıt${res.profileImported ? " + profil" : ""}.`;
    setSuccessMsg(okMsg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleImportCSV = async () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".csv,.txt,text/csv,text/plain";
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          await applyImport(text);
        } catch (err) {
          console.error("Web import error:", err);
          window.alert("Dosya okunamadı.");
        }
      };
      input.click();
    } else {
      try {
        const res = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
        });
        if (res.canceled) return;
        const asset = res.assets?.[0];
        if (!asset?.uri) {
          Alert.alert("İçe Aktarma", "Dosya seçilemedi.");
          return;
        }

        let text = "";
        let readErr = "";
        try {
          text = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch (e: any) {
          readErr = String(e?.message || e);
        }

        const scheme = asset.uri.split(":")[0];
        const debug = `[uri:${scheme} · boyut:${asset.size ?? "?"}B${readErr ? ` · okuma hatası: ${readErr}` : ""}]`;
        await applyImport(text, debug);
      } catch (err) {
        console.error("Native import error:", err);
        Alert.alert("Hata", "Dosya seçilemedi veya okunamadı.");
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
      setTimeout(() => setSuccessMsg(null), 2500);
    };

    const msg = "Tüm kilo geçmişiniz ve profil bilgileriniz silinecek. Bu işlem GERİ ALINAMAZ!";
    if (Platform.OS === "web") {
      if (window.confirm(msg + " Onaylıyor musunuz?")) performReset();
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

  // VKİ pozisyonu (15 - 40 aralığında %)
  // Beyaz işaretleyici konumu: bar 4 EŞİT genişlikte segment (%25'er) ama
  // kategoriler eşit olmayan VKİ aralıkları. Doğrusal eşleme noktayı yanlış
  // segmente koyuyordu (ör. VKİ 31 Obez iken Fazla diliminde görünüyordu).
  // Parçalı eşleme: her kategori kendi %25'lik dilimine denk gelir.
  const bmiPercent = (() => {
    const c = (t: number) => Math.max(0, Math.min(1, t));
    if (bmi < 18.5) return c((bmi - 13) / (18.5 - 13)) * 25;
    if (bmi < 25) return 25 + c((bmi - 18.5) / (25 - 18.5)) * 25;
    if (bmi < 30) return 50 + c((bmi - 25) / (30 - 25)) * 25;
    return 75 + c((bmi - 30) / (45 - 30)) * 25;
  })();
  const activeZone = bmi <= 0 ? -1 : bmi < 18.5 ? 0 : bmi < 25 ? 1 : bmi < 30 ? 2 : 3;

  const getProgressInfo = () => {
    if (!profile || history.length === 0) return { percent: 0, text: "Veri bekleniyor" };
    const target = profile.targetWeight;
    if (currentWeight === target) return { percent: 100, text: "Hedefe ulaşıldı!" };
    const totalDistance = Math.abs(initialWeight - target);
    const currentDistance = Math.abs(currentWeight - target);
    if (totalDistance === 0) return { percent: 0, text: "Başlangıç = hedef" };
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
        onPress={() => setTheme(type)}
        className={`flex-1 flex-row items-center justify-center py-3 rounded-xl border ${
          isActive
            ? "bg-accent-blue/10 border-accent-blue/50"
            : "bg-light-elevated dark:bg-dark-elevated border-light-border dark:border-dark-border"
        }`}
      >
        <Icon size={15} color={isActive ? "#00F0FF" : muted} />
        <Text
          className={`ml-2 text-xs font-bold ${
            isActive ? "text-accent-blue" : "text-light-subtext dark:text-dark-subtext"
          }`}
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 32 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(450)} className="mb-5">
          <Text className="text-2xl font-black text-light-text dark:text-dark-text">Profil & Ayarlar</Text>
          <Text className="text-[11px] font-bold uppercase tracking-[2px] text-light-subtext dark:text-dark-subtext mt-1">
            Gövde Analizi ve Tercihler
          </Text>
        </Animated.View>

        {/* Fiziksel parametreler — yan yana inputlar */}
        <Animated.View entering={FadeInDown.duration(450).delay(60)}>
          <Card className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext mb-3">
              Fiziksel Parametreler
            </Text>

            <View className="flex-row gap-3">
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

            {formError ? (
              <Text className="text-accent-red text-xs font-semibold mt-3">{formError}</Text>
            ) : null}
            {successMsg ? (
              <Text className="text-accent-green text-xs font-semibold mt-3">{successMsg}</Text>
            ) : null}

            <Button title="Profili Güncelle" onPress={handleUpdateProfile} className="mt-4" />
          </Card>
        </Animated.View>

        {/* VKİ + kategori + bar */}
        <Animated.View entering={FadeInDown.duration(450).delay(120)}>
          {profile && currentWeight > 0 ? (
            <Card className="mb-4">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
                    Vücut Kitle İndeksi
                  </Text>
                  <View className="flex-row items-baseline mt-1">
                    <Text className="text-4xl font-black text-light-text dark:text-dark-text">{bmi.toFixed(1)}</Text>
                    <Text className="text-xs font-bold text-light-subtext dark:text-dark-subtext ml-1.5">kg/m²</Text>
                  </View>
                </View>
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: bmiInfo.color + "1A" }}
                >
                  <Text className="text-xs font-extrabold" style={{ color: bmiInfo.color }}>
                    {bmiInfo.category}
                  </Text>
                </View>
              </View>

              {/* İnce renkli bar + konum işaretleyici */}
              <View className="mt-1">
                <View className="flex-row gap-1 h-2">
                  {BMI_ZONES.map((z, i) => (
                    <View
                      key={z.label}
                      className="flex-1 rounded-full"
                      style={{ backgroundColor: activeZone === i ? z.color : z.color + "33" }}
                    />
                  ))}
                </View>
                <View
                  className="w-3 h-3 rounded-full bg-light-text dark:bg-dark-text absolute -top-0.5"
                  style={{ left: `${bmiPercent}%`, marginLeft: -6, borderWidth: 2, borderColor: isDark ? "#16161A" : "#FFFFFF" }}
                />
                <View className="flex-row justify-between mt-2">
                  {BMI_ZONES.map((z) => (
                    <Text key={z.label} className="text-[9px] font-bold text-light-subtext dark:text-dark-subtext">
                      {z.label}
                    </Text>
                  ))}
                </View>
              </View>

              <Text className="text-xs text-light-value dark:text-dark-value mt-3 leading-5">{bmiInfo.description}</Text>
            </Card>
          ) : (
            <Card className="mb-4 items-center py-7">
              <Scale size={24} color={muted} strokeWidth={1.5} />
              <Text className="text-light-text dark:text-dark-text font-bold text-center mt-3 mb-1">VKİ Hesaplanamadı</Text>
              <Text className="text-light-subtext dark:text-dark-subtext text-xs text-center leading-5">
                Boyunuzu girin ve en az 1 kilo kaydı ekleyin.
              </Text>
            </Card>
          )}
        </Animated.View>

        {/* MorphingSilhouette — çerçeveli alan */}
        <Animated.View entering={FadeInDown.duration(450).delay(180)} className="mb-4">
          <MorphingSilhouette bmi={bmi} heightCm={profile?.height || 0} />
        </Animated.View>

        {/* Hedef ilerlemesi & ETA */}
        {profile && history.length > 0 ? (
          <Animated.View entering={FadeInDown.duration(450).delay(240)}>
            <Card className="mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
                  Hedef İlerlemesi
                </Text>
                <Text className="text-sm font-black text-accent-blue">{progress.text}</Text>
              </View>

              <View className="h-2.5 bg-light-elevated dark:bg-dark-elevated rounded-full overflow-hidden mb-4">
                <View className="h-full bg-accent-blue rounded-full" style={{ width: `${progress.percent}%` }} />
              </View>

              <View className="flex-row items-center justify-between bg-light-elevated dark:bg-dark-elevated rounded-xl p-3">
                <View className="items-center flex-1">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">İlk</Text>
                  <Text className="text-sm font-black text-light-text dark:text-dark-text mt-0.5">{initialWeight.toFixed(1)}</Text>
                </View>
                <ChevronRight size={14} color={muted} />
                <View className="items-center flex-1">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">Güncel</Text>
                  <Text className="text-sm font-black text-accent-blue mt-0.5">{currentWeight.toFixed(1)}</Text>
                </View>
                <ChevronRight size={14} color={muted} />
                <View className="items-center flex-1">
                  <Text className="text-[9px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">Hedef</Text>
                  <Text className="text-sm font-black text-accent-purple mt-0.5">{profile.targetWeight.toFixed(1)}</Text>
                </View>
              </View>

              {etaInfo && etaInfo.status === "success" ? (
                <Text className="text-xs text-light-value dark:text-dark-value mt-3 leading-5">
                  Mevcut hızınızla ({Math.abs(etaInfo.ratePerWeek)} kg/hafta) hedefe{" "}
                  <Text className="text-light-text dark:text-dark-text font-extrabold">{etaInfo.weeksRemaining} hafta</Text> kaldı
                  · Tahmini: <Text className="text-accent-purple font-extrabold">{etaInfo.etaDate}</Text>
                </Text>
              ) : etaInfo && etaInfo.status === "wrong_direction" ? (
                <Text className="text-xs text-accent-red mt-3 leading-5 font-semibold">{etaInfo.etaDate}</Text>
              ) : etaInfo ? (
                <Text className="text-xs text-light-subtext dark:text-dark-subtext mt-3 leading-5 font-semibold">{etaInfo.etaDate}</Text>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        {/* Tema seçici */}
        <Animated.View entering={FadeInDown.duration(450).delay(300)}>
          <Card className="mb-4">
            <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext mb-3">
              Tema
            </Text>
            <View className="flex-row gap-2">
              <ThemeOption type="system" icon={Smartphone} label="Sistem" />
              <ThemeOption type="light" icon={Sun} label="Aydınlık" />
              <ThemeOption type="dark" icon={Moon} label="Karanlık" />
            </View>
          </Card>
        </Animated.View>

        {/* Yedekleme: Dışa/İçe aktar + Sıfırla */}
        <Animated.View entering={FadeInDown.duration(450).delay(360)}>
          <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext mb-2 ml-0.5">
            Yedekleme
          </Text>

          <View className="flex-row gap-3 mb-2.5">
            <View className="flex-1">
              <Button
                title="Dışa Aktar"
                variant="subtle"
                onPress={handleExportCSV}
                icon={<Download size={15} color={isDark ? "#FFFFFF" : "#0A0A0B"} />}
              />
            </View>
            <View className="flex-1">
              <Button
                title="İçe Aktar"
                variant="subtle"
                onPress={handleImportCSV}
                icon={<Upload size={15} color={isDark ? "#FFFFFF" : "#0A0A0B"} />}
              />
            </View>
          </View>

          <Text className="text-[11px] text-light-subtext dark:text-dark-subtext leading-4 mb-3 ml-0.5">
            CSV ile yedek al; uygulamayı silsen bile "İçe Aktar" ile tüm kayıtların ve profilin geri gelir.
          </Text>

          <Button
            title="Tüm Verileri Sıfırla"
            variant="danger"
            onPress={handleResetData}
            icon={<Trash2 size={15} color="#FF5A5F" />}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
