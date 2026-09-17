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
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadMeditationData } from '@/features/meditation/meditationSlice';
import { selectTodayMeditationSeconds, selectMeditationStreak } from '@/features/meditation/selectors';
import { selectUserProfile } from '@/features/profile/selectors';
import { UserAvatar } from '@/features/profile/components/UserAvatar';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

type Nav = CompositeNavigationProp<NativeStackNavigationProp<MeditationStackParamList>, BottomTabNavigationProp<MainTabParamList>>;

export const MeditationHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
    <SectionHeroLayout environment={sectionEnvironments.meditation}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.lg }}>
        <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary}>
          {t('meditation.title')}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('HomeTab', { screen: 'Notifications' })}
            accessibilityRole="button"
            accessibilityLabel={t('notifications.title')}
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
          <Pressable onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })} accessibilityRole="button" accessibilityLabel={t('profile.title')}>
            <UserAvatar size={40} avatarId={profile.avatarId} name={profile.firstName} />
          </Pressable>
        </View>
      </View>

      <MeditationHero />

      <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary} align="center" style={{ marginTop: theme.spacing.lg, marginBottom: 4 }}>
        {t('meditation.findYourCalm')}
      </AppText>
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center">
        {t('meditation.subtitle')}
      </AppText>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.md }}>
        <StatItem icon="time-outline" value={`${Math.round(todaySeconds / 60)} ${t('units.minShort')}`} label={t('meditation.today')} />
        <View style={{ width: 1, height: 28, backgroundColor: dashboardColors.border, marginHorizontal: theme.spacing.lg }} />
        <StatItem icon="flame-outline" value={`${streak} ${t('meditation.dayShort')}`} label={t('meditation.streak')} />
      </View>

      <StartMeditationButton onPress={() => navigation.navigate('MeditationCategories')} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
        <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
          {t('meditation.quickSessions')}
        </AppText>
        <Pressable onPress={() => navigation.navigate('MeditationCategories')} accessibilityRole="button" accessibilityLabel={t('meditation.viewAllQuickSessions')}>
          <AppText variant="bodySmall" color={dashboardColors.accent}>
            {t('meditation.viewAll')}
          </AppText>
        </Pressable>
      </View>

      {/*
        Phase 2C/3 discovery-routing closeout: "Guided" is a genuine browse
        shortcut (it never played anything itself), so it now opens discovery
        with an explicit { mode: 'guided' } instead of relying on the
        screen's own default. "Short" (3 min) and "Unguided"/"Free" (10 min)
        are the "genuine direct quick-session cards" the spec says to
        preserve — both start a real ad-hoc session immediately, not a
        browse intent, so neither is rewired to open discovery. "Breathing"
        keeps using its own dedicated navigation, untouched. There is no
        Morning- or Sleep-specific card on this screen to wire — adding one
        would be a Home redesign, out of scope here.
      */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: theme.spacing.md }}>
        <QuickSessionCard
          index={0}
          icon="hourglass-outline"
          title={t('meditation.quick.short')}
          subtitle={t('meditation.quick.shortSub')}
          onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: 'free', durationSeconds: 180 })}
        />
        <QuickSessionCard
          index={1}
          icon="headset-outline"
          title={t('meditation.quick.guided')}
          subtitle={t('meditation.quick.guidedSub')}
          onPress={() => navigation.navigate('MeditationCategories', { mode: 'guided' })}
        />
        <QuickSessionCard
          index={2}
          icon="pulse-outline"
          title={t('meditation.quick.breathing')}
          subtitle={t('meditation.quick.breathingSub')}
          onPress={() => navigation.navigate('BreathingExercise', { schemeId: 'breath_box' })}
        />
        <QuickSessionCard
          index={3}
          icon="leaf-outline"
          title={t('meditation.quick.free')}
          subtitle={t('meditation.quick.freeSub')}
          isLast
          onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: 'free', durationSeconds: 600 })}
        />
      </ScrollView>

      <View style={{ marginTop: theme.spacing.xl }}>
        <MenuRow index={0} icon="bookmark-outline" title={t('meditation.menu.templates')} subtitle={t('meditation.menu.templatesSub')} onPress={() => navigation.navigate('MeditationTemplates')} />
        <MenuRow index={1} icon="flag-outline" title={t('meditation.menu.goals')} subtitle={t('meditation.menu.goalsSub')} onPress={() => navigation.navigate('MeditationGoalsScreen')} />
        <MenuRow index={2} icon="time-outline" title={t('meditation.menu.history')} subtitle={t('meditation.menu.historySub')} onPress={() => navigation.navigate('MeditationHistory')} />
        <MenuRow index={3} icon="stats-chart-outline" title={t('meditation.menu.statistics')} subtitle={t('meditation.menu.statisticsSub')} onPress={() => navigation.navigate('MeditationStatistics')} />
        <MenuRow index={4} icon="notifications-outline" title={t('meditation.menu.reminders')} subtitle={t('meditation.menu.remindersSub')} onPress={() => navigation.navigate('MeditationReminders')} isLast />
      </View>
    </SectionHeroLayout>
  );
};

/** The hero visual — concentric rings + a soft pulsing glow behind a centered seated-figure glyph, with a very slow breathing scale so it reads as alive without being distracting. */
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
        <AppIcon name="meditation" family="material-community" size={64} color={dashboardColors.accent} />
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
  const { t } = useTranslation();
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
      accessibilityLabel={t('meditation.startMeditation')}
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
            {t('meditation.startMeditation')}
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
