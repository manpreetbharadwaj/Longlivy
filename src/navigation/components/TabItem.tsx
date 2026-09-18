import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { AppIcon, AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { AppText } from '@/components/common/AppText';
import { motion } from '@/theme/motion';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

interface TabItemProps {
  icon: AppIconName | MaterialCommunityIconName;
  activeIcon: AppIconName | MaterialCommunityIconName;
  iconFamily?: 'ionicons' | 'material-community';
  label: string;
  focused: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

/**
 * A single tab — icon plus a small label underneath, with a soft rounded
 * "bubble" behind the icon on the selected tab (the icon rising slightly
 * and tinting the app's muted steel accent) so the selected state stays
 * unmistakable even with a label now doing double duty on identification.
 * Every press gets a small scale-down regardless of whether it changes the
 * selection.
 */
export const TabItem: React.FC<TabItemProps> = React.memo(({ icon, activeIcon, iconFamily, label, focused, onPress, accessibilityLabel }) => {
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
    transform: [{ translateY: -focusProgress.value * 2 }, { scale: pressScale.value }],
  }));

  const color = focused ? dashboardColors.accent : dashboardColors.iconInactive;

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
          { position: 'absolute', top: 4, width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(34,211,238,0.16)' },
          bubbleStyle,
        ]}
      />
      <Animated.View style={[{ alignItems: 'center', maxWidth: '100%' }, iconWrapStyle]}>
        <AppIcon name={focused ? activeIcon : icon} family={iconFamily} size={20} color={color} />
        <AppText
          variant="caption"
          color={color}
          weight={focused ? '700' : '500'}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={{ marginTop: 3, fontSize: 10, lineHeight: 12 }}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
});
TabItem.displayName = 'TabItem';
