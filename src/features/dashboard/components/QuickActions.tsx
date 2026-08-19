import React, { useCallback, useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MainTabParamList, HomeStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';

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

export const QuickActions: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();

  const renderAction = useCallback(
    (action: QuickAction) => (
      <Pressable
        key={action.key}
        onPress={() => action.onPress(navigation)}
        accessibilityRole="button"
        accessibilityLabel={action.label}
        style={{ width: '25%', alignItems: 'center', marginBottom: theme.spacing.md }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <AppIcon name={action.icon} size={22} color={theme.colors.primary} />
        </View>
        <AppText variant="caption" align="center">
          {action.label}
        </AppText>
      </Pressable>
    ),
    [navigation, theme]
  );

  const rows = useMemo(() => ACTIONS, []);

  return (
    <View style={{ marginBottom: theme.spacing.sm }}>
      <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.sm }}>
        Quick actions
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{rows.map(renderAction)}</View>
    </View>
  );
});

QuickActions.displayName = 'QuickActions';
