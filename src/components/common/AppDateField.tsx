import React, { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid, DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { AppButton } from './AppButton';

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
  const [iosModalVisible, setIosModalVisible] = useState(false);
  const [draftValue, setDraftValue] = useState(value);
  const hero = variant === 'hero';

  const openPicker = useCallback(() => {
    if (Platform.OS === 'android') {
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
      setIosModalVisible(true);
    }
  }, [value, mode, maximumDate, minimumDate, onChange]);

  const confirmIos = useCallback(() => {
    onChange(draftValue);
    setIosModalVisible(false);
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

      {Platform.OS !== 'android' ? (
        <Modal visible={iosModalVisible} transparent animationType="slide" onRequestClose={() => setIosModalVisible(false)}>
          <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay }}>
            <View style={{ backgroundColor: theme.colors.surface, borderTopLeftRadius: theme.radius.xl, borderTopRightRadius: theme.radius.xl, padding: theme.spacing.md }}>
              <AppText variant="headingSmall" align="center" style={{ marginBottom: theme.spacing.sm }}>
                {label}
              </AppText>
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
              <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
                <AppButton label="Cancel" variant="outline" onPress={() => setIosModalVisible(false)} style={{ flex: 1, marginRight: theme.spacing.xs }} />
                <AppButton label="Done" onPress={confirmIos} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
});

AppDateField.displayName = 'AppDateField';
