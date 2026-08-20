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

export const MeditationCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const streak = useAppSelector(selectMeditationStreak);

  // A slow breathing scale — matches the calm, "different mode" motion
  // used on meditation's own hero screens (MeditationHeroLayout's pulsing
  // GlowOrbs), brought down to icon scale here. Deliberately slower than
  // Activity's bob so the two read as calm vs energetic.
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
    <HeroCard onPress={() => navigation.navigate('MeditationTab', { screen: 'MeditationHome' })} style={{ marginBottom: theme.spacing.sm }} scaleOnPress>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={breatheStyle}>
            <AppIconTile name="leaf" color="#B98CE0" size={40} iconSize={20} style={{ marginRight: theme.spacing.sm }} />
          </Animated.View>
          <View>
            <AppText variant="headingSmall" color="#FFFFFF">
              Meditation
            </AppText>
            {todaySeconds > 0 ? (
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                <AnimatedNumberText value={Math.round(todaySeconds / 60)} variant="bodySmall" color="rgba(255,255,255,0.6)" />
                {' min today'}
              </AppText>
            ) : (
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Not meditating today
              </AppText>
            )}
          </View>
        </View>
        {streak > 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <GlowOrb size={56} color="#B98CE0" opacity={0.3} pulse style={{ top: -20, right: -20 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AppIcon name="flame" size={16} color="#B98CE0" />
              <AnimatedNumberText value={streak} variant="bodyMedium" color="#B98CE0" formatter={(n) => `${Math.round(n)}d`} style={{ marginLeft: 3 }} />
            </View>
          </View>
        ) : null}
      </View>
    </HeroCard>
  );
});

MeditationCard.displayName = 'MeditationCard';
