import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppProgressRing } from '@/components/common/AppProgressRing';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { AnimatedNumberText } from '@/components/common/AnimatedNumberText';
import { CardShimmer } from '@/components/common/CardShimmer';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';
import { motion } from '@/theme/motion';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { selectDailySummary } from '../selectors';
import { DailyRing } from '../models';
import { dashboardColors, dashboardHeroCardStyle } from '../dashboardTheme';

const RING_ICONS: Record<DailyRing['key'], AppIconName> = {
  nutrition: 'restaurant-outline',
  activity: 'flame-outline',
  mindfulness: 'leaf-outline',
};

const RING_LABEL_KEYS: Record<DailyRing['key'], TranslationKey> = {
  nutrition: 'home.ring.nutrition',
  activity: 'home.ring.activity',
  mindfulness: 'home.ring.mindfulness',
};

/**
 * The Home dashboard's command-center hero: one glance across every
 * pillar's progress today, plus the net-calorie headline and both streaks.
 * Reads a single `selectDailySummary` subscription rather than composing
 * five selectors itself, so it stays in sync with `TodaySummary` for free.
 */
export const DailyPulseCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const summary = useAppSelector(selectDailySummary);
  const exceeded = summary.energy.exceededBy > 0;

  return (
    <HeroCard style={[dashboardHeroCardStyle, { marginBottom: theme.spacing.sm, overflow: 'hidden' }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <AppText variant="headingSmall" color={dashboardColors.textPrimary}>
          {t('home.pulse.title')}
        </AppText>
        <AppBadge label={exceeded ? t('home.pulse.goalExceeded') : t('home.pulse.onTrack')} tone={exceeded ? 'warning' : 'success'} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: theme.spacing.md }}>
        <AnimatedNumberText
          value={exceeded ? summary.energy.exceededBy : summary.energy.remaining}
          formatter={(n) => `${exceeded ? '+' : ''}${Math.round(n)}`}
          variant="metricLarge"
          color={exceeded ? dashboardColors.warning : dashboardColors.textPrimary}
        />
        <AppText variant="bodyMedium" color={dashboardColors.textSecondary} style={{ marginLeft: 6, marginBottom: 8 }}>
          {exceeded ? t('home.pulse.kcalOver') : t('home.pulse.kcalRemaining')}
        </AppText>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {summary.rings.map((ring, index) => (
          <RingTile key={ring.key} ring={ring} index={index} />
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          marginTop: theme.spacing.md,
          paddingTop: theme.spacing.sm,
          borderTopWidth: 1,
          borderTopColor: dashboardColors.border,
        }}
      >
        <FadeSlideIn delay={3 * motion.staggerStepMs} fromY={8} style={{ flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.lg }}>
          <AppIcon name="ribbon-outline" size={15} color={dashboardColors.accent} />
          <AppText variant="bodySmall" color={dashboardColors.textSecondary} style={{ marginLeft: 6 }}>
            {t('home.pulse.fastingStreak', { days: summary.fasting.currentStreak })}
          </AppText>
        </FadeSlideIn>
        <FadeSlideIn delay={4 * motion.staggerStepMs} fromY={8} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppIcon name="leaf-outline" size={15} color={dashboardColors.accent} />
          <AppText variant="bodySmall" color={dashboardColors.textSecondary} style={{ marginLeft: 6 }}>
            {t('home.pulse.mindfulStreak', { days: summary.mindfulness.streak })}
          </AppText>
        </FadeSlideIn>
      </View>
      <CardShimmer delay={300} />
    </HeroCard>
  );
});

DailyPulseCard.displayName = 'DailyPulseCard';

const RingTile: React.FC<{ ring: DailyRing; index: number }> = React.memo(({ ring, index }) => {
  const { t } = useTranslation();
  const animatedFraction = useAnimatedProgress(ring.fraction, 900, { delay: index * motion.staggerStepMs, step: 0.004 });

  return (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={10} style={{ alignItems: 'center' }}>
      <AppProgressRing progress={animatedFraction} size={68} strokeWidth={7} color={ring.color} trackColor={dashboardColors.border} icon={RING_ICONS[ring.key]} iconSize={20} iconColor={ring.color} />
      <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginTop: 6 }}>
        {t(RING_LABEL_KEYS[ring.key])}
      </AppText>
    </FadeSlideIn>
  );
});
RingTile.displayName = 'RingTile';
