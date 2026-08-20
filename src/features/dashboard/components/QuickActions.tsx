import React, { useCallback, useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence } from 'react-native-reanimated';
import { MainTabParamList, HomeStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';

type Nav = CompositeNavigationProp<BottomTabNavigationProp<MainTabParamList>, NativeStackNavigationProp<HomeStackParamList>>;

interface QuickAction {
  key: string;
  icon: AppIconName;
  label: string;
  onPress: (nav: Nav) => void;
}

const ACTIONS: QuickAction[] = [
  { key: 'start_fast', icon: 'timer-outline', label: 'Start Fasting', onPress: (nav) => nav.navigate('FastingTab', { screen: 'SelectFastingMethod' }) },
  { key: 'add_food', icon: 'restaurant-outline', label: 'Add Food', onPress: (nav) => nav.navigate('NutritionTab', { screen: 'FoodSearch', params: { mealType: 'snack' } }) },
  { key: 'scan_barcode', icon: 'barcode-outline', label: 'Scan Barcode', onPress: (nav) => nav.navigate('NutritionTab', { screen: 'BarcodeScanner' }) },
  { key: 'photo_meal', icon: 'camera-outline', label: 'Photo Meal', onPress: (nav) => nav.navigate('NutritionTab', { screen: 'AiPhotoEntry' }) },
  { key: 'start_activity', icon: 'walk-outline', label: 'Start Activity', onPress: (nav) => nav.navigate('ActivityTab', { screen: 'SelectActivity' }) },
  { key: 'enter_weight', icon: 'scale-outline', label: 'Enter Weight', onPress: (nav) => nav.navigate('HomeTab', { screen: 'EnterWeight' }) },
  { key: 'start_meditation', icon: 'leaf-outline', label: 'Meditate', onPress: (nav) => nav.navigate('MeditationTab', { screen: 'MeditationHome' }) },
  { key: 'statistics', icon: 'stats-chart-outline', label: 'Statistics', onPress: (nav) => nav.navigate('StatisticsTab', { screen: 'StatisticsHome' }) },
];

/**
 * A quick-action tile that fades/scales in on mount (staggered per tile),
 * scales down slightly on press, and — for the two tiles most tied to a
 * "mode" elsewhere in the app (Fasting, Meditate) — carries a very subtle
 * continuous idle motion on just the icon: a slow clock-like tick for
 * fasting, a slow breathing pulse for meditation. The other six stay still
 * at idle so the grid doesn't read as busy. Pressable (not raw touch
 * events) so press feedback still cancels correctly if the press turns
 * into a scroll gesture on the dashboard's ScrollView.
 */
const QuickActionTile: React.FC<{ action: QuickAction; nav: Nav; index: number }> = React.memo(({ action, nav, index }) => {
  const { theme } = useTheme();
  const pressScale = useSharedValue(1);
  const entrance = useSharedValue(0);
  const idle = useSharedValue(0);
  const hasIdleMotion = action.key === 'start_fast' || action.key === 'start_meditation';

  useEffect(() => {
    entrance.value = withDelay(index * motion.staggerStepMs, withTiming(1, { duration: motion.duration.slow, easing: motion.easing.decelerate }));
  }, [entrance, index]);

  useEffect(() => {
    if (!hasIdleMotion) return;
    idle.value = withDelay(
      600 + index * motion.staggerStepMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: motion.duration.ambient, easing: motion.easing.standard }),
          withTiming(0, { duration: motion.duration.ambient, easing: motion.easing.standard })
        ),
        -1,
        true
      )
    );
  }, [hasIdleMotion, idle, index]);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ scale: 0.9 + entrance.value * 0.1 }, { scale: pressScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => {
    if (action.key === 'start_meditation') {
      return { transform: [{ scale: 1 + idle.value * 0.08 }] };
    }
    if (action.key === 'start_fast') {
      return { transform: [{ rotate: `${(idle.value - 0.5) * 14}deg` }] };
    }
    return {};
  });

  return (
    <Pressable
      onPress={() => action.onPress(nav)}
      onPressIn={() => {
        pressScale.value = withTiming(0.92, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        pressScale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={{ width: '25%', alignItems: 'center', marginBottom: theme.spacing.md }}
    >
      <Animated.View style={[{ alignItems: 'center' }, containerAnimatedStyle]}>
        <Animated.View
          style={[
            {
              width: 52,
              height: 52,
              borderRadius: theme.radius.lg,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.14)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            },
            iconAnimatedStyle,
          ]}
        >
          <AppIcon name={action.icon} size={22} color="#5FBFAE" />
        </Animated.View>
        <AppText variant="caption" color="rgba(255,255,255,0.8)" align="center">
          {action.label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
});
QuickActionTile.displayName = 'QuickActionTile';

export const QuickActions: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const renderAction = useCallback(
    (action: QuickAction, index: number) => <QuickActionTile key={action.key} action={action} nav={navigation} index={index} />,
    [navigation]
  );

  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.sm }}>
        Quick actions
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{ACTIONS.map(renderAction)}</View>
    </View>
  );
});

QuickActions.displayName = 'QuickActions';
