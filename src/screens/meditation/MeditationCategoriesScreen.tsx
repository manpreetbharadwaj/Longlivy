import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroChip } from '@/components/common/HeroChip';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useAppSelector } from '@/store/hooks';
import { selectMeditationContent, selectMeditationsByFilters } from '@/features/meditation/selectors';
import { MEDITATION_TOPICS, MeditationTopic, MeditationType, UnguidedSoundCategory, MEDITATION_DURATION_PRESETS_SECONDS } from '@/features/meditation/models';
import { getMeditationTopicLabel, getMeditationModeLabel, getUnguidedSoundCategoryLabel, getMeditationEmptyStateMessage } from '@/features/meditation/meditationTaxonomy';
import { MeditationListItem } from '@/features/meditation/components/MeditationListItem';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

// Caps how many steps of stagger delay accumulate — same reasoning as
// StaggerGroup's own `maxSteps`: without a cap, the tail of a long list
// would take an oddly long time to finish revealing itself.
const MAX_STAGGER_STEPS = 8;

/**
 * Discovery/browse surface for both Guided and Unguided content — one screen
 * with contextual filters rather than near-identical screens per mode.
 * Breathing stays on its own dedicated flow (see BreathingExerciseScreen).
 */
export const MeditationCategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationCategories'>>();
  const content = useAppSelector(selectMeditationContent);

  // Seeded once from navigation params (initial browse intent, per Phase 2C
  // Section 9) — deliberately NOT re-synced from route.params after mount,
  // so a user's in-screen filter changes are never clobbered by the params
  // that opened the screen.
  const [mode, setMode] = useState<MeditationType>(route.params?.mode ?? 'guided');
  const [topic, setTopic] = useState<MeditationTopic | null>(route.params?.topic ?? null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(route.params?.durationSeconds ?? null);
  const [soundCategory, setSoundCategory] = useState<UnguidedSoundCategory | null>(route.params?.soundCategory ?? null);

  const isUnguided = mode === 'free';

  // Recomputed whenever `t` changes (i.e. on language switch) — Section 28:
  // never bake a localized label list once at module scope, since that would
  // go stale the moment the user changes language at runtime.
  const modeOptions = useMemo(
    () => [
      { key: 'guided' as const, label: getMeditationModeLabel('guided', t) },
      { key: 'free' as const, label: getMeditationModeLabel('free', t) },
    ],
    [t]
  );
  const topicChips = useMemo(
    () => [{ key: 'all' as const, label: t('meditation.categories.all') }, ...MEDITATION_TOPICS.map((topicOption) => ({ key: topicOption, label: getMeditationTopicLabel(topicOption, t) }))],
    [t]
  );
  const durationChips = useMemo(
    () => [
      { key: 'all' as const, label: t('meditation.categories.all') },
      ...MEDITATION_DURATION_PRESETS_SECONDS.map((seconds) => ({ key: seconds, label: `${Math.round(seconds / 60)} Min` })),
    ],
    [t]
  );
  const soundCategoryChips = useMemo(
    () => [
      { key: 'all' as const, label: t('meditation.categories.all') },
      { key: 'meditation_music' as const, label: getUnguidedSoundCategoryLabel('meditation_music', t) },
      { key: 'ambient' as const, label: getUnguidedSoundCategoryLabel('ambient', t) },
      { key: 'nature' as const, label: getUnguidedSoundCategoryLabel('nature', t) },
    ],
    [t]
  );

  const filtered = useMemo(
    () =>
      selectMeditationsByFilters(content, {
        mode,
        topic: topic ?? undefined,
        // Duration/sound are Unguided-only dimensions — a value left over
        // from a previous Unguided visit must never silently narrow Guided.
        durationSeconds: isUnguided ? durationSeconds ?? undefined : undefined,
        soundCategory: isUnguided ? soundCategory ?? undefined : undefined,
      }),
    [content, mode, topic, durationSeconds, isUnguided, soundCategory]
  );

  const openMeditation = useCallback((meditationId: string) => navigation.navigate('MeditationDetails', { meditationId }), [navigation]);

  const clearFilters = useCallback(() => {
    setTopic(null);
    setDurationSeconds(null);
    setSoundCategory(null);
  }, []);

  const hasNarrowingFilter = topic != null || durationSeconds != null || soundCategory != null;
  const filterKey = `${mode}-${topic ?? 'all'}-${durationSeconds ?? 'all'}-${soundCategory ?? 'all'}`;

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t(isUnguided ? 'meditation.categories.unguidedTitle' : 'meditation.categories.guidedTitle')} onBack={() => navigation.goBack()}>
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
        {modeOptions.map((option) => (
          <HeroChip key={option.key} label={option.label} selected={mode === option.key} onPress={() => setMode(option.key)} activeColor={dashboardColors.accent} />
        ))}
      </View>

      <FadeSlideIn style={{ marginBottom: theme.spacing.sm }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={topicChips}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <HeroChip
              label={item.label}
              selected={item.key === 'all' ? topic === null : topic === item.key}
              onPress={() => setTopic(item.key === 'all' ? null : item.key)}
              activeColor={dashboardColors.accent}
            />
          )}
        />
      </FadeSlideIn>

      {isUnguided ? (
        <>
          <FadeSlideIn style={{ marginBottom: theme.spacing.sm }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={durationChips}
              keyExtractor={(item) => String(item.key)}
              renderItem={({ item }) => (
                <HeroChip
                  label={item.label}
                  selected={item.key === 'all' ? durationSeconds === null : durationSeconds === item.key}
                  onPress={() => setDurationSeconds(item.key === 'all' ? null : item.key)}
                  activeColor={dashboardColors.accent}
                />
              )}
            />
          </FadeSlideIn>

          <FadeSlideIn style={{ marginBottom: theme.spacing.sm }}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={soundCategoryChips}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <HeroChip
                  label={item.label}
                  selected={item.key === 'all' ? soundCategory === null : soundCategory === item.key}
                  onPress={() => setSoundCategory(item.key === 'all' ? null : item.key)}
                  activeColor={dashboardColors.accent}
                />
              )}
            />
          </FadeSlideIn>
        </>
      ) : null}

      {/* Keyed on the active filter combination so the whole block remounts
          — and its staggered entrance replays — the instant filters change. */}
      <View key={filterKey}>
        {filtered.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: dashboardColors.accent + '1A',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.md,
              }}
            >
              <AppIcon name="file-tray-outline" size={30} color={dashboardColors.accent} />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              {getMeditationEmptyStateMessage(t, { topic, durationSeconds, soundCategory })}
            </AppText>
            {hasNarrowingFilter ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: theme.spacing.md }}>
                {topic != null && (durationSeconds != null || soundCategory != null) ? (
                  <HeroChip
                    label={t('meditation.categories.showAllTopic', { topic: getMeditationTopicLabel(topic, t) })}
                    selected={false}
                    onPress={() => {
                      setDurationSeconds(null);
                      setSoundCategory(null);
                    }}
                    activeColor={dashboardColors.accent}
                  />
                ) : null}
                {soundCategory != null && soundCategory !== 'meditation_music' ? (
                  <HeroChip label={t('meditation.categories.tryMeditationMusic')} selected={false} onPress={() => setSoundCategory('meditation_music')} activeColor={dashboardColors.accent} />
                ) : null}
                <HeroChip label={t('meditation.categories.clearFilters')} selected={false} onPress={clearFilters} activeColor={dashboardColors.accent} />
              </View>
            ) : null}
          </View>
        ) : (
          filtered.map((item, index) => (
            <FadeSlideIn key={item.id} delay={Math.min(index, MAX_STAGGER_STEPS) * motion.staggerStepMs} fromX={-18} fromY={6} fromScale={0.94}>
              <MeditationListItem meditation={item} onPress={() => openMeditation(item.id)} />
            </FadeSlideIn>
          ))
        )}
      </View>
    </SectionHeroLayout>
  );
};
