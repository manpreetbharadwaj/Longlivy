import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MainTabParamList } from '@/navigation/types';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectActiveActivity, selectTodayActivityCalories } from '@/features/activity/selectors';
import { ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { homeIconTileStyle } from '../homeIconTileStyle';
import { dashboardColors, dashboardCardElevated } from '../dashboardTheme';

export const ActivityCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const active = useAppSelector(selectActiveActivity);
  const todayCalories = useAppSelector(selectTodayActivityCalories);

  // A gentle, continuous bob — vertical translate rather than a full
  // rotation — to suggest the icon is "in motion" without literally
  // animating limbs (the asset is a single Ionicons glyph, not a rigged
  // illustration). Cadence is brisker than meditation's breathing pulse so
  // the two icons read as distinctly "energetic" vs "calm".
  const bob = useSharedValue(0);
  useEffect(() => {
    bob.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: motion.easing.standard }),
          withTiming(0, { duration: 420, easing: motion.easing.standard })
        ),
        -1,
        true
      )
    );
  }, [bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -bob.value * 3 }] }));

  return (
    <HeroCard
      onPress={() => navigation.navigate('ActivityTab', { screen: 'ActivityHome' })}
      style={[dashboardCardElevated, { marginBottom: theme.spacing.sm }]}
      scaleOnPress
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Animated.View style={bobStyle}>
            <AppIconTile name="walk" color="#FF7A63" size={40} iconSize={20} style={[homeIconTileStyle, { marginRight: theme.spacing.sm }]} />
          </Animated.View>
          <View>
            <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
              Activity
            </AppText>
            <AppText variant="bodySmall" color={dashboardColors.textMuted}>
              <AnimatedNumberText value={todayCalories} variant="bodySmall" color={dashboardColors.textMuted} />
              {' kcal burned today'}
            </AppText>
          </View>
        </View>
        {active ? <AppBadge label={`${ACTIVITY_TYPE_LABELS[active.type]} · ${active.status}`} tone="info" /> : null}
      </View>
    </HeroCard>
  );
});

ActivityCard.displayName = 'ActivityCard';
