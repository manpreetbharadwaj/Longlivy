import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { AVATAR_PRESETS, INITIAL_AVATAR_ID } from '@/features/profile/avatars';
import { UserAvatar } from './UserAvatar';

interface AvatarPickerModalProps {
  visible: boolean;
  /** Currently-selected avatar id (`undefined` / `'initial'` → the initial tile). */
  selectedId?: string | null;
  /** Name used to preview the "Initial" tile. */
  name?: string | null;
  onClose: () => void;
  /** Fires with the chosen id — `INITIAL_AVATAR_ID` or an `avatar_*` preset id. Persisting is the caller's job (the existing Edit Profile save). */
  onConfirm: (id: string) => void;
}

const AVATAR_SIZE = 66;
const TILE_WIDTH = AVATAR_SIZE + 18;

interface Option {
  id: string;
  /** Screen-reader label. */
  label: string;
  /** Short visible caption under the tile. Preset motif names are proper-noun-ish and kept as-is for now. */
  caption: string;
}

/**
 * Avatar chooser for the Edit Profile flow. Modelled on `ConfirmDialog` — a
 * themed fade/scale `Modal` rather than a native sheet, so it sits cleanly
 * on the app's dark hero surfaces. Selection is local until "Done";
 * "Cancel" discards. No image upload / camera / cropping — just the initial
 * and the built-in presets.
 */
export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({ visible, selectedId, name, onClose, onConfirm }) => {
  const { t } = useTranslation();
  const [choice, setChoice] = useState<string>(selectedId || INITIAL_AVATAR_ID);
  const progress = useSharedValue(0);

  const options: Option[] = [
    { id: INITIAL_AVATAR_ID, label: t('avatarPicker.useInitial'), caption: t('avatarPicker.initial') },
    ...AVATAR_PRESETS.map((preset) => ({ id: preset.id, label: t('avatarPicker.avatarLabel', { name: preset.label }), caption: preset.label })),
  ];

  useEffect(() => {
    if (visible) setChoice(selectedId || INITIAL_AVATAR_ID);
  }, [visible, selectedId]);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.decelerate });
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: 0.94 + progress.value * 0.06 }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={[
          { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center', padding: 20 },
          backdropStyle,
        ]}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={onClose}
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
        />
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 360,
              maxHeight: '82%',
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
            {t('avatarPicker.title')}
          </AppText>
          <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center" style={{ marginTop: 4, marginBottom: 16 }}>
            {t('avatarPicker.subtitle')}
          </AppText>

          <ScrollView
            style={{ alignSelf: 'stretch', flexShrink: 1 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, paddingVertical: 2 }}
            showsVerticalScrollIndicator={false}
          >
            {options.map((option) => {
              const selected = choice === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setChoice(option.id)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => ({ width: TILE_WIDTH, alignItems: 'center', opacity: pressed ? 0.75 : 1 })}
                >
                  <View
                    style={{
                      padding: 5,
                      borderRadius: TILE_WIDTH / 2,
                      borderWidth: 2,
                      borderColor: selected ? dashboardColors.accent : 'transparent',
                      backgroundColor: selected ? 'rgba(122,151,176,0.16)' : 'transparent',
                    }}
                  >
                    <UserAvatar
                      size={AVATAR_SIZE}
                      avatarId={option.id === INITIAL_AVATAR_ID ? undefined : option.id}
                      name={name}
                      ring={option.id === INITIAL_AVATAR_ID}
                    />
                    {selected ? (
                      <View
                        style={{
                          position: 'absolute',
                          right: 0,
                          bottom: 0,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: dashboardColors.accent,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 2,
                          borderColor: 'rgba(20,22,26,0.98)',
                        }}
                      >
                        <AppIcon name="checkmark" size={12} color={dashboardColors.background} />
                      </View>
                    ) : null}
                  </View>
                  <AppText
                    variant="caption"
                    color={selected ? dashboardColors.textPrimary : dashboardColors.textSecondary}
                    align="center"
                    numberOfLines={1}
                    style={{ marginTop: 6, maxWidth: TILE_WIDTH }}
                  >
                    {option.caption}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
            <FooterButton label={t('avatarPicker.cancel')} tone="ghost" onPress={onClose} />
            <FooterButton label={t('avatarPicker.done')} tone="solid" onPress={() => onConfirm(choice)} />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const FooterButton: React.FC<{ label: string; tone: 'ghost' | 'solid'; onPress: () => void }> = React.memo(({ label, tone, onPress }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => ({
      flex: 1,
      height: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tone === 'solid' ? dashboardColors.accent : 'transparent',
      borderWidth: tone === 'ghost' ? 1.5 : 0,
      borderColor: dashboardColors.borderStrong,
      opacity: pressed ? 0.85 : 1,
    })}
  >
    <AppText variant="headingSmall" color={tone === 'solid' ? dashboardColors.background : dashboardColors.textPrimary}>
      {label}
    </AppText>
  </Pressable>
));
FooterButton.displayName = 'FooterButton';
