import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Text, Platform } from 'react-native';
import { CartesianChart, Line, Area } from 'victory-native';
import { LinearGradient, vec, useFont } from '@shopify/react-native-skia';
import { WeightEntry, calculateMovingAverage } from '../utils/helpers';
import dayjs from 'dayjs';
import { useTheme } from '../utils/ThemeContext';
import Animated, { useSharedValue, withTiming, Easing } from 'react-native-reanimated';

interface AnimatedChartProps {
  data: WeightEntry[];
  targetWeight?: number;
}

export function AnimatedChart({ data, targetWeight }: AnimatedChartProps) {
  const { isDark } = useTheme();
  
  if (Platform.OS === 'web') {
    return (
      <View className="h-64 items-center justify-center p-4">
        <Text className="text-light-subtext dark:text-dark-subtext text-center">
          Grafik çizimleri yüksek performanslı Skia motorunu kullandığı için Web ortamında tam desteklenmeyebilir. Lütfen grafiği mobil cihazınızda veya emülatörde görüntüleyin.
        </Text>
      </View>
    );
  }

  // Need to process data for the chart: calculate rolling average
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const movingAverages = calculateMovingAverage(data, 7);
    return data.map((entry, index) => ({
      x: dayjs(entry.date).valueOf(),
      weight: entry.weight,
      average: movingAverages[index],
      target: targetWeight || null,
    }));
  }, [data, targetWeight]);

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, {
      duration: 1500,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [data]);

  const colors = {
    line: '#00F0FF',
    areaTop: isDark ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 240, 255, 0.2)',
    areaBottom: isDark ? 'rgba(0, 240, 255, 0)' : 'rgba(0, 240, 255, 0)',
    grid: isDark ? '#232335' : '#E9ECEF',
    label: isDark ? '#9A9AB0' : '#6C757D',
    targetLine: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
    averageLine: '#BF55EC',
  };

  if (chartData.length === 0) {
    return (
      <View className="h-64 items-center justify-center">
        <Text className="text-light-subtext dark:text-dark-subtext">Henüz yeterli veri yok.</Text>
      </View>
    );
  }

  // Find min/max for proper scaling
  const minWeight = Math.min(...chartData.map((d) => d.weight)) - 2;
  const maxWeight = Math.max(...chartData.map((d) => d.weight)) + 2;
  const yDomain = [
    targetWeight ? Math.min(minWeight, targetWeight - 2) : minWeight,
    targetWeight ? Math.max(maxWeight, targetWeight + 2) : maxWeight,
  ] as [number, number];

  return (
    <View className="h-64 w-full">
      <CartesianChart
        data={chartData}
        xKey="x"
        yKeys={['weight', 'target', 'average']}
        domain={{ y: yDomain }}
        domainPadding={{ top: 20, bottom: 20, left: 10, right: 10 }}
        axisOptions={{
          tickCount: { x: 5, y: 5 },
          font: null, // Since we don't have a custom font file, fallback to default rendering without font
          lineColor: colors.grid,
          labelColor: colors.label,
          formatXLabel: (value) => dayjs(value).format('DD MMM'),
          formatYLabel: (value) => `${value}kg`,
        }}
      >
        {({ points, chartBounds }) => (
          <>
            {/* Target Line */}
            {points.target && targetWeight && (
              <Line
                points={points.target}
                color={colors.targetLine}
                strokeWidth={2}
                style="stroke"
                strokeDasharray={[5, 5]}
              />
            )}
            
            {/* Moving Average Line */}
            {points.average && (
              <Line
                points={points.average}
                color={colors.averageLine}
                strokeWidth={2}
                animate={{ type: 'timing', duration: 1500 }}
              />
            )}

            {/* Main Weight Area */}
            <Area
              points={points.weight}
              y0={chartBounds.bottom}
              animate={{ type: 'timing', duration: 1500 }}
            >
              <LinearGradient
                start={vec(0, chartBounds.top)}
                end={vec(0, chartBounds.bottom)}
                colors={[colors.areaTop, colors.areaBottom]}
              />
            </Area>
            
            {/* Main Weight Line */}
            <Line
              points={points.weight}
              color={colors.line}
              strokeWidth={3}
              animate={{ type: 'timing', duration: 1500 }}
            />
          </>
        )}
      </CartesianChart>
    </View>
  );
}
