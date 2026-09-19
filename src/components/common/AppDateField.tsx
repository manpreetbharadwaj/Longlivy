import React, { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { darkColors } from '@/theme/colors';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { AppButton } from './AppButton';
import { FadeSlideIn } from './FadeSlideIn';
import { WheelDatePicker } from './WheelDatePicker';

interface AppDateFieldProps {
  label: string;
  mode: 'date' | 'time';
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  /** 'hero' styles the trigger for a dark gradient background (see OnboardingStepLayout's hero variant) — the picker itself is unchanged. */
  variant?: 'default' | 'hero';
}

function formatValue(value: Date, mode: 'date' | 'time'): string {
  return mode === 'date'
    ? value.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Every date/time field in the app should use this instead of a free-text
 * input — it always produces a valid, unambiguous value and matches the
 * platform's native picker UX (a spinner sheet on iOS, the system dialog on
 * Android) instead of asking the user to type "YYYY-MM-DD" correctly.
 */
export const AppDateField: React.FC<AppDateFieldProps> = React.memo(({ label, mode, value, onChange, maximumDate, minimumDate, variant = 'default' }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const hero = variant === 'hero';
  // Date fields get Longlivy's own wheel picker (identical look and
  // interaction on both platforms — see WheelDatePicker); time fields stay
  // on the platform-native picker (a spinner sheet on iOS, the system
  // dialog on Android) unchanged — this task is scoped to date-of-birth
  // specifically, and other screens already depend on the native time
  // picker's current behavior.
  const useWheelPicker = mode === 'date';
  // `theme.colors` follows the *system's* light/dark setting, but a `hero`
  // field always sits on a hardcoded-dark background (onboarding's own
  // atmosphere) regardless of that setting — so its picker sheet needs to
  // stay dark too, or it renders as a light sheet popping up over a dark
  // screen. Non-hero fields keep following the live theme as before.
  const modalColors = hero ? darkColors : theme.colors;
  // RN's `Modal` renders as its own top-level native window rather than
  // reusing the screen's own `SafeAreaView` — on Android, with this
  // project's edge-to-edge configuration, that window draws *behind* the
  // system navigation bar, so the sheet's fixed padding alone left the
  // Cancel/Confirm row partially covered by it (gesture pill or 3-button
  // bar, whichever the device has). `useSafeAreaInsets()` still reports
  // this window's real bottom inset correctly (it queries the native
  // window directly, not inherited context), so adding it as extra bottom
  // padding — instead of a guessed fixed value — clears whatever the
  // actual nav bar height is on that specific device. iOS already handles
  // this correctly on its own, so this is scoped to Android only.
  const sheetBottomPadding = Platform.OS === 'android' ? theme.spacing.md + insets.bottom : theme.spacing.md;

  const openPicker = useCallback(() => {
    if (!useWheelPicker && Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode,
        maximumDate,
        minimumDate,
        onChange: (event: DateTimePickerEvent, selected?: Date) => {
          if (event.type === 'set' && selected) onChange(selected);
        },
      });
    } else {
      setDraftValue(value);
      setModalVisible(true);
    }
  }, [value, mode, maximumDate, minimumDate, onChange, useWheelPicker]);

  const confirmModal = useCallback(() => {
    onChange(draftValue);
    setModalVisible(false);
  }, [draftValue, onChange]);

  return (
    <View>
      <AppText variant="label" color={hero ? 'rgba(255,255,255,0.65)' : theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xxs }}>
        {label}
      </AppText>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={{
          height: theme.componentSizes.inputHeight,
          borderRadius: theme.radius.md,
          borderWidth: hero ? 1.5 : 1,
          borderColor: hero ? 'rgba(255,255,255,0.16)' : theme.colors.border,
          backgroundColor: hero ? 'rgba(255,255,255,0.08)' : theme.colors.surfaceElevated,
          paddingHorizontal: theme.spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <AppText variant="bodyLarge" color={hero ? '#FFFFFF' : undefined}>
          {formatValue(value, mode)}
        </AppText>
        <AppIcon name={mode === 'date' ? 'calendar-outline' : 'time-outline'} size={18} color={hero ? 'rgba(255,255,255,0.55)' : theme.colors.textTertiary} />
      </Pressable>

      {useWheelPicker || Platform.OS !== 'android' ? (
        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: modalColors.overlay }}>
            <FadeSlideIn fromY={24} fromScale={0.98}>
              <View
                style={{
                  backgroundColor: modalColors.surface,
                  borderTopLeftRadius: theme.radius.xl,
                  borderTopRightRadius: theme.radius.xl,
                  borderWidth: 1,
                  borderBottomWidth: 0,
                  borderColor: modalColors.border,
                  padding: theme.spacing.md,
                  paddingBottom: sheetBottomPadding,
                }}
              >
                <AppText variant="headingSmall" align="center" color={modalColors.textPrimary} style={{ marginBottom: theme.spacing.sm }}>
                  {label}
                </AppText>
                {useWheelPicker ? (
                  <WheelDatePicker value={draftValue} maximumDate={maximumDate} minimumDate={minimumDate} onChange={setDraftValue} colors={modalColors} />
                ) : (
                  <DateTimePicker
                    value={draftValue}
                    mode={mode}
                    display="spinner"
                    maximumDate={maximumDate}
                    minimumDate={minimumDate}
                    onChange={(_event: DateTimePickerEvent, selected?: Date) => {
                      if (selected) setDraftValue(selected);
                    }}
                  />
                )}
                <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
                  <AppButton label="Cancel" variant="outline" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: theme.spacing.xs }} />
                  <AppButton label={useWheelPicker ? 'Confirm' : 'Done'} onPress={confirmModal} style={{ flex: 1 }} />
                </View>
              </View>
            </FadeSlideIn>
          </View>
        </Modal>
      ) : null}
    </View>
  );
});

AppDateField.displayName = 'AppDateField';
