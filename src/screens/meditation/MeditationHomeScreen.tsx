import React, { useEffect } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { MeditationStackParamList, MainTabParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadMeditationData } from '@/features/meditation/meditationSlice';
import { selectTodayMeditationSeconds, selectMeditationStreak } from '@/features/meditation/selectors';
import { selectUserProfile } from '@/features/profile/selectors';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

type Nav = CompositeNavigationProp<NativeStackNavigationProp<MeditationStackParamList>, BottomTabNavigationProp<MainTabParamList>>;

export const MeditationHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const streak = useAppSelector(selectMeditationStreak);
  const profile = useAppSelector(selectUserProfile);
  const unread = useAppSelector(selectUnreadNotificationCount);

  useEffect(() => {
    dispatch(loadMeditationData());
  }, [dispatch]);

  return (
    <TabHeroLayout>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary}>
          Meditation
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={{ marginRight: theme.spacing.sm }}
          >
            <View>
              <AppIcon name="notifications-outline" size={22} color={dashboardColors.textPrimary} />
              {unread > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -4,
                    backgroundColor: dashboardColors.accent,
                    borderRadius: 8,
                    minWidth: 16,
                    height: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}
                >
                  <AppText variant="caption" color={dashboardColors.background} weight="700">
                    {unread}
                  </AppText>
                </View>
              ) : null}
            </View>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('HomeTab', { screen: 'Profile' })} accessibilityRole="button" accessibilityLabel="Profile">
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: dashboardColors.surfaceElevated,
                borderWidth: 1.5,
                borderColor: dashboardColors.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppText variant="headingSmall" color={dashboardColors.accent}>
                {profile.firstName.charAt(0)}
              </AppText>
            </View>
          </Pressable>
        </View>
      </View>

      <MeditationHero />

      <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary} align="center" style={{ marginTop: theme.spacing.lg, marginBottom: 4 }}>
        Find your calm
      </AppText>
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center">
        Meditation for a better you
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.md }}>
        <StatItem icon="time-outline" value={`${Math.round(todaySeconds / 60)} min`} label="Today" />
        <View style={{ width: 1, height: 28, backgroundColor: dashboardColors.border, marginHorizontal: theme.spacing.lg }} />
        <StatItem icon="flame-outline" value={`${streak} day`} label="Streak" />
      </View>

      <StartMeditationButton onPress={() => navigation.navigate('MeditationCategories')} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
          Quick sessions
        </AppText>
        <Pressable onPress={() => navigation.navigate('MeditationCategories')} accessibilityRole="button" accessibilityLabel="View all quick sessions">
          <AppText variant="bodySmall" color={dashboardColors.accent}>
            View all
          </AppText>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: theme.spacing.md }}>
        <QuickSessionCard
          index={0}
          icon="hourglass-outline"
          title="Short"
          subtitle="3 min"
          onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: 'free', durationSeconds: 180 })}
        />
        <QuickSessionCard index={1} icon="headset-outline" title="Guided" subtitle="Sessions" onPress={() => navigation.navigate('MeditationCategories')} />
        <QuickSessionCard
          index={2}
          icon="pulse-outline"
          title="Breathing"
          subtitle="Exercises"
          onPress={() => navigation.navigate('BreathingExercise', { schemeId: 'breath_box' })}
        />
        <QuickSessionCard
          index={3}
          icon="leaf-outline"
          title="Free"
          subtitle="Meditate"
          isLast
          onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: 'free', durationSeconds: 600 })}
        />
      </ScrollView>

      <View style={{ marginTop: theme.spacing.xl }}>
        <MenuRow index={0} icon="bookmark-outline" title="My templates" subtitle="Your saved meditations" onPress={() => navigation.navigate('MeditationTemplates')} />
        <MenuRow index={1} icon="flag-outline" title="Goals" subtitle="Track your progress" onPress={() => navigation.navigate('MeditationGoalsScreen')} />
        <MenuRow index={2} icon="time-outline" title="History" subtitle="Your past sessions" onPress={() => navigation.navigate('MeditationHistory')} />
        <MenuRow index={3} icon="stats-chart-outline" title="Statistics" subtitle="Insights and trends" onPress={() => navigation.navigate('MeditationStatistics')} />
        <MenuRow index={4} icon="notifications-outline" title="Reminders" subtitle="Stay consistent" onPress={() => navigation.navigate('MeditationReminders')} isLast />
      </View>
    </TabHeroLayout>
  );
};

