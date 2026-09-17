import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { Meditation } from '../models';
import { getMeditationCategoryIcon } from '../meditationCategoryIcons';
import { getMeditationTopicLabel, getUnguidedSoundCategoryLabel } from '../meditationTaxonomy';

interface MeditationListItemProps {
  meditation: Meditation;
  onPress: () => void;
}

/** The premium row used across Meditation's browse lists — a category-tinted icon tile, title/meta, and a trailing chevron. Replaces the old text-only HeroCard row. */
export const MeditationListItem: React.FC<MeditationListItemProps> = React.memo(({ meditation, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const icon = getMeditationCategoryIcon(meditation.category);
  const topicLabel = getMeditationTopicLabel(meditation.category, t);
  const soundLabel = meditation.soundCategory ? getUnguidedSoundCategoryLabel(meditation.soundCategory, t) : null;

  return (
    <HeroCard
      onPress={onPress}
      scaleOnPress
      accessibilityLabel={`${meditation.title}, ${topicLabel}, ${Math.round(meditation.durationSeconds / 60)} minutes${soundLabel ? `, ${soundLabel}` : ''}`}
      style={{
        marginBottom: theme.spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: theme.radius.md,
          backgroundColor: dashboardColors.accent + '26',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: theme.spacing.sm,
        }}
      >
        <AppIcon name={icon.name} family={icon.family} size={22} color={dashboardColors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="headingSmall" color="#FFFFFF" numberOfLines={1}>
          {meditation.title}
        </AppText>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.55)" style={{ marginTop: 2 }} numberOfLines={1}>
          {topicLabel} · {Math.round(meditation.durationSeconds / 60)} min{soundLabel ? ` · ${soundLabel}` : ''}
          {meditation.availability === 'coming_soon' ? ` · ${t('meditation.details.comingSoon')}` : ''}
        </AppText>
      </View>
      <AppIcon name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
    </HeroCard>
  );
});

MeditationListItem.displayName = 'MeditationListItem';
