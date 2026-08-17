import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectTodayMeditationSeconds, selectMeditationStreak } from '@/features/meditation/selectors';

export const MeditationCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const streak = useAppSelector(selectMeditationStreak);

  return (
    <AppCard onPress={() => navigation.navigate('MeditationTab', { screen: 'MeditationHome' })} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIconTile name="leaf" color={theme.colors.meditation} size={40} iconSize={20} style={{ marginRight: theme.spacing.sm }} />
          <View>
            <AppText variant="headingSmall">Meditation</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {todaySeconds > 0 ? `${Math.round(todaySeconds / 60)} min today` : 'Not meditating today'}
            </AppText>
          </View>
        </View>
        {streak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="flame" size={16} color={theme.colors.meditation} />
            <AppText variant="bodyMedium" color={theme.colors.meditation} style={{ marginLeft: 3 }}>
              {streak}d
            </AppText>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
});

MeditationCard.displayName = 'MeditationCard';
