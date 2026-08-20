import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
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
 * A quick-action tile that scales down slightly on press and springs back —
 * the kind of small confirming touch feedback the design brief asked for
 * throughout onboarding, applied here too. Pressable (not raw touch events)
 * so this still cancels correctly if the press turns into a scroll gesture
 * on the dashboard's ScrollView.
 */
const QuickActionTile: React.FC<{ action: QuickAction; nav: Nav }> = React.memo(({ action, nav }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={() => action.onPress(nav)}
      onPressIn={() => {
        scale.value = withTiming(0.92, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      style={{ width: '25%', alignItems: 'center', marginBottom: theme.spacing.md }}
    >
      <Animated.View style={[{ alignItems: 'center' }, animatedStyle]}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: theme.radius.lg,
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.14)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <AppIcon name={action.icon} size={22} color="#5FBFAE" />
        </View>
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

  const renderAction = useCallback((action: QuickAction) => <QuickActionTile key={action.key} action={action} nav={navigation} />, [navigation]);

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
