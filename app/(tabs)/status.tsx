import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import dayjs from "dayjs";
import { Shield, Flame, Zap, Target, CheckCircle2, Lock, Moon, Snowflake } from "lucide-react-native";

import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useTheme } from "../../utils/ThemeContext";
import { getRankState, completeQuest } from "../../utils/storage";
import {
  RankState,
  computeRank,
  getMomentum,
  getNextRankProgress,
  getDailyQuest,
  getRankPhase,
} from "../../utils/helpers";
import { RANK_TABLE } from "../../constants/rankConfig";
import { RANK_ACCENT } from "../../constants/rankColors";

export default function StatusScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const muted = isDark ? "rgba(255,255,255,0.40)" : "rgba(10,10,11,0.42)";

  const [state, setState] = useState<RankState | null>(null);
  const today = dayjs().format("YYYY-MM-DD");

  const load = async () => setState(await getRankState());

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const handleCompleteQuest = async () => {
    await completeQuest();
    await load();
  };

  if (!state) {
    return (
      <View className="flex-1 bg-light-bg dark:bg-dark-bg items-center justify-center px-8">
        <Shield size={28} color={muted} strokeWidth={1.5} />
        <Text className="text-light-text dark:text-dark-text font-bold text-center mt-3 mb-1">
          Durum Penceresi
        </Text>
        <Text className="text-light-subtext dark:text-dark-subtext text-xs text-center leading-5">
          İlk kilo kaydını ekle, avcı yolculuğun başlasın.
        </Text>
      </View>
    );
  }

  const rank = computeRank(state);
  const accent = RANK_ACCENT[rank.key];
  const next = getNextRankProgress(state);
  const momentum = getMomentum(state.current7dAvg, state.prev7dAvg);
  const phase = getRankPhase(state, today);
  const quest = getDailyQuest(today);
  const questDone = state.questDoneDate === today;

  const momentumInfo =
    momentum === "up"
      ? { label: "🔥 İvme iyi", color: "#30E0A1" }
      : momentum === "down"
      ? { label: "↓ Dikkat", color: "#FF5A5F" }
      : { label: "→ Sabit", color: muted };

  const phaseBadge =
    phase === "sleeping"
      ? { label: "⏸ Durağan", color: "#FF8A5B", Icon: Moon }
      : phase === "frozen"
      ? { label: "Donma", color: "#00F0FF", Icon: Snowflake }
      : null;

  const ProgressBar = ({ pct, color }: { pct: number; color: string }) => (
    <View className="h-2.5 bg-light-elevated dark:bg-dark-elevated rounded-full overflow-hidden">
      <View
        className="h-full rounded-full"
        style={{ width: `${Math.round(pct * 100)}%`, backgroundColor: color }}
      />
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-light-bg dark:bg-dark-bg"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 32 }}
    >
      {/* Başlık */}
      <Animated.View entering={FadeInDown.duration(450)} className="mb-5">
        <Text className="text-2xl font-black text-light-text dark:text-dark-text">Durum Penceresi</Text>
        <Text className="text-[11px] font-bold uppercase tracking-[2px] text-light-subtext dark:text-dark-subtext mt-1">
          Avcı Sıralaması
        </Text>
      </Animated.View>

      {/* Rütbe rozeti (büyük) */}
      <Animated.View entering={FadeInDown.duration(450).delay(60)}>
        <Card elevated className="items-center py-7" style={{ borderColor: accent + "55" }}>
          {phaseBadge ? (
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: phaseBadge.color + "1A" }}
            >
              <phaseBadge.Icon size={12} color={phaseBadge.color} strokeWidth={2.5} />
              <Text className="text-[11px] font-extrabold ml-1" style={{ color: phaseBadge.color }}>
                {phaseBadge.label}
              </Text>
            </View>
          ) : null}

          <View
            className="w-20 h-20 rounded-3xl items-center justify-center mb-3"
            style={{ backgroundColor: accent + "1A", borderWidth: 1.5, borderColor: accent + "55" }}
          >
            <Shield size={38} color={accent} strokeWidth={2.5} />
          </View>

          {!rank.maintenance ? (
            <Text className="text-5xl font-black" style={{ color: accent }}>
              {rank.key}
            </Text>
          ) : null}
          <Text className="text-base font-black text-light-text dark:text-dark-text mt-1">{rank.name}</Text>
          <Text className="text-[11px] font-semibold mt-2" style={{ color: momentumInfo.color }}>
            {momentumInfo.label}
          </Text>
        </Card>
      </Animated.View>

      {/* Bir sonraki rütbeye ilerleme */}
      <Animated.View entering={FadeInDown.duration(450).delay(120)} className="mt-4">
        <Card>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
              {next.next ? `Sonraki: ${next.next.key} · ${next.next.name}` : "En üst rütbe"}
            </Text>
          </View>

          {next.next ? (
            <>
              {/* XP çubuğu */}
              <View className="flex-row items-center mb-1.5">
                <Zap size={13} color="#00F0FF" strokeWidth={2.5} />
                <Text className="text-[11px] font-bold text-light-text dark:text-dark-text ml-1.5">
                  Tutarlılık XP
                </Text>
                <Text className="text-[11px] font-semibold text-light-subtext dark:text-dark-subtext ml-auto">
                  {Math.round(rank.xp)} XP{next.xpNeed > 0 ? ` · +${Math.round(next.xpNeed)} gerek` : " ✓"}
                </Text>
              </View>
              <ProgressBar pct={next.xpPct} color="#00F0FF" />

              {/* RP çubuğu */}
              <View className="flex-row items-center mt-4 mb-1.5">
                <Target size={13} color="#BF55EC" strokeWidth={2.5} />
                <Text className="text-[11px] font-bold text-light-text dark:text-dark-text ml-1.5">
                  Gerçek İlerleme (RP)
                </Text>
                <Text className="text-[11px] font-semibold text-light-subtext dark:text-dark-subtext ml-auto">
                  {Math.round(rank.rp)} RP{next.rpNeed > 0 ? ` · +${Math.round(next.rpNeed)} gerek` : " ✓"}
                </Text>
              </View>
              <ProgressBar pct={next.rpPct} color="#BF55EC" />
            </>
          ) : (
            <Text className="text-xs text-light-value dark:text-dark-value leading-5">
              {rank.maintenance
                ? "Hedefe ulaştın — Bakım Modu'ndasın. Avcılığın sürüyor."
                : "Zirvedesin, Hükümdar. Mevcut formunu koru."}
            </Text>
          )}
        </Card>
      </Animated.View>

      {/* Günlük görev kartı */}
      <Animated.View entering={FadeInDown.duration(450).delay(180)} className="mt-4">
        <Card style={{ borderColor: questDone ? "#30E0A155" : undefined }}>
          <View className="flex-row items-center mb-2">
            <Lock size={13} color={muted} strokeWidth={2.5} />
            <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext ml-1.5">
              Günlük Görev
            </Text>
            <Text className="text-[11px] font-extrabold text-accent-blue ml-auto">+15 XP</Text>
          </View>

          <Text className="text-base font-black text-light-text dark:text-dark-text">{quest.title}</Text>
          <Text className="text-xs text-light-value dark:text-dark-value mt-1 leading-5">{quest.detail}</Text>

          {questDone ? (
            <View className="flex-row items-center mt-3">
              <CheckCircle2 size={16} color="#30E0A1" strokeWidth={2.5} />
              <Text className="text-sm font-extrabold text-accent-green ml-1.5">Tamamlandı</Text>
            </View>
          ) : quest.auto ? (
            <Text className="text-[11px] font-semibold text-light-subtext dark:text-dark-subtext mt-3">
              Bugün kilonu kaydedince otomatik tamamlanır.
            </Text>
          ) : (
            <Button title="Tamamla" onPress={handleCompleteQuest} className="mt-3 h-11" />
          )}
        </Card>
      </Animated.View>

      {/* Seri */}
      <Animated.View entering={FadeInDown.duration(450).delay(240)} className="mt-4">
        <Card className="flex-row items-center py-4">
          <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: "#FF8C421A" }}>
            <Flame size={20} color="#FF8C42" fill="#FF8C42" strokeWidth={0} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext">
              Seri
            </Text>
            <View className="flex-row items-baseline mt-0.5">
              <Text className="text-xl leading-6 font-black text-light-text dark:text-dark-text">
                {state.streakCount}
              </Text>
              <Text className="text-xs font-bold text-light-subtext dark:text-dark-subtext ml-1">gün</Text>
            </View>
          </View>
          <Text className="text-[11px] font-semibold text-light-subtext dark:text-dark-subtext text-right max-w-[45%]">
            {phase === "active"
              ? "Her gün tartılarak seriyi sürdür."
              : phase === "frozen"
              ? "30 gün ilerleme yok — XP duruldu, rütben korunuyor."
              : "45 gün ara — yeni ilerleme 2× RP getirecek."}
          </Text>
        </Card>
      </Animated.View>

      {/* Rütbe tablosu (mini referans) */}
      <Animated.View entering={FadeInDown.duration(450).delay(300)} className="mt-4">
        <Card>
          <Text className="text-xs font-bold uppercase tracking-wider text-light-subtext dark:text-dark-subtext mb-3">
            Rütbe Tablosu
          </Text>
          <View className="gap-2">
            {RANK_TABLE.map((r) => {
              const isCurrent = !rank.maintenance && r.key === rank.key;
              const c = RANK_ACCENT[r.key];
              return (
                <View
                  key={r.key}
                  className="flex-row items-center px-3 py-2 rounded-xl"
                  style={{
                    backgroundColor: isCurrent ? c + "1A" : "transparent",
                    borderWidth: 1,
                    borderColor: isCurrent ? c + "55" : "transparent",
                  }}
                >
                  <Text className="text-sm font-black w-6" style={{ color: c }}>
                    {r.key}
                  </Text>
                  <Text className="text-sm font-bold text-light-text dark:text-dark-text flex-1">{r.name}</Text>
                  <Text className="text-[11px] font-semibold text-light-subtext dark:text-dark-subtext">
                    {r.xpReq} XP{r.rpReq > 0 ? ` · ${r.rpReq} RP` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}
