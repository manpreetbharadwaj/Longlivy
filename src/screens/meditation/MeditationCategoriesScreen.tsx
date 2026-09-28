import React, { useState, useMemo, useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { MEDITATION_TOPICS, MeditationTopic, MeditationType, MEDITATION_DURATION_PRESETS_SECONDS } from '@/features/meditation/models';
import { getMeditationTopicLabel, getMeditationModeLabel, getMeditationEmptyStateMessage } from '@/features/meditation/meditationTaxonomy';
import { getMeditationCollection } from '@/features/meditation/meditationCollections';
import { MeditationListItem } from '@/features/meditation/components/MeditationListItem';
import { MeditationArt } from '@/features/meditation/components/MeditationArt';
import { SoundscapePanel, toSoundscapePlayerParams } from '@/features/meditation/components/SoundscapePanel';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

// Caps how many steps of stagger delay accumulate — same reasoning as
// StaggerGroup's own `maxSteps`: without a cap, the tail of a long list
// would take an oddly long time to finish revealing itself.
const MAX_STAGGER_STEPS = 8;

type UnguidedAudio = 'music' | 'sounds';

/**
 * Discovery/browse surface for both Guided and Unguided content — one screen
 * with contextual filters rather than near-identical screens per mode.
 * Breathing stays on its own dedicated flow (see BreathingExerciseScreen).
 *
 * Under Unguided the listener first chooses the audio: instrumental Music
 * (browse the tracks) or Sounds only (pure nature sounds - the same
 * soundscape chooser the landing opens directly, so both routes behave alike).
 */
export const MeditationCategoriesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationCategories'>>();
  const content = useAppSelector(selectMeditationContent);
  const collection = route.params?.collection ? getMeditationCollection(route.params.collection) : null;

  // Seeded once from navigation params (initial browse intent, per Phase 2C
  // Section 9) — deliberately NOT re-synced from route.params after mount,
  // so a user's in-screen filter changes are never clobbered by the params
  // that opened the screen.
  const [mode, setMode] = useState<MeditationType>(route.params?.mode ?? (route.params?.audio || route.params?.soundCategory ? 'free' : 'guided'));
  const [topic, setTopic] = useState<MeditationTopic | null>(route.params?.topic ?? null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(route.params?.durationSeconds ?? null);
  const [audio, setAudio] = useState<UnguidedAudio>(
    route.params?.audio ?? (route.params?.soundCategory && route.params.soundCategory !== 'meditation_music' ? 'sounds' : 'music')
  );

  const isUnguided = mode === 'free';
  const isSoundsOnly = isUnguided && audio === 'sounds';
  const collectionTopics = collection && collection.topics.length > 0 ? collection.topics : undefined;

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
  const audioOptions = useMemo(
    () => [
      { key: 'music' as const, label: t('meditation.audio.music') },
      { key: 'sounds' as const, label: t('meditation.audio.soundsOnly') },
    ],
    [t]
  );
  // A single-topic collection (Sleep, Focus) has nothing to narrow, so it
  // shows no topic chips at all; a multi-topic one offers just its own topics.
  // Sounds only has no topics of its own (a rain recording isn't 'about' anything), so no chips there either.
  const showTopicChips = !isSoundsOnly && (!collection || (collectionTopics?.length ?? 0) > 1);
  const topicChips = useMemo(
    () => [
      { key: 'all' as const, label: t('meditation.categories.all') },
      ...(collectionTopics ?? MEDITATION_TOPICS).map((topicOption) => ({ key: topicOption, label: getMeditationTopicLabel(topicOption, t) })),
    ],
    [t, collectionTopics]
  );
  const durationChips = useMemo(
    () => [
      { key: 'all' as const, label: t('meditation.categories.all') },
      ...MEDITATION_DURATION_PRESETS_SECONDS.map((seconds) => ({ key: seconds, label: `${Math.round(seconds / 60)} Min` })),
    ],
    [t]
  );

  const filtered = useMemo(
    () =>
      selectMeditationsByFilters(content, {
        mode,
        topic: topic ?? undefined,
        topics: collectionTopics,
        // Duration/sound are Unguided-only dimensions — a value left over
        // from a previous Unguided visit must never silently narrow Guided.
        durationSeconds: isUnguided ? durationSeconds ?? undefined : undefined,
        soundCategory: isUnguided ? 'meditation_music' : undefined,
      }),
    [content, mode, topic, collectionTopics, durationSeconds, isUnguided]
  );

  const openMeditation = useCallback((meditationId: string) => navigation.navigate('MeditationDetails', { meditationId }), [navigation]);

  const clearFilters = useCallback(() => {
    setTopic(null);
    setDurationSeconds(null);
  }, []);

  const hasNarrowingFilter = topic != null || durationSeconds != null;
  const filterKey = `${mode}-${audio}-${topic ?? 'all'}-${durationSeconds ?? 'all'}`;

  const screenTitle = collection ? t(`meditation.collections.${collection.id}.title`) : t(isUnguided ? 'meditation.categories.unguidedTitle' : 'meditation.categories.guidedTitle');
  const bannerKind = collection ? collection.art : isUnguided ? 'unguided' : 'guided';
  const bannerSubtitle = collection
    ? t(`meditation.collections.${collection.id}.subtitle`)
    : t(isUnguided ? 'meditation.practices.unguidedSub' : 'meditation.practices.guidedSub');

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={screenTitle} onBack={() => navigation.goBack()}>
      <View style={{ height: 96, borderRadius: 20, overflow: 'hidden', marginBottom: theme.spacing.md, borderWidth: 1, borderColor: dashboardColors.border }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          <MeditationArt key={bannerKind} kind={bannerKind} seed="banner" />
        </View>
        <LinearGradient colors={['rgba(6,8,10,0)', 'rgba(6,8,10,0.7)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '75%' }} pointerEvents="none" />
        <View style={{ flex: 1, justifyContent: 'flex-end', padding: theme.spacing.sm }}>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.85)">
            {bannerSubtitle}
          </AppText>
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
        {modeOptions.map((option) => (
          <HeroChip key={option.key} label={option.label} selected={mode === option.key} onPress={() => setMode(option.key)} activeColor={dashboardColors.accent} />
        ))}
      </View>

      {isUnguided ? (
        <View style={{ marginBottom: theme.spacing.sm }}>
          <AppText variant="caption" color={dashboardColors.textMuted} style={{ marginBottom: theme.spacing.xxs }}>
            {t('meditation.audio.label')}
          </AppText>
          <View style={{ flexDirection: 'row' }}>
            {audioOptions.map((option) => (
              <HeroChip key={option.key} label={option.label} selected={audio === option.key} onPress={() => setAudio(option.key)} activeColor={dashboardColors.accent} />
            ))}
          </View>
          <AppText variant="caption" color={dashboardColors.textSecondary} style={{ marginTop: theme.spacing.xxs }}>
            {t(isSoundsOnly ? 'meditation.audio.soundsHint' : 'meditation.audio.musicHint')}
          </AppText>
        </View>
      ) : null}

      {showTopicChips ? (
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
      ) : null}

      {isUnguided && !isSoundsOnly ? (
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
      ) : null}

      {isSoundsOnly ? (
        <View style={{ marginTop: theme.spacing.xs }}>
          <SoundscapePanel
            topics={collectionTopics}
            onStart={(selection) => navigation.navigate('MeditationPlayer', toSoundscapePlayerParams(selection))}
            onOpenMeditation={openMeditation}
          />
        </View>
      ) : (
        /* Keyed on the active filter combination so the whole block remounts
           — and its staggered entrance replays — the instant filters change. */
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
                {getMeditationEmptyStateMessage(t, { topic, durationSeconds, soundCategory: null })}
              </AppText>
              {hasNarrowingFilter ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: theme.spacing.md }}>
                  {topic != null && durationSeconds != null ? (
                    <HeroChip
                      label={t('meditation.categories.showAllTopic', { topic: getMeditationTopicLabel(topic, t) })}
                      selected={false}
                      onPress={() => setDurationSeconds(null)}
                      activeColor={dashboardColors.accent}
                    />
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
      )}
    </SectionHeroLayout>
  );
};
