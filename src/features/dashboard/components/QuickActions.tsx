import React, { useCallback, useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withRepeat, withSequence } from 'react-native-reanimated';
import { MainTabParamList, HomeStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { dashboardColors, dashboardCardStyle } from '../dashboardTheme';

type Nav = CompositeNavigationProp<BottomTabNavigationProp<MainTabParamList>, NativeStackNavigationProp<HomeStackParamList>>;

interface QuickAction {
  key: string;
  icon: AppIconName;
  label: string;
  onPress: (nav: Nav) => void;
}

// Add Food, Scan, Start Fast, Activity are the four primary actions shown
// up front (matches the reference layout); the remaining four stay exactly
// as functional as before, just tucked behind "View all actions" instead
// of always-visible — no action, handler, or navigation target is removed.
const ACTIONS: QuickAction[] = [
  { key: 'add_food', icon: 'add-outline', label: 'Add Food', onPress: (nav) => nav.navigate('NutritionTab', { screen: 'FoodSearch', params: { mealType: 'snack' } }) },
  { key: 'scan_barcode', icon: 'scan-outline', label: 'Scan', onPress: (nav) => nav.navigate('NutritionTab', { screen: 'BarcodeScanner' }) },
  { key: 'start_fast', icon: 'timer-outline', label: 'Start Fast', onPress: (nav) => nav.navigate('FastingTab', { screen: 'SelectFastingMethod' }) },
  { key: 'start_activity', icon: 'walk-outline', label: 'Activity', onPress: (nav) => nav.navigate('ActivityTab', { screen: 'SelectActivity' }) },
  { key: 'photo_meal', icon: 'camera-outline', label: 'Photo Meal', onPress: (nav) => nav.navigate('NutritionTab', { screen: 'AiPhotoEntry' }) },
  { key: 'enter_weight', icon: 'scale-outline', label: 'Enter Weight', onPress: (nav) => nav.navigate('HomeTab', { screen: 'EnterWeight' }) },
  { key: 'start_meditation', icon: 'leaf-outline', label: 'Meditate', onPress: (nav) => nav.navigate('MeditationTab', { screen: 'MeditationHome' }) },
  { key: 'statistics', icon: 'stats-chart-outline', label: 'Statistics', onPress: (nav) => nav.navigate('StatisticsTab', { screen: 'StatisticsHome' }) },
];
const PRIMARY_COUNT = 4;

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
    <Animated.View style={[{ width: '25%', alignItems: 'center' }, containerAnimatedStyle]}>
      <Pressable
        onPress={() => action.onPress(nav)}
        onPressIn={() => {
          pressScale.value = withTiming(0.94, { duration: motion.duration.fast });
        }}
        onPressOut={() => {
          pressScale.value = withTiming(1, { duration: motion.duration.fast });
        }}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={[
          dashboardCardStyle,
          {
            width: '92%',
            aspectRatio: 1,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 4,
          },
        ]}
      >
        <Animated.View
          style={[
            {
              width: 34,
              height: 34,
              borderRadius: 17,
              borderWidth: 1,
              borderColor: dashboardColors.borderStrong,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 6,
            },
            iconAnimatedStyle,
          ]}
        >
          <AppIcon name={action.icon} size={17} color={dashboardColors.accent} />
        </Animated.View>
        <AppText variant="caption" color={dashboardColors.textSecondary} align="center" numberOfLines={1}>
          {action.label}
        </AppText>
      </Pressable>
    </Animated.View>
  );
});
QuickActionTile.displayName = 'QuickActionTile';

export const QuickActions: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const [expanded, setExpanded] = useState(false);
  const chevronRotate = useSharedValue(0);

  const renderAction = useCallback(
    (action: QuickAction, index: number) => <QuickActionTile key={action.key} action={action} nav={navigation} index={index} />,
    [navigation]
  );

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => {
      chevronRotate.value = withTiming(prev ? 0 : 1, { duration: motion.duration.fast });
      return !prev;
    });
  }, [chevronRotate]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotate.value * 180}deg` }],
  }));

  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginBottom: theme.spacing.sm }}>
        Quick actions
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{ACTIONS.slice(0, PRIMARY_COUNT).map(renderAction)}</View>

      {expanded ? (
        <FadeSlideIn fromY={6} style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
          {ACTIONS.slice(PRIMARY_COUNT).map(renderAction)}
        </FadeSlideIn>
      ) : null}

      <Pressable
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Hide more actions' : 'View all actions'}
        style={[
          dashboardCardStyle,
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: theme.spacing.sm,
            paddingVertical: 10,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText variant="bodySmall" color={dashboardColors.accent} weight="600">
          {expanded ? 'Show less' : 'View all actions'}
        </AppText>
        <Animated.View style={[{ marginLeft: 4 }, chevronStyle]}>
          <AppIcon name="chevron-down" size={14} color={dashboardColors.accent} />
        </Animated.View>
      </Pressable>
    </View>
  );
});

QuickActions.displayName = 'QuickActions';
