import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectActiveActivity, selectTodayActivityCalories } from '@/features/activity/selectors';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';

export const ActivityCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const active = useAppSelector(selectActiveActivity);
  const todayCalories = useAppSelector(selectTodayActivityCalories);

  return (
    <AppCard onPress={() => navigation.navigate('ActivityTab', { screen: 'ActivityHome' })} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIconTile name="walk" color={theme.colors.activity} size={40} iconSize={20} style={{ marginRight: theme.spacing.sm }} />
          <View>
            <AppText variant="headingSmall">Activity</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {todayCalories} kcal burned today
            </AppText>
          </View>
        </View>
        {active ? <AppBadge label={`${ACTIVITY_TYPE_LABELS[active.type]} · ${active.status}`} tone="info" /> : null}
      </View>
    </AppCard>
  );
});

ActivityCard.displayName = 'ActivityCard';
