import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { Meditation } from '../models';
import { MeditationArt, getMeditationArtKind } from './MeditationArt';
import { getMeditationTopicLabel, getUnguidedSoundCategoryLabel } from '../meditationTaxonomy';

interface MeditationListItemProps {
  meditation: Meditation;
  onPress: () => void;
}

/** The premium row used across Meditation's browse lists — a small scene for the item, title/meta, and a trailing chevron. Coming-soon items are dimmed and labelled. */
export const MeditationListItem: React.FC<MeditationListItemProps> = React.memo(({ meditation, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
          width: 56,
          height: 56,
          borderRadius: theme.radius.md,
          overflow: 'hidden',
          marginRight: theme.spacing.sm,
          opacity: meditation.availability === 'coming_soon' ? 0.55 : 1,
        }}
      >
        <MeditationArt kind={getMeditationArtKind(meditation)} seed={meditation.id} />
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
