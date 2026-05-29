import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
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
}

export function SuccessTick({ onComplete, visible }: SuccessTickProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

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
    }
  }, [visible, onComplete, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (!visible && opacity.value === 0) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
});
