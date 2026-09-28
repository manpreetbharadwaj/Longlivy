import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { AmbientSound } from '../ambientSounds';
import { getPlayableAmbientSounds } from '../meditationAmbientAudio';

interface AmbientSoundPickerModalProps {
  visible: boolean;
  /** null = no ambient sound selected ("None"). */
  selectedId: string | null;
  /** Ids from getRecommendedAmbientSounds() for the session's current topic. */
  recommendedIds: string[];
  /** 0..1 — the ambient layer's current volume, shown/adjusted via the in-sheet control for whichever sound is selected. */
  volume: number;
  onVolumeChange: (volume: number) => void;
  onClose: () => void;
  onSelect: (id: string | null) => void;
}

const VOLUME_STEPS = 5;

/**
 * Soundscape picker — modelled on AvatarPickerModal's themed fade/scale
 * Modal so it matches the rest of the app's picker sheets. Only sounds that
 * can actually play are listed (getPlayableAmbientSounds) - there are no
 * disabled "Coming Soon" rows to tap. Sound titles render through `t()` keyed by
 * `sound.type`, not the catalog's own `title` field — the catalog's title is
 * CMS/content-management data, localization stays centralized the same way
 * getMeditationTopicLabel() is (Phase 6). Picking "None" closes the sheet immediately
 * (nothing left to configure); picking a real sound keeps the sheet open so
 * its volume can be adjusted right there, per Section 15.
 */
export const AmbientSoundPickerModal: React.FC<AmbientSoundPickerModalProps> = ({ visible, selectedId, recommendedIds, volume, onVolumeChange, onClose, onSelect }) => {
  const { t } = useTranslation();
  const progress = useSharedValue(0);
  const playableSounds = useMemo(() => getPlayableAmbientSounds(), []);
  const selectedSound = selectedId ? playableSounds.find((sound) => sound.id === selectedId) : undefined;

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.decelerate });
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: 0.94 + progress.value * 0.06 }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 }, backdropStyle]}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onClose} accessibilityLabel={t('common.close')} accessibilityRole="button" />
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 360,
              maxHeight: '78%',
              borderRadius: 24,
              padding: 20,
              backgroundColor: 'rgba(20,22,26,0.98)',
              borderWidth: 1.5,
              borderColor: dashboardColors.borderStrong,
            },
            cardStyle,
          ]}
        >
          <AppText variant="headingMedium" color={dashboardColors.textPrimary} align="center">
            {t('meditation.ambient.title')}
          </AppText>
          <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center" style={{ marginTop: 4, marginBottom: 16 }}>
            {t('meditation.ambient.subtitle')}
          </AppText>

          <ScrollView style={{ alignSelf: 'stretch', flexShrink: 1 }} showsVerticalScrollIndicator={false}>
            <SoundRow
              label={t('meditation.ambient.none')}
              selected={selectedId === null}
              recommended={false}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
            />
            {playableSounds.map((sound: AmbientSound) => (
              <SoundRow
                key={sound.id}
                label={t(`meditation.ambient.sounds.${sound.type}`)}
                selected={selectedId === sound.id}
                recommended={recommendedIds.includes(sound.id)}
                onPress={() => onSelect(sound.id)}
              />
            ))}
          </ScrollView>

          {selectedSound ? (
            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: dashboardColors.border }}>
              <AppText variant="bodySmall" color={dashboardColors.textSecondary} style={{ marginBottom: 8 }}>
                {t(`meditation.ambient.sounds.${selectedSound.type}`)}
              </AppText>
              <VolumeControl volume={volume} onChange={onVolumeChange} />
            </View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const SoundRow: React.FC<{
  label: string;
  selected: boolean;
  recommended: boolean;
  onPress: () => void;
}> = React.memo(({ label, selected, recommended, onPress }) => {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        opacity: pressed ? 0.75 : 1,
      })}
    >
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <AppText variant="bodyLarge" color={selected ? dashboardColors.accent : dashboardColors.textPrimary}>
          {label}
        </AppText>
        {recommended ? (
          <View style={{ marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: dashboardColors.accent + '26' }}>
            <AppText variant="caption" color={dashboardColors.accent}>
              {t('meditation.ambient.recommended')}
            </AppText>
          </View>
        ) : null}
      </View>
      {selected ? <AppIcon name="checkmark" size={18} color={dashboardColors.accent} /> : null}
    </Pressable>
  );
});
SoundRow.displayName = 'SoundRow';

/**
 * A restrained 5-step tappable volume control (0/25/50/75/100%) rather than a
 * dragable slider — avoids adding a new native slider dependency (and the
 * rebuild that would require) for one small control, while still giving real
 * 0..1 range control internally.
 */
const VolumeControl: React.FC<{ volume: number; onChange: (volume: number) => void }> = React.memo(({ volume, onChange }) => {
  const { t } = useTranslation();
  const filledSteps = Math.round(volume * VOLUME_STEPS);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <AppIcon name="volume-low-outline" size={16} color={dashboardColors.textMuted} />
      <View style={{ flexDirection: 'row', flex: 1, marginHorizontal: 10, gap: 6 }}>
        {Array.from({ length: VOLUME_STEPS }).map((_, index) => {
          const stepLevel = index + 1;
          const filled = stepLevel <= filledSteps;
          return (
            <Pressable
              key={index}
              onPress={() => onChange(stepLevel / VOLUME_STEPS)}
              accessibilityRole="adjustable"
              accessibilityLabel={t('meditation.ambient.volume')}
              hitSlop={6}
              style={{ flex: 1, height: 20, justifyContent: 'flex-end' }}
            >
              <View
                style={{
                  height: 8 + index * 3,
                  borderRadius: 3,
                  backgroundColor: filled ? dashboardColors.accent : 'rgba(255,255,255,0.12)',
                }}
              />
            </Pressable>
          );
        })}
      </View>
      <AppIcon name="volume-high-outline" size={16} color={dashboardColors.textMuted} />
    </View>
  );
});
VolumeControl.displayName = 'VolumeControl';
