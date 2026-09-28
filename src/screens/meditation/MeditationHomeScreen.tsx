import React, { useEffect, useMemo } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { MeditationStackParamList, MainTabParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadMeditationData } from '@/features/meditation/meditationSlice';
import { selectTodayMeditationSeconds, selectMeditationStreak, selectMeditationContent, selectMeditationsByFilters } from '@/features/meditation/selectors';
import { MEDITATION_COLLECTIONS } from '@/features/meditation/meditationCollections';
import { getPlayableAmbientSounds } from '@/features/meditation/meditationAmbientAudio';
import { getMeditationArtKind, getAmbientArtKind, MeditationArt, MeditationArtKind } from '@/features/meditation/components/MeditationArt';
import { MeditationArtCard } from '@/features/meditation/components/MeditationArtCard';
import { getMeditationModeLabel } from '@/features/meditation/meditationTaxonomy';
import { selectUserProfile } from '@/features/profile/selectors';
import { UserAvatar } from '@/features/profile/components/UserAvatar';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

type Nav = CompositeNavigationProp<NativeStackNavigationProp<MeditationStackParamList>, BottomTabNavigationProp<MainTabParamList>>;

const SHORT_SESSION_MAX_SECONDS = 300;
const SHORT_SOUNDSCAPE_SECONDS = 180;

