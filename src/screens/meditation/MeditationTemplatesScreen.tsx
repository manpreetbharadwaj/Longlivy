import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroChip } from '@/components/common/HeroChip';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { ctaGradient } from '@/theme/gradients';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationContent, selectMeditationTemplates, selectMeditationsByFilters } from '@/features/meditation/selectors';
import { saveMeditationTemplateThunk } from '@/features/meditation/meditationSlice';
import { MeditationTemplate } from '@/features/meditation/models';
import { getAmbientSound } from '@/features/meditation/ambientSounds';
import { getPlayableAmbientSounds } from '@/features/meditation/meditationAmbientAudio';
import { CustomMeditationAudio, getTemplateAudioMode, parseCustomMinutes, templateToPlayerParams } from '@/features/meditation/customMeditation';
import { MeditationArt, getAmbientArtKind, getMeditationArtKind } from '@/features/meditation/components/MeditationArt';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { generateId } from '@/utils/id';
import { selectCurrentUserId } from '@/features/auth/selectors';

const QUICK_MINUTES = [3, 5, 10, 15, 20, 30, 45, 60];

export const MeditationTemplatesScreen: React.FC = () => {
  const currentUserId = useAppSelector(selectCurrentUserId);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectMeditationTemplates);
  const content = useAppSelector(selectMeditationContent);
  const sounds = useMemo(() => getPlayableAmbientSounds(), []);
  const tracks = useMemo(
    () => selectMeditationsByFilters(content, { mode: 'free', soundCategory: 'meditation_music', includeComingSoon: false }).filter((item) => item.status === 'published'),
    [content]
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [minutesText, setMinutesText] = useState('10');
  const [audio, setAudio] = useState<CustomMeditationAudio>(sounds.length > 0 ? 'sounds' : 'silence');
  const [soundId, setSoundId] = useState<string | null>(sounds[0]?.id ?? null);
  const [trackId, setTrackId] = useState<string | null>(tracks[0]?.id ?? null);
  const [layerSoundId, setLayerSoundId] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  const minutes = parseCustomMinutes(minutesText);
  const audioOptions = useMemo(
    () => [
      ...(sounds.length > 0 ? [{ key: 'sounds' as const, label: t('meditation.templatesScreen.audioSoundsOnly') }] : []),
      ...(tracks.length > 0 ? [{ key: 'music' as const, label: t('meditation.templatesScreen.audioMusic') }] : []),
      { key: 'silence' as const, label: t('meditation.templatesScreen.audioSilence') },
    ],
    [sounds.length, tracks.length, t]
  );

  const soundName = useCallback((id: string) => {
    const sound = getAmbientSound(id);
    return sound ? t(`meditation.ambient.sounds.${sound.type}`) : id;
  }, [t]);

  const describe = useCallback(
    (template: MeditationTemplate) => {
      const mode = getTemplateAudioMode(template);
      const length = t('meditation.soundscapes.minutes', { minutes: Math.round(template.durationSeconds / 60) });
      if (mode === 'sounds') return `${length} · ${t('meditation.templatesScreen.summarySounds', { sound: soundName(template.backgroundSound!) })}`;
      if (mode === 'music') {
        const track = content.find((item) => item.id === template.contentId)?.title ?? '';
        return `${length} · ${template.backgroundSound ? t('meditation.templatesScreen.summaryMusicWithSound', { track, sound: soundName(template.backgroundSound) }) : track}`;
      }
      return `${length} · ${t('meditation.templatesScreen.summarySilence')}`;
    },
    [content, soundName, t]
  );

  const resetForm = useCallback(() => {
    setEditingId(null);
    setName('');
    setMinutesText('10');
    setAudio(sounds.length > 0 ? 'sounds' : 'silence');
    setSoundId(sounds[0]?.id ?? null);
    setTrackId(tracks[0]?.id ?? null);
    setLayerSoundId(null);
  }, [sounds, tracks]);

  const edit = useCallback(
    (template: MeditationTemplate) => {
      const mode = getTemplateAudioMode(template);
      setEditingId(template.id);
      setName(template.name);
      setMinutesText(String(Math.round(template.durationSeconds / 60)));
      setAudio(mode);
      setSoundId(mode === 'sounds' ? template.backgroundSound ?? null : sounds[0]?.id ?? null);
      setTrackId(mode === 'music' ? template.contentId ?? null : tracks[0]?.id ?? null);
      setLayerSoundId(mode === 'music' ? template.backgroundSound ?? null : null);
      setSavedNote(false);
    },
    [sounds, tracks]
  );

  const canSave = minutes != null && (audio !== 'sounds' || soundId != null) && (audio !== 'music' || trackId != null);

  const save = useCallback(() => {
    if (minutes == null || !canSave) return;
    const existing = templates.find((template) => template.id === editingId);
    const backgroundSound = audio === 'sounds' ? soundId ?? undefined : audio === 'music' ? layerSoundId ?? undefined : undefined;
    dispatch(
      saveMeditationTemplateThunk({
        breathingEnabled: false,
        closingSoundEnabled: true,
        ...existing,
        id: existing?.id ?? generateId('template'),
        userId: currentUserId,
        name: name.trim() || t('meditation.templatesScreen.defaultName'),
        durationSeconds: minutes * 60,
        type: 'free',
        backgroundSound,
        contentId: audio === 'music' ? trackId ?? undefined : undefined,
      })
    );
    resetForm();
    setSavedNote(true);
  }, [audio, canSave, currentUserId, dispatch, editingId, layerSoundId, minutes, name, resetForm, soundId, t, templates, trackId]);

  const start = useCallback((template: MeditationTemplate) => navigation.navigate('MeditationPlayer', templateToPlayerParams(template)), [navigation]);

  const chipRow = <T extends string>(items: { key: T; label: string }[], isSelected: (key: T) => boolean, onSelect: (key: T) => void) => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={items}
      keyExtractor={(item) => item.key}
      style={{ flexGrow: 0 }}
      renderItem={({ item }) => <HeroChip label={item.label} selected={isSelected(item.key)} onPress={() => onSelect(item.key)} activeColor={dashboardColors.accent} />}
    />
  );

  const sectionLabel = (label: string) => (
    <AppText variant="label" color="rgba(255,255,255,0.65)" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xxs }}>
      {label}
    </AppText>
  );

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.templatesScreen.title')} onBack={() => navigation.goBack()} keyboardShouldPersistTaps="handled">
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
        {t('meditation.templatesScreen.intro')}
      </AppText>

      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
          {t(editingId ? 'meditation.templatesScreen.editTemplate' : 'meditation.templatesScreen.newTemplate')}
        </AppText>
        <HeroTextField label={t('meditation.templatesScreen.name')} value={name} onChangeText={setName} placeholder={t('meditation.templatesScreen.defaultName')} maxLength={40} />

        {sectionLabel(t('meditation.templatesScreen.durationMinutes'))}
        {chipRow(
          QUICK_MINUTES.map((value) => ({ key: String(value), label: t('meditation.soundscapes.minutes', { minutes: value }) })),
          (key) => minutes === Number(key),
          (key) => setMinutesText(key)
        )}
        <View style={{ marginTop: theme.spacing.xs }}>
          <HeroTextField
            label={t('meditation.templatesScreen.customMinutes')}
            value={minutesText}
            onChangeText={setMinutesText}
            keyboardType="number-pad"
            maxLength={3}
            accessibilityLabel={t('meditation.templatesScreen.customMinutes')}
          />
          {minutes == null ? (
            <AppText variant="caption" color={dashboardColors.warning} style={{ marginTop: theme.spacing.xxs }}>
              {t('meditation.templatesScreen.durationInvalid')}
            </AppText>
          ) : null}
        </View>

        {sectionLabel(t('meditation.templatesScreen.audio'))}
        {chipRow(audioOptions, (key) => audio === key, setAudio)}

        {audio === 'sounds' ? (
          <>
            {sectionLabel(t('meditation.templatesScreen.sound'))}
            {chipRow(
              sounds.map((sound) => ({ key: sound.id, label: t(`meditation.ambient.sounds.${sound.type}`) })),
              (key) => soundId === key,
              setSoundId
            )}
          </>
        ) : null}

        {audio === 'music' ? (
          <>
            {sectionLabel(t('meditation.templatesScreen.musicTrack'))}
            {chipRow(
              tracks.map((track) => ({ key: track.id, label: track.title })),
              (key) => trackId === key,
              setTrackId
            )}
            {sounds.length > 0 ? (
              <>
                {sectionLabel(t('meditation.templatesScreen.backgroundSound'))}
                {chipRow(
                  [{ key: 'none', label: t('meditation.ambient.none') }, ...sounds.map((sound) => ({ key: sound.id, label: t(`meditation.ambient.sounds.${sound.type}`) }))],
                  (key) => (key === 'none' ? layerSoundId === null : layerSoundId === key),
                  (key) => setLayerSoundId(key === 'none' ? null : key)
                )}
              </>
            ) : null}
          </>
        ) : null}

        <View style={{ marginTop: theme.spacing.md }}>
          <AppGradientButton label={t(editingId ? 'meditation.templatesScreen.saveChanges' : 'meditation.templatesScreen.saveTemplate')} onPress={save} disabled={!canSave} colors={ctaGradient} />
          {editingId ? (
            <Pressable onPress={resetForm} accessibilityRole="button" style={{ alignItems: 'center', paddingVertical: theme.spacing.sm }}>
              <AppText variant="bodyMedium" color={dashboardColors.textSecondary}>
                {t('meditation.templatesScreen.cancelEdit')}
              </AppText>
            </Pressable>
          ) : null}
          {savedNote && !editingId ? (
            <AppText variant="caption" color={dashboardColors.success} align="center" style={{ marginTop: theme.spacing.xs }}>
              {t('meditation.templatesScreen.saved')}
            </AppText>
          ) : null}
        </View>
      </HeroCard>

      <AppText variant="headingSmall" color={dashboardColors.textPrimary} style={{ marginBottom: theme.spacing.xs }}>
        {t('meditation.templatesScreen.yourSessions')}
      </AppText>
      {templates.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
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
            <AppIcon name="bookmark-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            {t('meditation.templatesScreen.empty')}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            {t('meditation.templatesScreen.emptyBody')}
          </AppText>
        </View>
      ) : (
        templates.map((template) => {
          const track = template.contentId ? content.find((item) => item.id === template.contentId) : undefined;
          const sound = template.backgroundSound ? getAmbientSound(template.backgroundSound) : undefined;
          const artKind = track ? getMeditationArtKind(track) : sound ? getAmbientArtKind(sound.type) : 'unguided';
          return (
            <HeroCard key={template.id} style={{ marginBottom: theme.spacing.sm, padding: theme.spacing.xs, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 56, height: 56, borderRadius: theme.radius.md, overflow: 'hidden', marginRight: theme.spacing.sm }}>
                <MeditationArt kind={artKind} seed={template.id} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="headingSmall" color="#FFFFFF" numberOfLines={1}>
                  {template.name}
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" numberOfLines={2} accessibilityLabel={`${template.name}, ${describe(template)}`}>
                  {describe(template)}
                </AppText>
              </View>
              <Pressable
                onPress={() => edit(template)}
                accessibilityRole="button"
                accessibilityLabel={`${t('meditation.templatesScreen.edit')} ${template.name}`}
                hitSlop={8}
                style={{ padding: theme.spacing.xs }}
              >
                <AppIcon name="create-outline" size={20} color={dashboardColors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => start(template)}
                accessibilityRole="button"
                accessibilityLabel={`${t('meditation.templatesScreen.start')} ${template.name}`}
                style={{
                  height: 40,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: 20,
                  backgroundColor: dashboardColors.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: theme.spacing.xxs,
                  marginRight: theme.spacing.xxs,
                }}
              >
                <AppText variant="label" color="#FFFFFF">
                  {t('meditation.templatesScreen.start')}
                </AppText>
              </Pressable>
            </HeroCard>
          );
        })
      )}
    </SectionHeroLayout>
  );
};
