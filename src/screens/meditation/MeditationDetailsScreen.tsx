import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { ctaGradient } from '@/theme/gradients';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationContent, selectMeditationFavorites } from '@/features/meditation/selectors';
import { toggleMeditationFavoriteThunk } from '@/features/meditation/meditationSlice';
import { getMeditationTopicLabel, getMeditationModeLabel, getUnguidedSoundCategoryLabel } from '@/features/meditation/meditationTaxonomy';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

// Same "gentle departure" duration used before the Start button actually
// navigates — long enough to read as a deliberate transition into a new
// mode, short enough not to feel like a stall.
const START_TRANSITION_MS = 140;

export const MeditationDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationDetails'>>();
  const dispatch = useAppDispatch();
  const content = useAppSelector(selectMeditationContent);
  const favorites = useAppSelector(selectMeditationFavorites);
  const meditation = content.find((m) => m.id === route.params.meditationId);
  const isFavorite = meditation ? favorites.includes(meditation.id) : false;
  const isComingSoon = meditation?.availability === 'coming_soon';
  const [starting, setStarting] = useState(false);

  const toggleFavorite = useCallback(() => {
    if (meditation) dispatch(toggleMeditationFavoriteThunk(meditation.id));
  }, [dispatch, meditation]);

  const start = useCallback(() => {
    if (!meditation || starting || isComingSoon) return;
    setStarting(true);
    setTimeout(() => {
      navigation.navigate('MeditationPlayer', { meditationId: meditation.id, type: meditation.type, durationSeconds: meditation.durationSeconds });
    }, START_TRANSITION_MS);
  }, [navigation, meditation, starting, isComingSoon]);

  if (!meditation) {
    return (
      <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.details.notFoundTitle')} onBack={() => navigation.goBack()}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <AppIcon name="alert-circle-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            {t('meditation.details.unavailableTitle')}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            {t('meditation.details.unavailableBody')}
          </AppText>
        </View>
      </SectionHeroLayout>
    );
  }

  return (
    <SectionHeroLayout
      environment={sectionEnvironments.meditation}
      title={meditation.title}
      onBack={() => navigation.goBack()}
      rightElement={
        <Pressable
          onPress={toggleFavorite}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? t('meditation.details.removeFavorite') : t('meditation.details.addFavorite')}
          hitSlop={8}
        >
          <AppIcon name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#E5BC72' : 'rgba(255,255,255,0.6)'} />
        </Pressable>
      }
    >
      <FadeSlideIn fromScale={0.95} fromY={0}>
        <MeditationArtwork />
      </FadeSlideIn>

      <FadeSlideIn delay={1 * motion.staggerStepMs}>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.md }}>
          {meditation.description}
        </AppText>
      </FadeSlideIn>

      <FadeSlideIn delay={2 * motion.staggerStepMs}>
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
          <Tag label={getMeditationTopicLabel(meditation.category, t)} />
          <Tag label={`${Math.round(meditation.durationSeconds / 60)} min`} />
          <Tag label={getMeditationModeLabel(meditation.type, t)} />
          {meditation.soundCategory ? <Tag label={getUnguidedSoundCategoryLabel(meditation.soundCategory, t)} /> : null}
          {isComingSoon ? <Tag label={t('meditation.details.comingSoon')} /> : null}
        </View>
      </FadeSlideIn>

      <FadeSlideIn delay={3 * motion.staggerStepMs} fromScale={0.97}>
        <AppGradientButton
          label={isComingSoon ? t('meditation.details.comingSoon') : t('meditation.details.start')}
          onPress={start}
          colors={ctaGradient}
          disabled={starting || isComingSoon}
        />
      </FadeSlideIn>
    </SectionHeroLayout>
  );
};

/** A quiet preview of the session's central visual — same seated-figure mark and ring language the Player screen uses, so tapping Start feels like a continuation rather than a jump to something new. */
const MeditationArtwork: React.FC = React.memo(() => {
  const size = 160;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: size, marginTop: 4 }}>
      <GlowOrb size={size * 1.4} color={dashboardColors.accent} opacity={0.2} pulse style={{ top: (size - size * 1.4) / 2, left: (size - size * 1.4) / 2 }} />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: dashboardColors.accent + '40',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name="meditation" family="material-community" size={64} color={dashboardColors.accent} />
      </View>
    </View>
  );
});
MeditationArtwork.displayName = 'MeditationArtwork';

const Tag: React.FC<{ label: string }> = ({ label }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        marginRight: theme.spacing.xs,
      }}
    >
      <AppText variant="caption" color="#FFFFFF" style={{ textTransform: 'capitalize' }}>
        {label}
      </AppText>
    </View>
  );
};
