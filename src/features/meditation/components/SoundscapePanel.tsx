import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { MeditationStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroChip } from '@/components/common/HeroChip';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppSelector } from '@/store/hooks';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { AmbientSound } from '../ambientSounds';
import { getPlayableAmbientSounds } from '../meditationAmbientAudio';
import { DEFAULT_SOUNDSCAPE_DURATION_SECONDS, SOUNDSCAPE_DURATION_OPTIONS_SECONDS } from '../meditationCollections';
import { MeditationTopic } from '../models';
import { selectMeditationContent, selectMeditationsByFilters } from '../selectors';
import { getAmbientArtKind } from './MeditationArt';
import { MeditationArtCard } from './MeditationArtCard';
import { MeditationListItem } from './MeditationListItem';

export interface SoundscapeSelection {
  /** null = a silent, timer-only session. */
  ambientSoundId: string | null;
  durationSeconds: number;
  /** Already localized - used as the session's title in the Player and in history. */
  title: string;
}

/** The single translation from a soundscape choice to a Player session - every entry point starts a soundscape through this, so they cannot drift apart. */
export function toSoundscapePlayerParams(selection: SoundscapeSelection): MeditationStackParamList['MeditationPlayer'] {
  return { meditationId: null, type: 'free', durationSeconds: selection.durationSeconds, ambientSoundId: selection.ambientSoundId, title: selection.title };
}

interface SoundscapePanelProps {
  initialSoundId?: string | null;
  initialDurationSeconds?: number;
  /** Adds a "Silence" tile for the Short Sessions route, where a plain timer was previously offered. */
  allowSilence?: boolean;
  /** Restricts the ready-made session list to these topics (a collection); omit to list them all. */
  topics?: MeditationTopic[];
  onStart: (selection: SoundscapeSelection) => void;
  onOpenMeditation: (meditationId: string) => void;
}

const SILENCE = 'silence';

/**
 * The one soundscape chooser - pure nature sounds, no music, no voice. Used by
 * the dedicated Soundscapes screen (Meditation landing, Short Sessions) and by
 * Start Meditation -> Unguided -> "Sounds only", so every entry point offers
 * the same sounds and hands the Player the same session request.
 *
 * Only sounds that can genuinely play are listed (see getPlayableAmbientSounds).
 */
export const SoundscapePanel: React.FC<SoundscapePanelProps> = ({ initialSoundId, initialDurationSeconds, allowSilence = false, topics, onStart, onOpenMeditation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const content = useAppSelector(selectMeditationContent);
  const sounds = useMemo(() => getPlayableAmbientSounds(), []);

  const [selectedId, setSelectedId] = useState<string | null>(() => (initialSoundId && sounds.some((s) => s.id === initialSoundId) ? initialSoundId : sounds[0]?.id ?? null));
  const [silenceSelected, setSilenceSelected] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(initialDurationSeconds ?? DEFAULT_SOUNDSCAPE_DURATION_SECONDS);

  const soundLabel = useCallback((sound: AmbientSound) => t(`meditation.ambient.sounds.${sound.type}`), [t]);
  const selectedSound = silenceSelected ? undefined : sounds.find((sound) => sound.id === selectedId);

  const readyMade = useMemo(
    () =>
      selectMeditationsByFilters(content, { mode: 'free', soundCategories: ['nature', 'ambient'], topics, includeComingSoon: false }).filter(
        (item) => item.status === 'published'
      ),
    [content, topics]
  );

  const start = useCallback(() => {
    if (!silenceSelected && !selectedSound) return;
    onStart({
      ambientSoundId: silenceSelected ? null : selectedSound!.id,
      durationSeconds,
      title: silenceSelected ? t('meditation.soundscapes.silence') : soundLabel(selectedSound!),
    });
  }, [silenceSelected, selectedSound, durationSeconds, onStart, soundLabel, t]);

  const minutes = Math.round(durationSeconds / 60);
  const startLabel = silenceSelected
    ? t('meditation.soundscapes.startWith', { sound: t('meditation.soundscapes.silence'), minutes })
    : selectedSound
      ? t('meditation.soundscapes.startWith', { sound: soundLabel(selectedSound), minutes })
      : t('meditation.soundscapes.start');

  const rows: (AmbientSound | typeof SILENCE)[] = allowSilence ? [...sounds, SILENCE] : sounds;
  const pairs: (AmbientSound | typeof SILENCE)[][] = [];
  for (let i = 0; i < rows.length; i += 2) pairs.push(rows.slice(i, i + 2));

  return (
    <View>
      <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginBottom: theme.spacing.xs }}>
        {t('meditation.soundscapes.chooseSound')}
      </AppText>
      {pairs.map((pair, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
          {pair.map((item, colIndex) => {
            const margin = colIndex === 0 && pair.length > 1 ? { marginRight: theme.spacing.sm } : null;
            if (item === SILENCE) {
              return (
                <MeditationArtCard
                  key={SILENCE}
                  kind="unguided"
                  seed={SILENCE}
                  title={t('meditation.soundscapes.silence')}
                  subtitle={t('meditation.soundscapes.silenceSub')}
                  height={96}
                  selected={silenceSelected}
                  onPress={() => setSilenceSelected(true)}
                  style={margin}
                />
              );
            }
            return (
              <MeditationArtCard
                key={item.id}
                kind={getAmbientArtKind(item.type)}
                seed={item.id}
                title={soundLabel(item)}
                height={96}
                selected={!silenceSelected && selectedId === item.id}
                onPress={() => {
                  setSilenceSelected(false);
                  setSelectedId(item.id);
                }}
                style={margin}
              />
            );
          })}
          {pair.length === 1 ? <View style={{ flex: 1, marginLeft: theme.spacing.sm }} /> : null}
        </View>
      ))}

      <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.xs }}>
        {t('meditation.soundscapes.duration')}
      </AppText>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={SOUNDSCAPE_DURATION_OPTIONS_SECONDS}
        keyExtractor={(seconds) => String(seconds)}
        style={{ marginBottom: theme.spacing.md, flexGrow: 0 }}
        renderItem={({ item: seconds }) => (
          <HeroChip
            label={t('meditation.soundscapes.minutes', { minutes: Math.round(seconds / 60) })}
            selected={durationSeconds === seconds}
            onPress={() => setDurationSeconds(seconds)}
            activeColor={dashboardColors.accent}
          />
        )}
      />

      <AppGradientButton label={startLabel} onPress={start} />

      {readyMade.length > 0 ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginBottom: theme.spacing.xs }}>
            {t('meditation.soundscapes.readyMade')}
          </AppText>
          {readyMade.map((item) => (
            <MeditationListItem key={item.id} meditation={item} onPress={() => onOpenMeditation(item.id)} />
          ))}
        </View>
      ) : null}
    </View>
  );
};