export const MeditationHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const dispatch = useAppDispatch();
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const streak = useAppSelector(selectMeditationStreak);
  const profile = useAppSelector(selectUserProfile);
  const unread = useAppSelector(selectUnreadNotificationCount);
  const content = useAppSelector(selectMeditationContent);
  const sounds = useMemo(() => getPlayableAmbientSounds(), []);
  const shortSessions = useMemo(
    () => selectMeditationsByFilters(content, { maxDurationSeconds: SHORT_SESSION_MAX_SECONDS, includeComingSoon: false }).filter((item) => item.status === 'published'),
    [content]
  );

  useEffect(() => {
    dispatch(loadMeditationData());
  }, [dispatch]);

  const openCollection = (id: (typeof MEDITATION_COLLECTIONS)[number]['id']) => {
    if (id === 'nature') navigation.navigate('MeditationSoundscapes');
    else navigation.navigate('MeditationCategories', { collection: id });
  };

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
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

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: theme.spacing.md }}>
          <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
            {t('meditation.findYourCalm')}
          </AppText>
          <AppText variant="bodySmall" color={dashboardColors.textSecondary} style={{ marginTop: 2 }}>
            {t('meditation.subtitle')}
          </AppText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <StatItem icon="time-outline" value={`${Math.round(todaySeconds / 60)} ${t('units.minShort')}`} label={t('meditation.today')} />
          <View style={{ width: 1, height: 26, backgroundColor: dashboardColors.border, marginHorizontal: theme.spacing.sm }} />
          <StatItem icon="flame-outline" value={`${streak} ${t('meditation.dayShort')}`} label={t('meditation.streak')} />
        </View>
      </View>

      <StartMeditationButton onPress={() => navigation.navigate('MeditationCategories')} />

      <SectionTitle title={t('meditation.sections.explore')} />
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
        {MEDITATION_COLLECTIONS.slice(0, 2).map((collection, index) => (
          <MeditationArtCard
            key={collection.id}
            kind={collection.art}
            title={t(`meditation.collections.${collection.id}.title`)}
            subtitle={t(`meditation.collections.${collection.id}.subtitle`)}
            onPress={() => openCollection(collection.id)}
            style={index === 0 ? { marginRight: theme.spacing.sm } : null}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {MEDITATION_COLLECTIONS.slice(2).map((collection, index) => (
          <MeditationArtCard
            key={collection.id}
            kind={collection.art}
            title={t(`meditation.collections.${collection.id}.title`)}
            subtitle={t(`meditation.collections.${collection.id}.subtitle`)}
            onPress={() => openCollection(collection.id)}
            style={index === 0 ? { marginRight: theme.spacing.sm } : null}
          />
        ))}
      </View>

      {sounds.length > 0 ? (
        <>
          <SectionTitle
            title={t('meditation.sections.soundsOnly')}
            actionLabel={t('meditation.viewAll')}
            onAction={() => navigation.navigate('MeditationSoundscapes')}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: theme.spacing.md }}>
            {sounds.map((sound, index) => (
              <MeditationArtCard
                key={sound.id}
                kind={getAmbientArtKind(sound.type)}
                seed={sound.id}
                title={t(`meditation.ambient.sounds.${sound.type}`)}
                width={116}
                height={96}
                onPress={() => navigation.navigate('MeditationSoundscapes', { soundId: sound.id })}
                style={index === sounds.length - 1 ? null : { marginRight: theme.spacing.sm }}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      <SectionTitle title={t('meditation.sections.waysToMeditate')} />
      <PracticeRow
        index={0}
        art="guided"
        title={t('meditation.practices.guided')}
        subtitle={t('meditation.practices.guidedSub')}
        onPress={() => navigation.navigate('MeditationCategories', { mode: 'guided' })}
      />
      <PracticeRow
        index={1}
        art="unguided"
        title={t('meditation.practices.unguided')}
        subtitle={t('meditation.practices.unguidedSub')}
        onPress={() => navigation.navigate('MeditationCategories', { mode: 'free' })}
      />
      <PracticeRow
        index={2}
        art="breathing"
        title={t('meditation.practices.breathing')}
        subtitle={t('meditation.practices.breathingSub')}
        onPress={() => navigation.navigate('BreathingExercise', { schemeId: 'breath_box' })}
        isLast
      />

      <SectionTitle title={t('meditation.sections.shortSessions')} subtitle={t('meditation.shortSessions.subtitle')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: theme.spacing.md }}>
        <MeditationArtCard
          kind="rain"
          seed="short-soundscape"
          title={t('meditation.shortSessions.soundscapeTitle')}
          subtitle={t('meditation.shortSessions.soundscapeSub')}
          width={156}
          height={116}
          onPress={() => navigation.navigate('MeditationSoundscapes', { durationSeconds: SHORT_SOUNDSCAPE_SECONDS, allowSilence: true })}
          style={{ marginRight: theme.spacing.sm }}
        />
        {shortSessions.map((item, index) => (
          <MeditationArtCard
            key={item.id}
            kind={getMeditationArtKind(item)}
            seed={item.id}
            title={item.title}
            subtitle={`${t('meditation.shortSessions.minutes', { minutes: Math.round(item.durationSeconds / 60) })} · ${getMeditationModeLabel(item.type, t)}`}
            width={156}
            height={116}
            onPress={() => navigation.navigate('MeditationDetails', { meditationId: item.id })}
            style={index === shortSessions.length - 1 ? null : { marginRight: theme.spacing.sm }}
          />
        ))}
      </ScrollView>

      <View style={{ marginTop: theme.spacing.xl }}>
        <MenuRow index={0} icon="add-circle-outline" title={t('meditation.menu.templates')} subtitle={t('meditation.menu.templatesSub')} onPress={() => navigation.navigate('MeditationTemplates')} />
        <MenuRow index={1} icon="flag-outline" title={t('meditation.menu.goals')} subtitle={t('meditation.menu.goalsSub')} onPress={() => navigation.navigate('MeditationGoalsScreen')} />
        <MenuRow index={2} icon="time-outline" title={t('meditation.menu.history')} subtitle={t('meditation.menu.historySub')} onPress={() => navigation.navigate('MeditationHistory')} />
        <MenuRow index={3} icon="stats-chart-outline" title={t('meditation.menu.statistics')} subtitle={t('meditation.menu.statisticsSub')} onPress={() => navigation.navigate('MeditationStatistics')} />
        <MenuRow index={4} icon="notifications-outline" title={t('meditation.menu.reminders')} subtitle={t('meditation.menu.remindersSub')} onPress={() => navigation.navigate('MeditationReminders')} isLast />
      </View>
    </SectionHeroLayout>
  );
};

const SectionTitle: React.FC<{ title: string; subtitle?: string; actionLabel?: string; onAction?: () => void }> = React.memo(({ title, subtitle, actionLabel, onAction }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm }}>
      <View style={{ flex: 1 }}>
        <AppText variant="headingMedium" color={dashboardColors.textPrimary}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color={dashboardColors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={`${actionLabel}: ${title}`} hitSlop={8}>
          <AppText variant="bodySmall" color={dashboardColors.accent}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
});
SectionTitle.displayName = 'SectionTitle';

const StatItem: React.FC<{ icon: AppIconName; value: string; label: string }> = React.memo(({ icon, value, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <AppIcon name={icon} size={15} color={dashboardColors.accent} />
    <View style={{ marginLeft: 5 }}>
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
      style={{ marginTop: theme.spacing.md }}
    >
      <Animated.View style={animatedStyle}>
        <LinearGradient
          colors={[dashboardColors.accent, dashboardColors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 54,
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

const PracticeRow: React.FC<{ index: number; art: MeditationArtKind; title: string; subtitle: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, art, title, subtitle, onPress, isLast }) => {
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
              padding: theme.spacing.xs,
              marginBottom: isLast ? 0 : theme.spacing.sm,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View style={{ width: 60, height: 60, borderRadius: 14, overflow: 'hidden', marginRight: theme.spacing.sm }}>
            <MeditationArt kind={art} seed={art} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary}>
              {title}
            </AppText>
            <AppText variant="bodySmall" color={dashboardColors.textMuted}>
              {subtitle}
            </AppText>
          </View>
          <View style={{ marginRight: theme.spacing.xs }}>
            <AppIcon name="chevron-forward" size={18} color={dashboardColors.textMuted} />
          </View>
        </Pressable>
      </FadeSlideIn>
    );
  }
);
PracticeRow.displayName = 'PracticeRow';

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
