import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle2 } from 'lucide-react-native';

interface SuccessTickProps {
  onComplete?: () => void;
  visible: boolean;
  /** Güncel kayıt serisi (gün). >0 ise tik üstünde seri rozeti gösterilir. */
  streak?: number;
}

export function SuccessTick({ onComplete, visible, streak = 0 }: SuccessTickProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const fireScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      opacity.value = 1;
      scale.value = withSequence(
        withSpring(1.2, { damping: 12, stiffness: 100 }),
        withSpring(1, { damping: 10, stiffness: 120 }),
        withDelay(
          1000,
          withTiming(0, { duration: 300 }, () => {
            opacity.value = 0;
            if (onComplete) {
              runOnJS(onComplete)();
            }
          })
        )
      );

      // Kısa, dikkat dağıtmayan alev nabzı (iki hafif puls)
      fireScale.value = withSequence(
        withTiming(1.35, { duration: 170 }),
        withTiming(1, { duration: 170 }),
        withDelay(110, withTiming(1.2, { duration: 140 })),
        withTiming(1, { duration: 140 })
      );
    }
  }, [visible, onComplete, scale, opacity, fireScale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const fireStyle = useAnimatedStyle(() => {
    return { transform: [{ scale: fireScale.value }] };
  });

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.container, animatedStyle]}>
      {streak > 0 ? (
        <View style={styles.badge}>
          <Animated.Text style={[styles.fire, fireStyle]}>🔥</Animated.Text>
          <Text style={styles.badgeText}>{streak} Gün</Text>
        </View>
      ) : null}

      <CheckCircle2 size={80} color="#00FF87" strokeWidth={2.5} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,26,0.96)',
    borderColor: 'rgba(255,140,66,0.55)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 18,
  },
  fire: {
    fontSize: 20,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
