import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import dayjs from 'dayjs';
import { WeightEntry, calculateMovingAverage } from '../utils/helpers';
import { useTheme } from '../utils/ThemeContext';

interface AnimatedChartProps {
  data: WeightEntry[];
  targetWeight?: number;
}

/**
 * Web + mobil uyumlu çizgi grafik (react-native-svg tabanlı gifted-charts).
 * - Yumuşak bezier kilo çizgisi + altında gradyan dolgu
 * - Mor 7 günlük hareketli ortalama
 * - Kesikli hedef çizgisi
 * - Soluk grid, küçük gri eksen yazıları
 */
export function AnimatedChart({ data, targetWeight }: AnimatedChartProps) {
  const { isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const colors = {
    line: '#00F0FF',
    average: '#BF55EC',
    areaTop: '#00F0FF',
    rules: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    label: isDark ? '#6C6C85' : '#9AA0A6',
    axis: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
    target: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)',
  };

  if (!data || data.length === 0) {
    return (
      <View className="h-64 w-full items-center justify-center">
        <Text className="text-light-subtext dark:text-dark-subtext text-sm font-semibold">
          Henüz yeterli veri yok.
        </Text>
        <Text className="text-light-subtext dark:text-dark-subtext text-xs mt-1 opacity-70">
          Grafiğin oluşması için kilo kaydı ekleyin.
        </Text>
      </View>
    );
  }

  const movingAverages = calculateMovingAverage(data, 7);
  const n = data.length;

  // Etiketleri seyrekleştir (kalabalık olmasın): en fazla ~6 etiket
  const labelEvery = Math.max(1, Math.ceil(n / 6));

  const weightData = data.map((entry, index) => ({
    value: entry.weight,
    label:
      index % labelEvery === 0 || index === n - 1
        ? dayjs(entry.date).format('DD/MM')
        : undefined,
  }));

  const averageData = movingAverages.map((v) => ({ value: v }));

  // Y ekseni ölçeği — hedef çizgisini de kapsa
  const weights = data.map((d) => d.weight);
  let minW = Math.min(...weights);
  let maxW = Math.max(...weights);
  if (targetWeight) {
    minW = Math.min(minW, targetWeight);
    maxW = Math.max(maxW, targetWeight);
  }
  const pad = Math.max(1, (maxW - minW) * 0.15);
  const yOffset = Math.floor(minW - pad);
  const yTop = Math.ceil(maxW + pad);
  const span = Math.max(1, yTop - yOffset);
  const noOfSections = 4;

  // Genişlik hesabı (kart içi padding + y ekseni payı çıkarılır)
  const chartWidth = Math.max(220, Math.min(screenWidth, 560) - 96);
  const spacing =
    n > 1 ? Math.max(28, chartWidth / (n - 1)) : chartWidth / 2;

  return (
    <View className="w-full" style={{ paddingTop: 8, paddingBottom: 4 }}>
      <LineChart
        data={weightData}
        data2={averageData}
        width={chartWidth}
        height={210}
        adjustToWidth
        // Kilo çizgisi
        color1={colors.line}
        thickness1={3}
        curved
        areaChart
        startFillColor1={colors.areaTop}
        endFillColor1={colors.areaTop}
        startOpacity={0.28}
        endOpacity={0.01}
        // 7 günlük ortalama
        color2={colors.average}
        thickness2={2}
        // Noktalar
        hideDataPoints1={n > 12}
        dataPointsColor1={colors.line}
        dataPointsRadius1={3}
        hideDataPoints2
        // Eksen / grid
        yAxisOffset={yOffset}
        maxValue={span}
        noOfSections={noOfSections}
        rulesColor={colors.rules}
        rulesType="solid"
        yAxisColor="transparent"
        xAxisColor={colors.axis}
        yAxisTextStyle={{ color: colors.label, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: colors.label, fontSize: 9 }}
        yAxisTextNumberOfLines={1}
        formatYLabel={(val: string) => `${Math.round(Number(val))}`}
        spacing={spacing}
        initialSpacing={12}
        endSpacing={12}
        // Hedef çizgisi (kesikli)
        showReferenceLine1={!!targetWeight}
        referenceLine1Position={targetWeight || 0}
        referenceLine1Config={{
          color: colors.target,
          dashWidth: 5,
          dashGap: 5,
          thickness: 1.5,
          labelText: targetWeight ? `Hedef ${targetWeight}` : '',
          labelTextStyle: { color: colors.label, fontSize: 9 },
        }}
        // Animasyon: soldan dolma
        isAnimated
        animateOnDataChange
        animationDuration={900}
        onDataChangeAnimationDuration={600}
      />

      {/* Açıklama (legend) */}
      <View className="flex-row items-center justify-center mt-3 gap-4">
        <View className="flex-row items-center">
          <View className="w-3 h-[3px] rounded-full mr-1.5" style={{ backgroundColor: colors.line }} />
          <Text className="text-[10px] font-bold" style={{ color: colors.label }}>Kilo</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-[3px] rounded-full mr-1.5" style={{ backgroundColor: colors.average }} />
          <Text className="text-[10px] font-bold" style={{ color: colors.label }}>7 Gün Ort.</Text>
        </View>
        {targetWeight ? (
          <View className="flex-row items-center">
            <View className="w-3 h-[2px] rounded-full mr-1.5" style={{ backgroundColor: colors.target }} />
            <Text className="text-[10px] font-bold" style={{ color: colors.label }}>Hedef</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