/** The cyan lotus visual — concentric rings + a soft glow behind a centered flower glyph, with a very slow breathing scale so it reads as alive without being distracting. No purple, no interaction. */
const MeditationHero: React.FC = React.memo(() => {
  const breathe = useSharedValue(0);
  useEffect(() => {
    breathe.value = withDelay(
      300,
      withRepeat(withSequence(withTiming(1, { duration: motion.duration.ambient, easing: motion.easing.standard }), withTiming(0, { duration: motion.duration.ambient, easing: motion.easing.standard })), -1, true)
    );
  }, [breathe]);
  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breathe.value * 0.04 }] }));

  const size = 200;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: size }}>
      <GlowOrb size={size * 1.5} color={dashboardColors.accent} opacity={0.16} pulse style={{ top: (size - size * 1.5) / 2, left: (size - size * 1.5) / 2 }} />
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 4} stroke={dashboardColors.border} strokeWidth={1} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={size / 2 - 34} stroke={dashboardColors.accent} strokeOpacity={0.4} strokeWidth={1.5} fill="none" />
      </Svg>
      <Animated.View style={breatheStyle}>
        <AppIcon name="flower-outline" size={64} color={dashboardColors.accent} />
      </Animated.View>
    </View>
  );
});
MeditationHero.displayName = 'MeditationHero';

const StatItem: React.FC<{ icon: AppIconName; value: string; label: string }> = React.memo(({ icon, value, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <AppIcon name={icon} size={16} color={dashboardColors.accent} />
    <View style={{ marginLeft: 6 }}>
      <AppText variant="bodyMedium" weight="700" color={dashboardColors.textPrimary}>
        {value}
      </AppText>
      <AppText variant="caption" color={dashboardColors.textMuted}>
        {label}
      </AppText>
    </View>
  </View>
));
StatItem.displayName = 'StatItem';

const StartMeditationButton: React.FC<{ onPress: () => void }> = React.memo(({ onPress }) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: motion.duration.fast });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: motion.duration.fast });
      }}
      accessibilityRole="button"
      accessibilityLabel="Start meditation"
      style={{ marginTop: theme.spacing.xl }}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={[dashboardColors.accent, dashboardColors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 56,
            borderRadius: 18,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="play" size={18} color="#FFFFFF" />
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginLeft: 8 }}>
            Start meditation
          </AppText>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});
StartMeditationButton.displayName = 'StartMeditationButton';

const QuickSessionCard: React.FC<{ index: number; icon: AppIconName; title: string; subtitle: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, icon, title, subtitle, onPress, isLast }) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            scale.value = withTiming(0.95, { duration: motion.duration.fast });
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: motion.duration.fast });
          }}
          accessibilityRole="button"
          accessibilityLabel={`${title} ${subtitle}`}
        >
          <Animated.View
            style={[
              dashboardCardStyle,
              {
                width: 108,
                height: 108,
                borderRadius: 16,
                marginRight: isLast ? 0 : theme.spacing.sm,
                alignItems: 'center',
                justifyContent: 'center',
                padding: theme.spacing.xs,
              },
              animatedStyle,
            ]}
          >
            <AppIcon name={icon} size={24} color={dashboardColors.accent} />
            <AppText variant="bodyMedium" weight="600" color={dashboardColors.textPrimary} style={{ marginTop: 8 }}>
              {title}
            </AppText>
            <AppText variant="caption" color={dashboardColors.textMuted}>
              {subtitle}
            </AppText>
          </Animated.View>
        </Pressable>
      </FadeSlideIn>
    );
  }
);
QuickSessionCard.displayName = 'QuickSessionCard';

const MenuRow: React.FC<{ index: number; icon: AppIconName; title: string; subtitle: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, icon, title, subtitle, onPress, isLast }) => {
    const { theme } = useTheme();
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={8}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${subtitle}`}
          style={({ pressed }) => [
            dashboardCardStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing.sm,
              marginBottom: isLast ? 0 : theme.spacing.sm,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: dashboardColors.surfaceSecondary,
              borderWidth: 1,
              borderColor: dashboardColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <AppIcon name={icon} size={19} color={dashboardColors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary}>
              {title}
            </AppText>
            <AppText variant="bodySmall" color={dashboardColors.textMuted}>
              {subtitle}
            </AppText>
          </View>
          <AppIcon name="chevron-forward" size={18} color={dashboardColors.textMuted} />
        </Pressable>
      </FadeSlideIn>
    );
  }
);
MenuRow.displayName = 'MenuRow';
