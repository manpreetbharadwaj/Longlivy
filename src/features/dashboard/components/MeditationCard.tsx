import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
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
    <HeroCard onPress={() => navigation.navigate('MeditationTab', { screen: 'MeditationHome' })} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIconTile name="leaf" color="#B98CE0" size={40} iconSize={20} style={{ marginRight: theme.spacing.sm }} />
          <View>
            <AppText variant="headingSmall" color="#FFFFFF">
              Meditation
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {todaySeconds > 0 ? `${Math.round(todaySeconds / 60)} min today` : 'Not meditating today'}
            </AppText>
          </View>
        </View>
        {streak > 0 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIcon name="flame" size={16} color="#B98CE0" />
            <AppText variant="bodyMedium" color="#B98CE0" style={{ marginLeft: 3 }}>
              {streak}d
            </AppText>
          </View>
        ) : null}
      </View>
    </HeroCard>
  );
});

MeditationCard.displayName = 'MeditationCard';
