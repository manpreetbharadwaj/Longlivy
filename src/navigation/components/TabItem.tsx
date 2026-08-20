import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { motion } from '@/theme/motion';

interface TabItemProps {
  icon: AppIconName;
  activeIcon: AppIconName;
  focused: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * A single icon-only tab — labels are dropped in favor of a clear selected
 * state (a soft rounded "bubble" behind the icon, the icon rising slightly
 * and tinting teal) since six tabs plus a center action leaves too little
 * width per item for comfortable label text without cramming. Every press
 * gets a small scale-down regardless of whether it changes the selection.
 */
export const TabItem: React.FC<TabItemProps> = React.memo(({ icon, activeIcon, focused, onPress, accessibilityLabel }) => {
  const pressScale = useSharedValue(1);
  const focusProgress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focusProgress.value = withSpring(focused ? 1 : 0, { damping: 14, stiffness: 180 });
  }, [focused, focusProgress]);

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: focusProgress.value,
    transform: [{ scale: 0.6 + focusProgress.value * 0.4 }],
  }));
  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -focusProgress.value * 3 }, { scale: pressScale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        pressScale.value = withTiming(0.86, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: focused }}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' }}
    >
      <Animated.View
        style={[
          { position: 'absolute', width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(95,191,174,0.22)' },
          bubbleStyle,
        ]}
      />
      <Animated.View style={iconWrapStyle}>
        <AppIcon name={focused ? activeIcon : icon} size={22} color={focused ? '#5FBFAE' : 'rgba(255,255,255,0.5)'} />
      </Animated.View>
    </Pressable>
  );
});
TabItem.displayName = 'TabItem';
