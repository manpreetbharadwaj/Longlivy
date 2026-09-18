import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppBadge } from '@/components/common/AppBadge';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectCurrentWeight, selectWeightTrend } from '@/features/weight/selectors';
import { homeIconTileStyle } from '../homeIconTileStyle';
import { dashboardColors, dashboardCardElevated } from '../dashboardTheme';

export const WeightCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const current = useAppSelector(selectCurrentWeight);
  const trend = useAppSelector(selectWeightTrend);

  // The dashboard icon here is a flat scale glyph rather than a person/
  // barbell illustration, so a literal "lifting" animation would misread —
  // instead a slow, controlled settle (down, hold, back up) on the icon
  // reads as "a weight being placed and lifted off a scale" without being
  // cartoonish. Loops smoothly and stays subtle.
  const settle = useSharedValue(0);
  useEffect(() => {
    settle.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: motion.easing.standard }),
          withTiming(0, { duration: 700, easing: motion.easing.standard })
        ),
        -1,
        true
      )
    );
  }, [settle]);
  const settleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: settle.value * 2.5 }] }));

  return (
    <HeroCard style={[dashboardCardElevated, { marginBottom: theme.spacing.sm }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={settleStyle}>
            <AppIconTile name="scale-outline" color="#2DD4BF" size={40} iconSize={20} style={[homeIconTileStyle, { marginRight: theme.spacing.sm }]} />
          </Animated.View>
          <View>
            <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
              Weight
            </AppText>
            <AppText variant="bodySmall" color={dashboardColors.textMuted}>
              {current ? `Logged ${new Date(current.timestamp).toLocaleDateString()}` : 'No entries yet'}
            </AppText>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {current ? (
            <AnimatedNumberText value={current.weightKg} formatter={(n) => `${n.toFixed(1)} kg`} variant="headingSmall" color={dashboardColors.textPrimary} />
          ) : (
            <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
              —
            </AppText>
          )}
          {current ? (
            <AppBadge label={current.source === 'manual' ? 'Manual' : current.source.replace('_', ' ')} tone={current.source === 'manual' ? 'neutral' : 'info'} />
          ) : null}
          {trend !== 0 ? (
            <FadeSlideIn delay={200} fromY={4}>
              <AppText variant="caption" color={trend < 0 ? '#34D399' : '#FBBF24'}>
                {trend > 0 ? '+' : ''}
                {trend} kg
              </AppText>
            </FadeSlideIn>
          ) : null}
        </View>
      </View>
    </HeroCard>
  );
});

WeightCard.displayName = 'WeightCard';
