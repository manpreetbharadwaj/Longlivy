import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectTodayMeditationSeconds, selectMeditationStreak } from '@/features/meditation/selectors';
import { homeIconTileStyle } from '../homeIconTileStyle';
import { dashboardColors, dashboardCardElevated } from '../dashboardTheme';

/** Meditation's own muted lavender accent (matches `theme.colors.meditation`) — this card is the one place on the otherwise-neutral Home dashboard that should read as "meditation," not the dashboard's generic steel accent. */
const MEDITATION_ACCENT = '#7A9B76';

export const MeditationCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const streak = useAppSelector(selectMeditationStreak);

  // A slow breathing scale — matches the calm motion used on meditation's
  // own hero screens, brought down to icon scale here. Deliberately slower
  // than Activity's bob so the two read as calm vs energetic.
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: motion.duration.ambient, easing: motion.easing.standard }),
          withTiming(0, { duration: motion.duration.ambient, easing: motion.easing.standard })
        ),
        -1,
        true
      )
    );
  }, [breathe]);
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.value * 0.08 }] }));

  return (
    <HeroCard
      onPress={() => navigation.navigate('MeditationTab', { screen: 'MeditationHome' })}
      style={[dashboardCardElevated, { marginBottom: theme.spacing.sm }]}
      scaleOnPress
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={breatheStyle}>
            <AppIconTile
              name="meditation"
              family="material-community"
              color={MEDITATION_ACCENT}
              size={40}
              iconSize={20}
              style={[homeIconTileStyle, { marginRight: theme.spacing.sm }]}
            />
          </Animated.View>
          <View>
            <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
              Meditation
            </AppText>
            {todaySeconds > 0 ? (
              <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                <AnimatedNumberText value={Math.round(todaySeconds / 60)} variant="bodySmall" color={dashboardColors.textMuted} />
                {' min today'}
              </AppText>
            ) : (
              <AppText variant="bodySmall" color={dashboardColors.textMuted}>
                Not meditating today
              </AppText>
            )}
          </View>
        </View>
        {streak > 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <GlowOrb size={56} color={MEDITATION_ACCENT} opacity={0.18} pulse style={{ top: -20, right: -20 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="flame" size={16} color={MEDITATION_ACCENT} />
              <AnimatedNumberText value={streak} variant="bodyMedium" color={MEDITATION_ACCENT} formatter={(n) => `${Math.round(n)}d`} style={{ marginLeft: 3 }} />
            </View>
          </View>
        ) : null}
      </View>
    </HeroCard>
  );
});

MeditationCard.displayName = 'MeditationCard';
