import React, { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Path, Ellipse, G, Defs, LinearGradient, Stop, Line } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from "react-native-reanimated";
import { getBMICategory } from "../utils/helpers";

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedEllipse = Animated.createAnimatedComponent(Ellipse);

interface MorphingSilhouetteProps {
  bmi: number;
  heightCm: number;
}

export function MorphingSilhouette({ bmi, heightCm }: MorphingSilhouetteProps) {
  const BASELINE_BMI = 22.0;
  const BASELINE_HEIGHT = 175;

  const activeBmi = bmi > 0 ? bmi : BASELINE_BMI;
  const activeHeight = heightCm > 0 ? heightCm : BASELINE_HEIGHT;

  const targetScaleX = Math.max(0.6, Math.min(1.8, activeBmi / BASELINE_BMI));
  const targetScaleY = Math.max(0.8, Math.min(1.2, activeHeight / BASELINE_HEIGHT));
  const targetHeadScaleX = 1 + (targetScaleX - 1) * 0.2;

  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const headScaleX = useSharedValue(1);

  useEffect(() => {
    scaleX.value = withSpring(targetScaleX, { damping: 15, stiffness: 90 });
    scaleY.value = withSpring(targetScaleY, { damping: 15, stiffness: 90 });
    headScaleX.value = withSpring(targetHeadScaleX, { damping: 15, stiffness: 90 });
  }, [targetScaleX, targetScaleY, targetHeadScaleX]);

  const bmiInfo = getBMICategory(bmi);
  const activeColor = bmi > 0 ? bmiInfo.color : "#00F0FF";

  const gAnimatedProps = useAnimatedProps(() => {
    return {
      transform: `translate(0, 150) scale(1, ${scaleY.value}) translate(0, -150)`,
    };
  });

  const pathAnimatedProps = useAnimatedProps(() => {
    return {
      transform: `translate(100, 0) scale(${scaleX.value}, 1) translate(-100, 0)`,
    };
  });

  const ellipseAnimatedProps = useAnimatedProps(() => {
    return {
      rx: 14 * headScaleX.value,
    };
  });

  return (
    <View className="items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-3xl p-6 relative overflow-hidden">
      <View className="absolute top-4 left-4 z-10">
        <Text className="text-[10px] font-bold tracking-widest text-light-subtext dark:text-dark-subtext uppercase">
          Vücut Analizi
        </Text>
      </View>

      <View className="absolute inset-0 items-center justify-center opacity-30">
        <Svg width="100%" height="280" viewBox="0 0 200 300">
          <Line x1="10" y1="50" x2="190" y2="50" stroke="#4C4C66" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="10" y1="100" x2="190" y2="100" stroke="#4C4C66" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="10" y1="150" x2="190" y2="150" stroke="#4C4C66" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="10" y1="200" x2="190" y2="200" stroke="#4C4C66" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="10" y1="250" x2="190" y2="250" stroke="#4C4C66" strokeWidth="1" strokeDasharray="3,3" />
          <Line x1="100" y1="20" x2="100" y2="280" stroke="#4C4C66" strokeWidth="0.5" />
        </Svg>
      </View>

      <Svg width="200" height="280" viewBox="0 0 200 300" className="z-10">
        <Defs>
          <LinearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#BF55EC" stopOpacity="0.95" />
            <Stop offset="60%" stopColor={activeColor} stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#00F0FF" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>

        <AnimatedG animatedProps={gAnimatedProps}>
          <AnimatedEllipse
            cx="100"
            cy="42"
            ry="14"
            fill="url(#bodyGradient)"
            animatedProps={ellipseAnimatedProps}
          />
          <AnimatedPath
            d="M92,68 C80,72 65,77 55,92 L42,165 C38,175 48,182 54,175 L66,160 L74,115 C76,140 76,170 74,200 L68,275 C66,285 80,288 84,275 L94,205 L106,205 L116,275 C120,288 134,285 132,275 L126,200 C124,170 124,140 126,115 L134,160 L146,175 C152,182 162,175 158,165 L145,92 C135,77 120,72 108,68 Z"
            fill="url(#bodyGradient)"
            animatedProps={pathAnimatedProps}
          />
        </AnimatedG>
      </Svg>

      <View className="flex-row justify-between items-center w-full mt-4 border-t border-light-border dark:border-dark-border pt-3 z-10">
        <View>
          <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-wider font-semibold">
            Genişlik Faktörü
          </Text>
          <Text className="text-sm font-black text-light-text dark:text-white mt-0.5">
            {targetScaleX.toFixed(2)}x <Text className="text-xs font-normal text-light-subtext dark:text-dark-subtext">({bmi > 0 ? "VKİ" : "Hedef"})</Text>
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-[10px] text-light-subtext dark:text-dark-subtext uppercase tracking-wider font-semibold">
            Yükseklik Faktörü
          </Text>
          <Text className="text-sm font-black text-light-text dark:text-white mt-0.5">
            {targetScaleY.toFixed(2)}x <Text className="text-xs font-normal text-light-subtext dark:text-dark-subtext">({activeHeight} cm)</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
