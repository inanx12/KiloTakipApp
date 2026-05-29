import React from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import dayjs from "dayjs";

import { WeightEntry, calculateMovingAverage } from "../utils/helpers";
import { useTheme } from "../utils/ThemeContext";

interface AnimatedChartProps {
  data: WeightEntry[];
  targetWeight?: number;
}

/**
 * react-native-svg tabanlı (gifted-charts) kilo grafiği.
 * Hem mobilde hem de web'de (npx expo start --web) çalışır; Skia/CanvasKit gerektirmez.
 *  - Yumuşak (bezier) ana çizgi + altında gradyan dolgu
 *  - Mor 7 günlük hareketli ortalama çizgisi
 *  - Kesikli hedef çizgisi
 *  - Soluk yatay gridlinelar, küçük gri eksen yazıları
 */
export function AnimatedChart({ data, targetWeight }: AnimatedChartProps) {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();

  const colors = {
    line: "#00F0FF",
    average: "#BF55EC",
    target: isDark ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.28)",
    axisText: isDark ? "#6C6C85" : "#9AA0A6",
    rules: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
  };

  if (!data || data.length === 0) {
    return (
      <View className="h-56 w-full items-center justify-center">
        <Text className="text-light-subtext dark:text-dark-subtext text-sm font-semibold">
          Henüz yeterli veri yok.
        </Text>
      </View>
    );
  }

  const averages = calculateMovingAverage(data, 7);

  // Y ekseni ölçeklemesi: değer aralığına göre dinamik taban/tavan
  const allValues = [
    ...data.map((d) => d.weight),
    ...averages,
    ...(targetWeight ? [targetWeight] : []),
  ];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const pad = Math.max(1, (maxV - minV) * 0.2);
  const floor = Math.floor(minV - pad);
  const ceil = Math.ceil(maxV + pad);
  const range = Math.max(1, ceil - floor);
  const noOfSections = 4;

  // Etiket kalabalığını azalt: en fazla ~6 tarih göster
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));
  const mainData = data.map((e, i) => ({
    value: e.weight,
    label:
      i % labelEvery === 0 || i === data.length - 1
        ? dayjs(e.date).format("DD/MM")
        : "",
  }));
  const avgData = averages.map((v) => ({ value: v }));

  // Genişlik hesabı (ekran kenarı + kart iç boşluğu + y ekseni etiket alanı)
  const screenPadding = 48;
  const cardPadding = 32;
  const yAxisLabelWidth = 34;
  const available = Math.max(
    220,
    Math.min(width, 600) - screenPadding - cardPadding - yAxisLabelWidth
  );
  const initialSpacing = 14;
  const endSpacing = 14;
  const spacing =
    data.length > 1
      ? (available - initialSpacing - endSpacing) / (data.length - 1)
      : available;

  return (
    <View className="w-full">
      <LineChart
        data={mainData}
        data2={avgData.length > 1 ? avgData : undefined}
        height={210}
        width={available}
        adjustToWidth
        initialSpacing={initialSpacing}
        endSpacing={endSpacing}
        spacing={spacing}
        // Yumuşak bezier ana çizgi
        curved
        color1={colors.line}
        thickness1={3}
        // Ana çizgi altında gradyan dolgu (yalnızca 1. çizgi)
        areaChart1
        startFillColor1={colors.line}
        endFillColor1={colors.line}
        startOpacity1={0.32}
        endOpacity1={0.02}
        // 7 günlük hareketli ortalama (mor)
        color2={colors.average}
        thickness2={2}
        hideDataPoints
        // Y ekseni
        yAxisOffset={floor}
        maxValue={range}
        noOfSections={noOfSections}
        yAxisColor="transparent"
        xAxisColor={colors.rules}
        rulesType="solid"
        rulesColor={colors.rules}
        yAxisTextStyle={{ color: colors.axisText, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.axisText, fontSize: 9 }}
        yAxisLabelWidth={yAxisLabelWidth}
        yAxisLabelSuffix=""
        // Kesikli hedef çizgisi
        showReferenceLine1={!!targetWeight}
        referenceLine1Position={targetWeight ? targetWeight - floor : 0}
        referenceLine1Config={{
          color: colors.target,
          dashWidth: 6,
          dashGap: 5,
          thickness: 1.5,
        }}
        // Animasyon: çizgi soldan dolar
        isAnimated
        animationDuration={1200}
        animateOnDataChange
        onDataChangeAnimationDuration={500}
        disableScroll
      />

      <View className="flex-row items-center justify-center mt-3 gap-4">
        <View className="flex-row items-center">
          <View className="w-3 h-[3px] rounded-full mr-1.5" style={{ backgroundColor: colors.line }} />
          <Text className="text-[10px] font-bold text-light-subtext dark:text-dark-subtext">Kilo</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-[3px] rounded-full mr-1.5" style={{ backgroundColor: colors.average }} />
          <Text className="text-[10px] font-bold text-light-subtext dark:text-dark-subtext">7 Günlük Ort.</Text>
        </View>
        {!!targetWeight && (
          <View className="flex-row items-center">
            <View className="w-3 h-[2px] rounded-full mr-1.5" style={{ backgroundColor: colors.target }} />
            <Text className="text-[10px] font-bold text-light-subtext dark:text-dark-subtext">Hedef</Text>
          </View>
        )}
      </View>
    </View>
  );
}
